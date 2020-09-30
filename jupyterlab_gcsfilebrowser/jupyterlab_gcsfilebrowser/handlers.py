# Lint as: python3
"""Request handler classes for the extensions."""

import base64
import json
import re
import tornado.gen as gen
import os
import datetime
import notebook
import nbformat

from collections import namedtuple
from notebook.base.handlers import APIHandler, app_log

from google.cloud import storage  # used for connecting to GCS
from google.api_core.client_info import ClientInfo
from io import BytesIO, StringIO  # used for sending GCS blobs in JSON objects
from jupyterlab_gcsfilebrowser.version import VERSION

TEMPLATE_COPY_FILE = '-Copy%s'
TEMPLATE_NEW_FILE = '%s'
NEW_FILE_NAME = 'Untitled'
NEW_DIRECTORY_NAME = 'Untitled Folder'
CHECKPOINT_FOLDER = '.ipynb_checkpoints'
CHECKPOINT_ID = '-checkpoint'


class Error(Exception):
  """GCS Filebrowser exception."""
  pass


class FileNotFound(Error):
  """File not found exception."""
  pass


def list_dir(bucket_name, path, blobs_dir_list):
  items = []
  directories = set()
  directory_last_modified = dict()

  path = '%s%s' % (path, '' if re.match(".*/$", path) else '/')

  for blob in blobs_dir_list:
    relative_blob_name = re.sub(r'^' + path, '', blob.name)

    relative_path_parts = [dir for dir in relative_blob_name.split('/') if dir]

    if re.match(".*/$", blob.name):
      # Add the top directory to the set of directories if one exist
      if relative_path_parts:
        directories.add(relative_path_parts[0])
        directory_last_modified[relative_path_parts[0]] = blob_last_modified(
            blob)
    else:
      if relative_path_parts:
        dir_name = relative_path_parts[0]

        def blobInDir(parts):
          return len(parts) > 1

        if blobInDir(relative_path_parts):
          directories.add(relative_path_parts[0])
          directory_last_modified[relative_path_parts[0]] = blob_last_modified(
              blob)
        else:
          items.append({
              'type': 'file',
              'path': ('%s/%s' % (bucket_name, blob.name)),
              'name': dir_name,
              'last_modified': blob_last_modified(blob),
          })

  if path != '/':
    path = '/' + path

  items = items + [{
      'type': 'directory',
      'path': ('%s%s%s/' % (bucket_name, path, d)),
      'name': d + '/',
      'last_modified': directory_last_modified[d],
  } for d in directories]

  return items


# TODO(cbwilkes): Add tests for parse_path.
def parse_path(path):
  # Remove any preceeding '/', and split off the bucket name
  bucket_paths = re.sub(r'^/', '', path).split('/', 1)

  # The first token should represent the bucket name
  bucket_name = bucket_paths[0]

  # The rest of the string should represent the blob path, if requested
  blob_path = bucket_paths[1] if len(bucket_paths) > 1 else ''

  return bucket_name, blob_path


def prefixed_blobs(bucket_name, prefix, storage_client):
  return list(storage_client.list_blobs(bucket_name, prefix=prefix))


def matching_blobs(path, storage_client):
  """Find a blob with a name that matches the exact path. That is not a
     directory

  Returns:
    An array of matching Blobs.
  """

  # TODO(cbwilkes): Add tests for matching_blobs.
  # TODO(cbwilkes): Return matching blobs for directories.
  bucket_name, blob_path = parse_path(path)

  # List blobs in the bucket with the blob_path prefix
  blobs = prefixed_blobs(bucket_name, blob_path, storage_client)

  # Find a blob that is not a directory name and fully matches the blob_path
  # If there are any matches, we are retriving a single blob
  blobs_matching = [
      b for b in blobs
      # TODO(cbwilkes): protect against empty names
      if not re.match(".*/$", b.name) and b.name == blob_path
  ]

  return blobs_matching


