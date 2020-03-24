# Copyright 2020 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     https://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

# Setup:
#   First, install the GCS Python client library using the
#   command: `pip install google-cloud-storage`
#
#   Then, copy this library into a directory in your PYTHONPATH.
#
#   Finally, make sure you have application default credentials
#   set up by running: `gcloud auth application-default login`
#
# Usage: Add the following lines to your Jupyter config file
# (e.g. jupyter_notebook_config.py):
#
#   from gcs_contents_manager import GCSContentsManager
#   c.NotebookApp.contents_manager_class = GCSContentsManager
#   c.GCSContentsManager.bucket_name = '${NOTEBOOK_BUCKET}'
#   c.GCSContentsManager.bucket_notebooks_path = '${NOTEBOOK_PATH}'
#
# For '${NOTEBOOK_BUCKET}' specify the name of the GCS bucket where
# you want to store your notebooks, and for '${NOTEBOOK_PATH}',
# specify the name of the directory within that bucket that will be
# treated as your root directory by Jupyter.

import base64
import json
import logging
import mimetypes
import posixpath

import nbformat
from notebook.services.contents.manager import ContentsManager
from notebook.services.contents.checkpoints import Checkpoints, GenericCheckpointsMixin
from tornado.web import HTTPError
from traitlets import Unicode, default

from google.cloud import storage


utf8_encoding = 'utf-8'


class GCSCheckpointManager(GenericCheckpointsMixin, Checkpoints):
  checkpoints_dir = '.ipynb_checkpoints'

  def __init__(self, **kwargs):
    self._kwargs = kwargs
    self._parent = kwargs['parent']

  @property
  def bucket(self):
    return self._parent.bucket

  def checkpoint_path(self, checkpoint_id, path):
    path = (path or '').strip('/')
    return posixpath.join(self.checkpoints_dir, path, checkpoint_id)

  def checkpoint_blob(self, checkpoint_id, path, create_if_missing=False):
    blob_name = self.checkpoint_path(checkpoint_id, path)
    blob = self.bucket.get_blob(blob_name)
    if not blob and create_if_missing:
      blob = self.bucket.blob(blob_name)
    return blob

  def create_file_checkpoint(self, content, format, path):
    checkpoint_id = 'checkpoint'
    blob = self.checkpoint_blob(checkpoint_id, path, create_if_missing=True)
    content_type = 'text/plain' if format == 'text' else 'application/octet-stream'
    blob.upload_from_string(content, content_type=content_type)
    return {
      'id': checkpoint_id,
      'last_modified': blob.updated,
    }

  def create_notebook_checkpoint(self, nb, path):
    content = nbformat.writes(nb)
    return self.create_file_checkpoint(content, 'text', path)

  def _checkpoint_contents(self, checkpoint_id, path):
    blob = self.checkpoint_blob(checkpoint_id, path)
    if not blob:
      raise HTTPError(404, 'No such checkpoint for "{}": {}'.format(path, checkpoint_id))
    return blob.download_as_string(), blob.content_type

  def get_file_checkpoint(self, checkpoint_id, path):
    contents, content_type = self._checkpoint_contents(checkpoint_id, path)
    checkpoint_obj = {
      'type': 'file',
      'content': contents.decode(utf8_encoding),
    }
    content_obj['format'] = 'text' if content_type == 'text/plain' else 'base64'
    return content_obj

  def get_notebook_checkpoint(self, checkpoint_id, path):
    contents, _ = self._checkpoint_contents(checkpoint_id, path)
    checkpoint_obj = {
      'type': 'notebook',
      'content':  nbformat.reads(contents, as_version=4),
    }
    return content_obj

  def delete_checkpoint(self, checkpoint_id, path):
    blob = self.checkpoint_blob(checkpoint_id, path)
    if blob:
      blob.delete()
    return None

  def list_checkpoints(self, path):
    checkpoints = []
    for b in self.bucket.list_blobs(prefix=posixpath.join(self.checkpoints_dir, path)):
      checkpoint = {
          'id': posixpath.basename(b.name),
          'last_modified': b.updated,
      }
      checkpoints.append(checkpoint)
    return checkpoints

  def rename_checkpoint(self, checkpoint_id, old_path, new_path):
    blob = self.checkpoint_blob(checkpoint_id, old_path)
    if not blob:
      return None
    new_blob_name = self.checkpoint_path(checkpoint_id, new_path)
    self.bucket.rename_blob(blob, new_blob_name)
    return None