def matching_directory(path, storage_client):
  """Find a blob with a name that matches the exact path. Must be a
     directory

  Returns:
    An array of matching Blobs.
  """

  # TODO(cbwilkes): Add tests for matching_blobs.
  # TODO(cbwilkes): Return matching blobs for directories.
  bucket_name, blob_path = parse_path(path)

  # List blobs in the bucket with the blob_path prefix
  blobs = prefixed_blobs(bucket_name, blob_path, storage_client)

  # Find a blob that is not a directory name and fully matches the blob_path
  # If there are any matches, we are retriving a single blob
  blobs_matching = [
      b for b in blobs
      # TODO(cbwilkes): protect against empty names
      if re.match(".*/$", b.name) and b.name == blob_path
  ]

  return blobs_matching


def directory_exist(path, storage_client):
  """Find if directory prefix exist.

  Returns:
    Boolean if directory prefix exist.
  """

  # TODO(cbwilkes): Add tests for matching_blobs.
  # TODO(cbwilkes): Return matching blobs for directories.
  bucket_name, blob_path = parse_path(path)

  # List blobs in the bucket with the blob_path prefix
  blobs = prefixed_blobs(bucket_name, blob_path, storage_client)

  blob_pattern = re.compile("^%s.*" % blob_path) if re.match(
      ".*/$", path) else re.compile("^%s/.*" % blob_path)
  blobs_matching = [b for b in blobs if blob_pattern.match(b.name)]
  return len(blobs_matching)


def matching_directory_contents(path, storage_client):
  """Find blobs within a directory.

  Returns:
    An array of matching Blobs.
  Raises:
    ValueError if 'path' is not a directory
  """

  if not path or path[-1] != '/':
    raise ValueError('Error: the path does not appear to be'
                     ' a directory ending with an trailing "/"')

  # TODO(cbwilkes): Add tests for matching_blobs.
  # TODO(cbwilkes): Return matching blobs for directories.
  bucket_name, blob_path = parse_path(path)

  # List blobs in the bucket with the blob_path prefix
  blobs = prefixed_blobs(bucket_name, blob_path, storage_client)

  return blobs


def matching_bucket(path, storage_client):
  bucket_name, _ = parse_path(path)

  # Raises google.cloud.exceptions.NotFound – If the bucket is not found.
  return storage_client.get_bucket(bucket_name)


def getPathContents(path, storage_client):
  path = path or '/'
  addDir = '/' if re.match(".+/$", path) else ''
  path = os.path.normpath(path) + addDir

  if path == '/':
    buckets = storage_client.list_buckets()
    return {
        'type':
            'directory',
        'content': [{
            'type': 'directory',
            'path': b.name + '/',
            'name': b.name + '/',
            'last_modified': bucket_time_created(b),
        } for b in buckets]
    }
  else:
    bucket_name, blob_path = parse_path(path)

    blobs_prefixed = prefixed_blobs(bucket_name, blob_path, storage_client)

    blobs_matching = matching_blobs(path, storage_client)
    directories_matching = matching_directory(path, storage_client)

    dir_exist = directory_exist(path, storage_client)

    # Bucket root or directory within bucket
    if not blob_path or dir_exist:
      return {
          'type': 'directory',
          'content': list_dir(bucket_name, blob_path, blobs_prefixed),
      }
    elif len(blobs_matching) == 1:  # Single blob
      blob = blobs_matching[0]
      file_bytes = BytesIO()
      blob.download_to_file(file_bytes)

      return {
          'type': 'file',
          'content': {
              'path': ('%s/%s' % (bucket_name, blob.name)),
              'type':
                  'file',
              'mimetype':
                  blob.content_type,
              'content':
                  base64.encodebytes(file_bytes.getvalue()).decode('ascii'),
              'last_modified':
                  blob_last_modified(blob),
          }
      }
    else:
      raise FileNotFound('File "%s" not found' % path)


def delete(path, storage_client):
  path = path or '/'
  addDir = '/' if re.match(".+/$", path) else ''
  path = os.path.normpath(path) + addDir

  if path == '/':
    return {}
  else:
    blobs_matching = matching_blobs(path, storage_client)

    if len(blobs_matching) == 1:  # Single blob
      blob = blobs_matching[0]
      blob.delete()
    elif not blobs_matching:
      # Fallback to deleting a directory if single blob is not found
      blobs_matching = matching_directory_contents(os.path.join(path, ''),
                                                   storage_client)

      for b in blobs_matching:
        b.delete()

    return {}


def upload(model, storage_client):
  bucket_name, blob_path = parse_path(model['path'])

  def uploadModel(storage_client, model, blob_path):
    bucket = storage_client.get_bucket(bucket_name)
    blob = bucket.blob(blob_path)
    if model['format'] == 'base64':
      bytes_file = BytesIO(base64.b64decode(model['content']))
      blob.upload_from_file(bytes_file)
    elif model['format'] == 'json':
      blob.upload_from_string(json.dumps(model['content']))
    else:
      blob.upload_from_string(model['content'])

  def appendChunk(storage_client,
                  model,
                  last,
                  temp,
                  composite,
                  deleteLast=False):
    bucket = storage_client.get_bucket(bucket_name)
    uploadModel(storage_client, model, temp)

    blob = bucket.blob(composite)

    blob_last = bucket.blob(last)
    blob_temp = bucket.blob(temp)

    blob.compose([blob_last, blob_temp])

    blob_temp.delete()

    if deleteLast:
      blob_last.delete()

  if 'chunk' not in model:
    uploadModel(storage_client, model, blob_path)
  else:
    if model['chunk'] == 1:
      blob_path_composite = '%s.temporary' % (blob_path)
      uploadModel(storage_client, model, blob_path_composite)
    elif model['chunk'] == -1:
      appendChunk(storage_client, model, '%s.temporary' % (blob_path),
                  '%s.temporary-%s.tmp' % (blob_path, model['chunk']),
                  blob_path, True)
    else:
      appendChunk(storage_client, model, '%s.temporary' % (blob_path),
                  '%s.temporary-%s.tmp' % (blob_path, model['chunk']),
                  '%s.temporary' % (blob_path))

  bucket = storage_client.get_bucket(bucket_name)
  return bucket.blob(blob_path)


def generate_next_unique_name(bucket_name,
                              blob_name,
                              storage_client,
                              template,
                              is_dir=False):

  def generate_name(blob_name, name_addendum):
    root, ext = os.path.splitext(blob_name)
    addendum = ''
    if name_addendum:
      addendum = template % name_addendum

    return '%s%s%s' % (root, addendum, ext)

  def generate_directory_name(blob_name, name_addendum):
    normpath = os.path.normpath(blob_name)
    addendum = ''
    if name_addendum:
      addendum = template % name_addendum

    return '%s%s%s' % (normpath, addendum, '/')

  name_addendum = ''

  if is_dir:
    proposed_blob_name = generate_directory_name(blob_name, name_addendum)
    while matching_directory(
        os.path.normpath('/%s/%s' % (bucket_name, proposed_blob_name)) + '/',
        storage_client):
      if not name_addendum:
        name_addendum = 1
      else:
        name_addendum = name_addendum + 1

      proposed_blob_name = generate_directory_name(blob_name, name_addendum)
    return generate_directory_name(blob_name, name_addendum)
  else:
    proposed_blob_name = generate_name(blob_name, name_addendum)
    while matching_blobs(
        os.path.normpath('/%s/%s' % (bucket_name, proposed_blob_name)),
        storage_client):
      if not name_addendum:
        name_addendum = 1
      else:
        name_addendum = name_addendum + 1

      proposed_blob_name = generate_name(blob_name, name_addendum)

    return generate_name(blob_name, name_addendum)


def copy(path, directory, storage_client):

  def copyFileName(path, directory):
    _, blob_name = parse_path(path)
    destination_bucket, destination_blob_name_dir = parse_path(directory)
    basename = os.path.basename(blob_name)

    if not basename:
      raise ValueError('"path" is not a valid blob name.')

    if destination_blob_name_dir:
      new_blob_name = '%s/%s' % (destination_blob_name_dir, basename)
    else:
      new_blob_name = '%s' % (basename)

    return destination_bucket, new_blob_name

  if directory in ('/', ''):
    raise ValueError('Error: Cannot copy file to the root directory. '
                     'Only GCS buckets can be created here.')

  blobs_matching = matching_blobs(path, storage_client)
  if not blobs_matching:
    raise ValueError('Error: Blob not found "%s"' % (path))

  current_bucket = matching_bucket(path, storage_client)
  destination_bucket_name, new_blob_name = copyFileName(path, directory)

  new_blob_name = generate_next_unique_name(destination_bucket_name,
                                            new_blob_name, storage_client,
                                            TEMPLATE_COPY_FILE)

  destination_bucket = storage_client.get_bucket(destination_bucket_name)

  return current_bucket.copy_blob(blobs_matching[0], destination_bucket,
                                  new_blob_name)