class GCSContentsManager(ContentsManager):

  bucket_name = Unicode(config=True)

  bucket_notebooks_path = Unicode(config=True)

  project = Unicode(config=True)

  @default('checkpoints_class')
  def _checkpoints_class_default(self):
    return GCSCheckpointManager

  @default('bucket_notebooks_path')
  def _bucket_notebooks_path_default(self):
    return ''

  def __init__(self, **kwargs):
    super(GCSContentsManager, self).__init__(**kwargs)
    self._bucket = None

  @property
  def bucket(self):
    if not self._bucket:
      if self.project:
        storage_client = storage.Client(project=self.project)
      else:
        storage_client = storage.Client()
      self._bucket = storage_client.get_bucket(self.bucket_name)
    return self._bucket

  def _normalize_path(self, path):
    path = path or ''
    return path.strip('/')

  def _gcs_path(self, normalized_path):
    if not self.bucket_notebooks_path:
      return normalized_path
    if not normalized_path:
      return self.bucket_notebooks_path
    return posixpath.join(self.bucket_notebooks_path, normalized_path)

  def is_hidden(self, path):
    try:
      path = self._normalize_path(path)
      return posixpath.basename(path).startswith('.')
    except HTTPError as err:
      raise err
    except Exception as ex:
      raise HTTPError(500, 'Internal server error: {}'.format(str(ex)))

  def file_exists(self, path):
    try:
      path = self._normalize_path(path)
      if not path:
        return False
      blob_name = self._gcs_path(path)
      blob = self.bucket.get_blob(blob_name)
      return blob is not None
    except HTTPError as err:
      raise err
    except Exception as ex:
      raise HTTPError(500, 'Internal server error: {}'.format(str(ex)))

  def dir_exists(self, path):
    try:
      path = self._normalize_path(path)
      if not path:
        return self.bucket.exists()

      dir_gcs_path = self._gcs_path(path)
      if self.bucket.get_blob(dir_gcs_path):
        # There is a regular file matching the specified directory.
        #
        # Would could have both a blob matching a directory path
        # and other blobs under that path. In that case, we cannot
        # treat the path as both a directory and a regular file,
        # so we treat the regular file as overriding the logical
        # directory.
        return False

      dir_contents = self.bucket.list_blobs(prefix=dir_gcs_path)
      for _ in dir_contents:
        return True

      return False
    except HTTPError as err:
      raise err
    except Exception as ex:
      raise HTTPError(500, 'Internal server error: {}'.format(str(ex)))

  def _blob_model(self, normalized_path, blob, content=True):
    blob_obj = {}
    blob_obj['path'] = normalized_path
    blob_obj['name'] = posixpath.basename(normalized_path)
    blob_obj['last_modified'] = blob.updated
    blob_obj['created'] = blob.time_created
    blob_obj['writable'] = True
    blob_obj['type'] = 'notebook' if blob_obj['name'].endswith('.ipynb') else 'file'
    if not content:
      blob_obj['mimetype'] = None
      blob_obj['format'] = None
      blob_obj['content'] = None
      return blob_obj

    content_str = blob.download_as_string() if content else None
    if blob_obj['type'] == 'notebook':
      blob_obj['mimetype'] = None
      blob_obj['format'] = 'json'
      blob_obj['content'] = nbformat.reads(content_str, as_version=4)
    elif blob.content_type.startswith('text/'):
      blob_obj['mimetype'] = 'text/plain'
      blob_obj['format'] = 'text'
      blob_obj['content'] = content_str.decode(utf8_encoding)
    else:
      blob_obj['mimetype'] = 'application/octet-stream'
      blob_obj['format'] = 'base64'
      blob_obj['content'] = base64.b64encode(content_str)

    return blob_obj

  def _empty_dir_model(self, normalized_path, content=True):
    dir_obj = {}
    dir_obj['path'] = normalized_path
    dir_obj['name'] = posixpath.basename(normalized_path)
    dir_obj['type'] = 'directory'
    dir_obj['mimetype'] = None
    dir_obj['writable'] = True
    dir_obj['last_modified'] = self.bucket.time_created
    dir_obj['created'] = self.bucket.time_created
    dir_obj['format'] = None
    dir_obj['content'] = None
    if content:
      dir_obj['format'] = 'json'
      dir_obj['content'] = []
    return dir_obj

  def _list_dir(self, normalized_path, content=True):
    dir_obj = self._empty_dir_model(normalized_path, content=content)
    if not content:
      return dir_obj

    # We have to convert a list of GCS blobs, which may include multiple
    # entries corresponding to a single sub-directory, into a list of immediate
    # directory contents with no duplicates.
    #
    # To do that, we keep a dictionary of immediate children, and then convert
    # that dictionary into a list once it is fully populated.
    children = {}
    def add_child(name, model, override_existing=False):
      """Add the given child model (for either a regular file or directory), to
      the list of children for the current directory model being built.

      It is possible that we will encounter a GCS blob corresponding to a
      regular file after we encounter blobs indicating that name should be a
      directory. For example, if we have the following blobs:
          some/dir/path/
          some/dir/path/with/child
          some/dir/path
      ... then the first two entries tell us that 'path' is a subdirectory of
      'dir', but the third one tells us that it is a regular file.

      In this case, we treat the regular file as shadowing the directory. The
      'override_existing' keyword argument handles that by letting the caller
      specify that the child being added should override (i.e. hide) any
      pre-existing children with the same name.
      """
      if self.is_hidden(model['path']) and not self.allow_hidden:
        return
      if (name in children) and not override_existing:
        return
      children[name] = model

    dir_gcs_path = self._gcs_path(normalized_path)
    for b in self.bucket.list_blobs(prefix=dir_gcs_path):
      # For each nested blob, identify the corresponding immediate child
      # of the directory, and then add that child to the directory model.
      prefix_len = len(dir_gcs_path)+1 if dir_gcs_path else 0
      suffix = b.name[prefix_len:]
      if suffix:  # Ignore the place-holder blob for the directory itself
        first_slash = suffix.find('/')
        if first_slash < 0:
          child_path = posixpath.join(normalized_path, suffix)
          add_child(suffix,
                    self._blob_model(child_path, b),
                    override_existing=True)
        else:
          subdir = suffix[0:first_slash]
          if subdir:
            child_path = posixpath.join(normalized_path, subdir)
            add_child(subdir, self._empty_dir_model(child_path, content=False))

    for child in children:
      dir_obj['content'].append(children[child])

    return dir_obj

  def get(self, path, content=True, type=None, format=None):
    try:
      path = self._normalize_path(path)
      if not type and self.dir_exists(path):
        type = 'directory'
      if type == 'directory':
        return self._list_dir(path, content=content)

      gcs_path = self._gcs_path(path)
      blob = self.bucket.get_blob(gcs_path)
      return self._blob_model(path, blob, content=content)
    except HTTPError as err:
      raise err
    except Exception as ex:
      raise HTTPError(500, 'Internal server error: {}'.format(str(ex)))

  def _mkdir(self, normalized_path):
    gcs_path = self._gcs_path(normalized_path)+'/'
    blob = self.bucket.blob(gcs_path)
    blob.upload_from_string('', content_type='text/plain')
    return self._empty_dir_model(normalized_path, content=False)

  def save(self, model, path):
    try:
      self.run_pre_save_hook(model=model, path=path)

      normalized_path = self._normalize_path(path)
      if model['type'] == 'directory':
        return self._mkdir(normalized_path)

      gcs_path = self._gcs_path(normalized_path)
      blob = self.bucket.get_blob(gcs_path)
      if not blob:
        blob = self.bucket.blob(gcs_path)

      content_type = model.get('mimetype', None)
      if not content_type:
        content_type, _ = mimetypes.guess_type(normalized_path)
      contents = model['content']
      if model['type'] == 'notebook':
        contents = nbformat.writes(nbformat.from_dict(contents))

      blob.upload_from_string(contents, content_type=content_type)
      return self.get(path, type=model['type'], content=False)
    except HTTPError as err:
      raise err
    except Exception as ex:
      raise HTTPError(500, 'Internal server error: {}'.format(str(ex)))

  def delete_file(self, path):
    try:
      normalized_path = self._normalize_path(path)
      gcs_path = self._gcs_path(normalized_path)
      blob = self.bucket.get_blob(gcs_path)
      if blob:
        # The path corresponds to a regular file; just delete it.
        blob.delete()
        return None

      # The path (possibly) corresponds to a directory. Delete
      # every file underneath it.
      for blob in self.bucket.list_blobs(prefix=gcs_path):
        blob.delete()

      return None
    except HTTPError as err:
      raise err
    except Exception as ex:
      raise HTTPError(500, 'Internal server error: {}'.format(str(ex)))

  def rename_file(self, old_path, new_path):
    try:
      old_gcs_path = self._gcs_path(self._normalize_path(old_path))
      new_gcs_path = self._gcs_path(self._normalize_path(new_path))
      blob = self.bucket.get_blob(old_gcs_path)
      if blob:
        # The path corresponds to a regular file.
        self.bucket.rename_blob(blob, new_gcs_path)
        return None

      # The path (possibly) corresponds to a directory. Rename
      # every file underneath it.
      for b in self.bucket.list_blobs(prefix=old_gcs_path):
        self.bucket.rename_blob(b, b.name.replace(old_gcs_path, new_gcs_path))
      return None
    except HTTPError as err:
      raise err
    except Exception as ex:
      raise HTTPError(500, 'Internal server error: {}'.format(str(ex)))