def move(old, new, storage_client):

  def add_directory_slash(path):
    return '%s/' % path if not path or path[-1] != '/' else path

  _, blob_path_new = parse_path(new)
  if not blob_path_new:
    raise ValueError('Error: Cannot copy file to the root directory. '
                     'Only GCS buckets can be created here.')

  blobs_matching = matching_blobs(old, storage_client)
  destination_bucket = matching_bucket(new, storage_client)

  new_blob = matching_blobs(new, storage_client)
  if new_blob:
    raise ValueError('Error: Cannot move object. A destination '
                     'object already exist with the same name.')

  new_dir = matching_directory(
      add_directory_slash(re.sub(r'^%s' % old, new, new)), storage_client)
  if new_dir:
    raise ValueError('Error: Cannot move object. The destination '
                     'directory already exist with the same name. (%s)' % new)

  # Fallback to moving directory if single blob is not found
  if not blobs_matching:
    blobs_matching = matching_directory_contents(add_directory_slash(old),
                                                 storage_client)

    _, blob_path_old = parse_path(old)
    for b in blobs_matching:
      new_blob_name = re.sub(r'^%s' % blob_path_old, blob_path_new, b.name)
      destination_bucket.rename_blob(b, new_blob_name)

    return matching_directory(add_directory_slash(new), storage_client)[0]
  else:  # Move single blob
    return destination_bucket.rename_blob(blobs_matching[0], blob_path_new)


def create_storage_client():
  return storage.Client(client_info=ClientInfo(
      user_agent='jupyterlab_gcsfilebrowser/{}'.format(VERSION)))


def new_file(file_type, ext, path, storage_client):
  model = dict()
  content = ''
  file_format = 'text'

  if file_type and file_type in ('notebook', 'file'):
    if file_type == 'notebook':
      ext = 'ipynb'
      file_format = 'json'
      content = {
          "cells": [],
          "metadata": {},
          "nbformat": 4,
          "nbformat_minor": 4
      }

    new_blob_name = '%s/%s.%s' % (path, NEW_FILE_NAME, ext)

    destination_bucket_name, blob_path = parse_path(new_blob_name)

    new_blob_name = generate_next_unique_name(destination_bucket_name,
                                              blob_path, storage_client,
                                              TEMPLATE_NEW_FILE)

    model['path'] = '%s/%s' % (destination_bucket_name, new_blob_name)
    model['content'] = content
    model['format'] = file_format
    blob = upload(model, storage_client)

    file_bytes = BytesIO()
    blob.download_to_file(file_bytes)

    return {
        'type': 'file',
        'content': {
            'path': ('%s/%s' % (blob.bucket.name, blob.name)),
            'name': os.path.basename(blob.name),
            'type': 'file',
            'mimetype': blob.content_type,
            'content': base64.encodebytes(file_bytes.getvalue()).decode('ascii')
        }
    }
  elif file_type and file_type == 'directory':
    new_blob_name = '%s/%s/' % (path, NEW_DIRECTORY_NAME)

    destination_bucket_name, blob_path = parse_path(new_blob_name)

    new_blob_name = generate_next_unique_name(destination_bucket_name,
                                              blob_path,
                                              storage_client,
                                              TEMPLATE_NEW_FILE,
                                              is_dir=True)

    model['path'] = '%s/%s' % (destination_bucket_name, new_blob_name)
    model['content'] = ''
    model['format'] = 'text'
    blob = upload(model, storage_client)

    return {
        'type': 'directory',
        'path': ('%s/%s' % (blob.bucket.name, blob.name)),
        'name': blob.name,
        'content': []
    }


def checkpoint_prefix(path):
  checkpoint_dir = os.path.join(os.path.dirname(path), CHECKPOINT_FOLDER)

  return os.path.join(os.path.dirname(path), CHECKPOINT_FOLDER,
                      os.path.basename(path))


def checkpoint_filename(path, checkpoint_id):
  checkpoint_dir = os.path.join(os.path.dirname(path), CHECKPOINT_FOLDER)

  return '%s%s' % (checkpoint_prefix(path), checkpoint_id)


def create_checkpoint(path, storage_client):
  checkpoint_pathname = checkpoint_filename(path, CHECKPOINT_ID)

  content = getPathContents(path, storage_client)

  model = {
      'format': 'base64',
      'content': content['content']['content'],
      'path': checkpoint_pathname,
  }

  blob = upload(model, storage_client)

  return {
      'checkpoint': {
          'id': CHECKPOINT_ID,
          'last_modified': blob_last_modified(blob)
      }
  }


def list_checkpoints(path, storage_client):
  bucket_name, blob_path = parse_path(checkpoint_prefix(path))
  blobs = prefixed_blobs(bucket_name, blob_path, storage_client)
  return {
      'checkpoints': [{
          'id': CHECKPOINT_ID,
          'last_modified': blob_last_modified(blob)
      } for blob in blobs]
  }


def restore_checkpoint(path, checkpoint_id, storage_client):
  checkpoint_pathname = checkpoint_filename(path, checkpoint_id)
  content = getPathContents(checkpoint_pathname, storage_client)

  model = {
      'format': 'base64',
      'content': content['content']['content'],
      'path': path,
  }

  blob = upload(model, storage_client)
  return {
      'checkpoint': {
          'id': CHECKPOINT_ID,
          'last_modified': blob_last_modified(blob)
      }
  }


def delete_checkpoint(path, checkpoint_id, storage_client):
  checkpoint_pathname = checkpoint_filename(path, checkpoint_id)
  delete(checkpoint_pathname, storage_client)
  return {}


def blob_last_modified(blob):
  return blob.updated.strftime("%Y-%m-%d %H:%M:%S %z") if blob.updated else ''


def bucket_time_created(bucket):
  return bucket.time_created.strftime(
      "%Y-%m-%d %H:%M:%S %z") if bucket.time_created else ''


class GCSHandler(APIHandler):
  """Handles requests for GCS operations."""
  storage_client = None

  @gen.coroutine
  def get(self, path=''):
    try:
      if not self.storage_client:
        self.storage_client = create_storage_client()

      self.finish(json.dumps(getPathContents(path, self.storage_client)))

    except FileNotFound as e:
      app_log.exception(str(e))
      self.set_status(404, str(e))
      self.finish({'error': {
          'message': str(e),
          'response': {
              'status': 404,
          },
      }})
    except Exception as e:
      app_log.exception(str(e))
      self.set_status(500, str(e))
      self.finish({'error': {'message': str(e)}})


class UploadHandler(APIHandler):

  storage_client = None

  @gen.coroutine
  def post(self, *args, **kwargs):

    try:
      if not self.storage_client:
        self.storage_client = create_storage_client()

      model = self.get_json_body()

      upload(model, self.storage_client)

      self.finish({})
    except Exception as e:
      app_log.exception(str(e))
      self.set_status(500, str(e))
      self.finish({'error': {'message': str(e)}})


class DeleteHandler(APIHandler):

  storage_client = None

  @gen.coroutine
  def delete(self, path=''):

    try:
      if not self.storage_client:
        self.storage_client = create_storage_client()

      self.finish(json.dumps(delete(path, self.storage_client)))

    except Exception as e:
      app_log.exception(str(e))
      self.set_status(500, str(e))
      self.finish({'error': {'message': str(e)}})


class MoveHandler(APIHandler):

  storage_client = None

  @gen.coroutine
  def post(self, path=''):

    move_obj = self.get_json_body()

    try:
      if not self.storage_client:
        self.storage_client = create_storage_client()

      blob = move(move_obj['oldLocalPath'], move_obj['newLocalPath'],
                  self.storage_client)

      file_bytes = BytesIO()
      blob.download_to_file(file_bytes)

      self.finish({
          'type': 'file',
          'content': {
              'path': ('%s/%s' % (blob.bucket.name, blob.name)),
              'name':
                  blob.name,
              'mimetype':
                  blob.content_type,
              'content':
                  base64.encodebytes(file_bytes.getvalue()).decode('ascii'),
              'last_modified':
                  blob_last_modified(blob),
          },
      })

    except Exception as e:
      app_log.exception(str(e))
      self.set_status(500, str(e))
      self.finish({'error': {'message': str(e)}})


class CopyHandler(APIHandler):

  storage_client = None

  @gen.coroutine
  def post(self, path=''):

    copy_obj = self.get_json_body()

    try:
      if not self.storage_client:
        self.storage_client = create_storage_client()

      blob = copy(copy_obj['localPath'], copy_obj['toLocalDir'],
                  self.storage_client)
      self.finish({
          'type': 'file',
          'path': ('%s/%s' % (blob.bucket.name, blob.name)),
          'name': blob.name
      })

    except Exception as e:
      app_log.exception(str(e))
      self.set_status(500, str(e))
      self.finish({'error': {'message': str(e)}})


class NewHandler(APIHandler):

  storage_client = None

  @gen.coroutine
  def post(self, path=''):

    new_obj = self.get_json_body()

    try:
      if not self.storage_client:
        self.storage_client = create_storage_client()

      self.finish(
          new_file(new_obj['type'], new_obj.get('ext', None), new_obj['path'],
                   self.storage_client))

    except Exception as e:
      app_log.exception(str(e))
      self.set_status(500, str(e))
      self.finish({'error': {'message': str(e)}})


class CheckpointHandler(APIHandler):

  storage_client = None

  @gen.coroutine
  def post(self, *args, **kwargs):

    checkpoint_obj = self.get_json_body()

    try:
      if not self.storage_client:
        self.storage_client = create_storage_client()

      if checkpoint_obj['action'] == 'createCheckpoint':
        checkpoint = create_checkpoint(checkpoint_obj['localPath'],
                                       self.storage_client)
        self.finish(checkpoint)
      if checkpoint_obj['action'] == 'listCheckpoints':
        checkpoints = list_checkpoints(checkpoint_obj['localPath'],
                                       self.storage_client)
        self.finish(checkpoints)
      if checkpoint_obj['action'] == 'restoreCheckpoint':
        checkpoint = restore_checkpoint(checkpoint_obj['localPath'],
                                        checkpoint_obj['checkpointID'],
                                        self.storage_client)
        self.finish(checkpoint)
      if checkpoint_obj['action'] == 'deleteCheckpoint':
        checkpoint = delete_checkpoint(checkpoint_obj['localPath'],
                                       checkpoint_obj['checkpointID'],
                                       self.storage_client)
        self.finish({})

    except Exception as e:
      app_log.exception(str(e))
      self.set_status(500, str(e))
      self.finish({'error': {'message': str(e)}})


class GCSNbConvert(APIHandler):
  """Handles requests for nbconvert for files in GCS."""
  storage_client = None

  @gen.coroutine
  def get(self, *args, **kwargs):

    try:
      if not self.storage_client:
        self.storage_client = create_storage_client()

      nb = getPathContents(args[1], self.storage_client)

      gcs_notebook = nbformat.reads(base64.b64decode(
          nb['content']['content']).decode('utf-8'),
                                    as_version=4)

      exporter = notebook.nbconvert.handlers.get_exporter(args[0])

      (output, resources) = exporter.from_notebook_node(gcs_notebook)
      # Force download if requested
      if self.get_argument('download', 'false').lower() == 'true':
        filename = os.path.splitext(args[1])[0] + resources['output_extension']
        self.set_header('Content-Disposition',
                        'attachment; filename="%s"' % filename)
      if exporter.output_mimetype:
        self.set_header('Content-Type',
                        '%s; charset=utf-8' % exporter.output_mimetype)

      self.finish(output)
    except Exception as e:
      app_log.exception(str(e))
      self.set_status(500, str(e))
      self.finish({'error': {'message': str(e)}})
