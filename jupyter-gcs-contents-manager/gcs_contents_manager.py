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
# (e.g. jupyter_server_config.py):
#
#   from gcs_contents_manager import CombinedContentsManager, GCSContentsManager
#   c.ServerApp.contents_manager_class = CombinedContentsManager
#   c.GCSContentsManager.bucket_name = '${NOTEBOOK_BUCKET}'
#   c.GCSContentsManager.bucket_notebooks_path = '${NOTEBOOK_PATH}'
#   c.GCSContentsManager.project = '${NOTEBOOK_BUCKET_PROJECT}'
#   c.FileContentsManager.root_dir = '${LOCAL_DISK_NOTEBOOK_DIR}'
#
# For '${NOTEBOOK_BUCKET}' specify the name of the GCS bucket where
# you want to store your notebooks, and for '${NOTEBOOK_PATH}',
# specify the name of the directory within that bucket that will be
# treated as your root directory by Jupyter. For
# '${NOTEBOOK_BUCKET_PROJECT}', specify the ID of the GCP project
# that owns the GCS bucket.
#
# If you run JupyterLab with widgets that assume the current file
# browser path is a location on your local disk (e.g. the
# jupyterlab-git extension), then you will also need to set up a
# link somewhere on your local disk for those widgets to use.
#
# For example, you could run the following:
#
#   mkdir -p ~/.jupyter/symlinks_for_jupyterlab_widgets
#   ln -s ${LOCAL_DISK_NOTEBOOK_DIR} ~/.jupyter/symlinks_for_jupyterlab_widgets/Local\ Disk
#
# And then add the following snippet to your Jupyter config:
#
#   c.CombinedContentsManager.root_dir = '~/.jupyter/symlinks_for_jupyterlab_widgets'

import asyncio
import base64
import concurrent
import errno
import functools
import json
import logging
import mimetypes
import posixpath
import re

import nbformat
from jupyter_server.services.contents.filecheckpoints import AsyncGenericFileCheckpoints
from jupyter_server.services.contents.largefilemanager import AsyncLargeFileManager
from jupyter_server.services.contents.manager import AsyncContentsManager
from jupyter_server.services.contents.checkpoints import AsyncCheckpoints, AsyncGenericCheckpointsMixin
from tornado.web import HTTPError
from traitlets import Unicode, default

from google.cloud import storage

utf8_encoding = 'utf-8'


class GCSClient():
  """Higher level wrapper around the storage client library.

  All of the exposed methods are synchronous, but take and return pickleable
  values so that they can be run in a ProcessPoolRunner.
  """

  def __init__(self, project: str, bucket: str):
    self._project = project
    self._bucket = bucket
    self._cached_bucket = None

  def __getstate__(self):
    # Exclude the cached bucket from pickling
    state = self.__dict__.copy()
    state['_cached_bucket'] = None
    return state

  def _get_bucket(self) -> storage.bucket.Bucket:
    if not self._cached_bucket:
      if self._project:
        storage_client = storage.Client(project=self._project)
      else:
        storage_client = storage.Client()
      self._cached_bucket = storage_client.get_bucket(self._bucket)
    return self._cached_bucket
    
  def bucket_exists(self) -> bool:
    return self._get_bucket().exists()

  def bucket_time_created(self) -> str:
    return self._get_bucket().time_created

  def _get_blob(self, blob_name: str, create_if_missing: bool = False) -> storage.blob.Blob | None:
    blob = self._get_bucket().get_blob(blob_name)
    if not blob and create_if_missing:
      blob = self._get_bucket().blob(blob_name)
    return blob

  def upload_blob(self, blob_name: str, content: str, content_type: str) -> dict[str, str]:
    blob = self._get_blob(blob_name, create_if_missing=True)
    # GCS doesn't allow specifying the key version, so drop it if present
    if blob.kms_key_name:
      blob._properties['kmsKeyName'] = re.split(r'/cryptoKeyVersions/\d+$',
                                                blob.kms_key_name)[0]
    blob.upload_from_string(content, content_type=content_type)
    return {
        'last_modified': blob.updated,
    }

  def blob_exists(self, blob_name: str) -> bool:
    return self._get_blob(blob_name) is not None

  def read_blob(self, blob_name: str, content: bool, require_hash: bool) -> tuple[str, str, str, str, str]:
    blob = self._get_blob(blob_name)
    if not blob:
      return None, None
    content_str = blob.download_as_string() if content else None
    hash = blob.crc32c if require_hash else ''
    return content_str, blob.content_type, blob.time_created, blob.updated, hash

  def delete_blob(self, blob_name: str):
    blob = self._get_blob(blob_name)
    if blob:
      blob.delete()
    return None

  def list_blobs(self, path: str) -> list[dict[str, str]]:
    blobs = []
    for b in self._get_bucket().list_blobs(prefix=path):
      blob_details = {
          'name': b.name,
          'id': posixpath.basename(b.name),
          'last_modified': b.updated,
      }
      blobs.append(blob_details)
    return blobs

  def rename_blob(self, old_name: str, new_name: str):
    blob = self._get_blob(old_name)
    if not blob:
      return None
    self._get_bucket().rename_blob(blob, new_name)
    return None


class AsyncGCSClient():
  """Asynchronous equivalent of the GCSClient library.

  All of the underlying methods are run in a separate process so they do not block the main process.
  """
  def __init__(self, project, bucket):
    self._sync_client = GCSClient(project, bucket)
    self._executor = concurrent.futures.ProcessPoolExecutor()

  async def bucket_exists(self) -> bool:
    loop = asyncio.get_running_loop()
    return await loop.run_in_executor(self._executor, self._sync_client.bucket_exists)

  async def bucket_time_created(self) -> str:
    loop = asyncio.get_running_loop()
    return await loop.run_in_executor(self._executor, self._sync_client.bucket_time_created)
    
  async def upload_blob(self, blob_name: str, content: str, content_type: str) -> dict[str, str]:
    loop = asyncio.get_running_loop()
    return await loop.run_in_executor(self._executor, self._sync_client.upload_blob, blob_name, content, content_type)

  async def blob_exists(self, blob_name: str) -> bool:
    loop = asyncio.get_running_loop()
    return await loop.run_in_executor(self._executor, self._sync_client.blob_exists, blob_name)

  async def read_blob(self, blob_name: str, content: bool = True, require_hash: bool = False) -> tuple[str, str, str, str, str]:
    loop = asyncio.get_running_loop()
    return await loop.run_in_executor(
      self._executor, self._sync_client.read_blob, blob_name, content, require_hash)

  async def delete_blob(self, blob_name: str):
    loop = asyncio.get_running_loop()
    return await loop.run_in_executor(self._executor, self._sync_client.delete_blob, blob_name)

  async def list_blobs(self, path: str) -> list[dict[str, str]]:
    loop = asyncio.get_running_loop()
    return await loop.run_in_executor(self._executor, self._sync_client.list_blobs, path)

  async def rename_blob(self, old_name: str, new_name: str):
    loop = asyncio.get_running_loop()
    return await loop.run_in_executor(self._executor, self._sync_client.rename_blob, old_name, new_name)
    

class GCSCheckpointManager(AsyncGenericCheckpointsMixin, AsyncCheckpoints):
  checkpoints_dir = '.ipynb_checkpoints'

  def __init__(self, **kwargs):
    self._kwargs = kwargs
    self._parent = kwargs['parent']

  @property
  def client(self):
    return self._parent.client

  def checkpoint_path(self, checkpoint_id, path):
    path = (path or '').strip('/')
    return posixpath.join(self.checkpoints_dir, path, checkpoint_id)

  async def create_file_checkpoint(self, content, format, path):
    checkpoint_id = 'checkpoint'
    blob_name = self.checkpoint_path(checkpoint_id, path)
    content_type = 'text/plain' if format == 'text' else 'application/octet-stream'
    created_metadata = await self.client.upload_blob(blob_name, content, content_type)
    if created_metadata:
      created_metadata['id'] = checkpoint_id
    return created_metadata

  async def create_notebook_checkpoint(self, nb, path):
    content = nbformat.writes(nb)
    return await self.create_file_checkpoint(content, 'text', path)

  async def _checkpoint_contents(self, checkpoint_id, path):
    blob_name = self.checkpoint_path(checkpoint_id, path)
    contents, content_type, _, _, _ = await self.client.read_blob(blob_name)
    if contents is None:
      raise HTTPError(
          404, 'No such checkpoint for "{}": {}'.format(path, checkpoint_id))
    return contents, content_type

  async def get_file_checkpoint(self, checkpoint_id, path):
    contents, content_type = await self._checkpoint_contents(checkpoint_id, path)
    checkpoint_obj = {
        'type': 'file',
        'content': contents.decode(utf8_encoding),
    }
    checkpoint_obj[
        'format'] = 'text' if content_type == 'text/plain' else 'base64'
    return checkpoint_obj

  async def get_notebook_checkpoint(self, checkpoint_id, path):
    contents, _ = await self._checkpoint_contents(checkpoint_id, path)
    checkpoint_obj = {
        'type': 'notebook',
        'content': nbformat.reads(contents, as_version=4),
    }
    return checkpoint_obj

  async def delete_checkpoint(self, checkpoint_id, path):
    blob_name = self.checkpoint_path(checkpoint_id, path)
    return await self.client.delete_blob(blob_name)

  async def list_checkpoints(self, path):
    return await self.client.list_blobs(
      posixpath.join(self.checkpoints_dir, path))

  async def rename_checkpoint(self, checkpoint_id, old_path, new_path):
    old_blob_name = self.checkpoint_path(checkpoint_id, old_path)
    new_blob_name = self.checkpoint_path(checkpoint_id, new_path)
    return await self.client.rename_blob(old_blob_name, new_blob_name)


class GCSContentsManager(AsyncContentsManager):

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
    self.client = AsyncGCSClient(self.project, self.bucket_name)

  def _normalize_path(self, path):
    path = path or ''
    return path.strip('/')

  def _gcs_path(self, normalized_path):
    if not self.bucket_notebooks_path:
      return normalized_path
    if not normalized_path:
      return self.bucket_notebooks_path
    return posixpath.join(self.bucket_notebooks_path, normalized_path)

  async def is_hidden(self, path):
    try:
      path = self._normalize_path(path)
      return posixpath.basename(path).startswith('.')
    except HTTPError as err:
      raise err
    except Exception as ex:
      raise HTTPError(500, 'Internal server error: {}'.format(str(ex)))

  async def file_exists(self, path):
    try:
      path = self._normalize_path(path)
      if not path:
        return False
      blob_name = self._gcs_path(path)
      return await self.client.blob_exists(blob_name)
    except HTTPError as err:
      raise err
    except Exception as ex:
      raise HTTPError(500, 'Internal server error: {}'.format(str(ex)))

  async def dir_exists(self, path):
    try:
      path = self._normalize_path(path)
      if not path:
        return await self.client.bucket_exists()

      dir_gcs_path = self._gcs_path(path)
      if await self.client.blob_exists(dir_gcs_path):
        # There is a regular file matching the specified directory.
        #
        # Would could have both a blob matching a directory path
        # and other blobs under that path. In that case, we cannot
        # treat the path as both a directory and a regular file,
        # so we treat the regular file as overriding the logical
        # directory.
        return False

      dir_contents = await self.client.list_blobs(dir_gcs_path)
      for _ in dir_contents:
        return True

      return False
    except HTTPError as err:
      raise err
    except Exception as ex:
      raise HTTPError(500, 'Internal server error: {}'.format(str(ex)))

  async def _blob_model(self, normalized_path, blob_name, content=True, require_hash=False):
    content_str, content_type, time_created, time_updated, hash = (
      await self.client.read_blob(blob_name, content=content, require_hash=require_hash))

    blob_obj = {}
    blob_obj['path'] = normalized_path
    blob_obj['name'] = posixpath.basename(normalized_path)
    blob_obj['last_modified'] = time_updated
    blob_obj['created'] = time_created
    blob_obj['writable'] = True
    blob_obj['type'] = 'notebook' if blob_obj['name'].endswith(
        '.ipynb') else 'file'
    if hash:
      blob_obj['hash'] = hash
      blob_obj['hash_algorithm'] = 'crc32c'
    if not content:
      blob_obj['mimetype'] = None
      blob_obj['format'] = None
      blob_obj['content'] = None
      return blob_obj

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

  async def _empty_dir_model(self, normalized_path, content=True):
    bucket_time_created = await self.client.bucket_time_created()
    dir_obj = {}
    dir_obj['path'] = normalized_path
    dir_obj['name'] = posixpath.basename(normalized_path)
    dir_obj['type'] = 'directory'
    dir_obj['mimetype'] = None
    dir_obj['writable'] = True
    dir_obj['last_modified'] = bucket_time_created
    dir_obj['created'] = bucket_time_created
    dir_obj['format'] = None
    dir_obj['content'] = None
    if content:
      dir_obj['format'] = 'json'
      dir_obj['content'] = []
    return dir_obj

  async def _list_dir(self, normalized_path, content=True):
    dir_obj = await self._empty_dir_model(normalized_path, content=content)
    if not content:
      return dir_obj

    # We have to convert a list of GCS blobs, which may include multiple
    # entries corresponding to a single sub-directory, into a list of immediate
    # directory contents with no duplicates.
    #
    # To do that, we keep a dictionary of immediate children, and then convert
    # that dictionary into a list once it is fully populated.
    children = {}

    async def add_child(name, model, override_existing=False):
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
      if await self.is_hidden(model['path']) and not self.allow_hidden:
        return
      if (name in children) and not override_existing:
        return
      children[name] = model

    dir_gcs_path = self._gcs_path(normalized_path)
    for b in await self.client.list_blobs(dir_gcs_path):
      # For each nested blob, identify the corresponding immediate child
      # of the directory, and then add that child to the directory model.
      prefix_len = len(dir_gcs_path) + 1 if dir_gcs_path else 0
      suffix = b['name'][prefix_len:]
      if suffix:  # Ignore the place-holder blob for the directory itself
        first_slash = suffix.find('/')
        if first_slash < 0:
          child_path = posixpath.join(normalized_path, suffix)
          await add_child(
            suffix,
            await self._blob_model(child_path, b['name'], content=False),
            override_existing=True)
        else:
          subdir = suffix[0:first_slash]
          if subdir:
            child_path = posixpath.join(normalized_path, subdir)
            await add_child(
              subdir,
              await self._empty_dir_model(child_path, content=False))

    for child in children:
      dir_obj['content'].append(children[child])

    return dir_obj

  async def get(self, path, content=True, type=None, format=None, require_hash=False, **kwargs):
    try:
      path = self._normalize_path(path)
      if not type and await self.dir_exists(path):
        type = 'directory'
      if type == 'directory':
        return await self._list_dir(path, content=content)

      gcs_path = self._gcs_path(path)
      return await self._blob_model(path, gcs_path, content=content, require_hash=require_hash)
    except HTTPError as err:
      raise err
    except Exception as ex:
      raise HTTPError(500, 'Internal server error: {}'.format(str(ex)))

  async def _mkdir(self, normalized_path):
    gcs_path = self._gcs_path(normalized_path) + '/'
    await self.client.upload_blob(gcs_path, '', content_type='text/plain')
    return await self._empty_dir_model(normalized_path, content=False)

  async def save(self, model, path):
    try:
      if model.get("chunk", None):
        raise HTTPError(400, "Chunked uploads to GCS are not supported. The maximum file size that can be uploaded to GCS from the JupyterLab UI is 15MB.")

      self.run_pre_save_hook(model=model, path=path)

      normalized_path = self._normalize_path(path)
      if model['type'] == 'directory':
        return await self._mkdir(normalized_path)

      gcs_path = self._gcs_path(normalized_path)
      content_type = model.get('mimetype', None)
      if not content_type:
        content_type, _ = mimetypes.guess_type(normalized_path)
      contents = model['content']
      if model['type'] == 'notebook':
        contents = nbformat.writes(nbformat.from_dict(contents))
      elif model['type'] == 'file' and model['format'] == 'base64':
        b64_bytes = contents.encode('ascii')
        contents = base64.decodebytes(b64_bytes)

      await self.client.upload_blob(gcs_path, contents, content_type)
      return await self.get(path, type=model['type'], content=False)
    except HTTPError as err:
      raise err
    except Exception as ex:
      raise HTTPError(500, 'Internal server error: {}'.format(str(ex)))

  async def delete_file(self, path):
    try:
      normalized_path = self._normalize_path(path)
      gcs_path = self._gcs_path(normalized_path)
      if await self.client.blob_exists(gcs_path):
        # The path corresponds to a regular file; just delete it.
        await self.client.delete_blob(gcs_path)
        return None

      # The path (possibly) corresponds to a directory. Delete
      # every file underneath it.
      for blob in await self.client.list_blobs(gcs_path):
        await self.client.delete_blob(blob['name'])

      return None
    except HTTPError as err:
      raise err
    except Exception as ex:
      raise HTTPError(500, 'Internal server error: {}'.format(str(ex)))

  async def rename_file(self, old_path, new_path):
    try:
      old_gcs_path = self._gcs_path(self._normalize_path(old_path))
      new_gcs_path = self._gcs_path(self._normalize_path(new_path))
      if await self.client.blob_exists(old_gcs_path):
        # The path corresponds to a regular file.
        await self.client.rename_blob(old_gcs_path, new_gcs_path)
        return None

      # The path (possibly) corresponds to a directory. Rename
      # every file underneath it.
      for b in await self.client.list_blobs(old_gcs_path):
        await self.client.rename_blob(b['name'], b['name'].replace(old_gcs_path, new_gcs_path))
      return None
    except HTTPError as err:
      raise err
    except Exception as ex:
      raise HTTPError(500, 'Internal server error: {}'.format(str(ex)))


class CombinedCheckpointsManager(AsyncGenericCheckpointsMixin, AsyncCheckpoints):

  def __init__(self, content_managers):
    self._content_managers = content_managers

  def _checkpoint_manager_for_path(self, path):
    path = path or ''
    path = path.strip('/')
    for path_prefix in self._content_managers:
      if path == path_prefix or path.startswith(path_prefix + '/'):
        relative_path = path[len(path_prefix):]
        return self._content_managers[path_prefix].checkpoints, relative_path
    raise HTTPError(400, 'Unsupported checkpoint path: {}'.format(path))

  async def create_file_checkpoint(self, content, format, path):
    checkpoint_manager, relative_path = self._checkpoint_manager_for_path(path)
    return await checkpoint_manager.create_file_checkpoint(content, format,
                                                           relative_path)

  async def create_notebook_checkpoint(self, nb, path):
    checkpoint_manager, relative_path = self._checkpoint_manager_for_path(path)
    return await checkpoint_manager.create_notebook_checkpoint(nb, relative_path)

  async def get_file_checkpoint(self, checkpoint_id, path):
    checkpoint_manager, relative_path = self._checkpoint_manager_for_path(path)
    return await checkpoint_manager.get_file_checkpoint(checkpoint_id, relative_path)

  async def get_notebook_checkpoint(self, checkpoint_id, path):
    checkpoint_manager, relative_path = self._checkpoint_manager_for_path(path)
    return await checkpoint_manager.get_notebook_checkpoint(checkpoint_id,
                                                            relative_path)

  async def delete_checkpoint(self, checkpoint_id, path):
    checkpoint_manager, relative_path = self._checkpoint_manager_for_path(path)
    return await checkpoint_manager.delete_checkpoint(checkpoint_id, relative_path)

  async def list_checkpoints(self, path):
    checkpoint_manager, relative_path = self._checkpoint_manager_for_path(path)
    return await checkpoint_manager.list_checkpoints(relative_path)

  async def rename_checkpoint(self, checkpoint_id, old_path, new_path):
    checkpoint_manager, old_relative_path = self._checkpoint_manager_for_path(
        old_path)
    new_checkpoint_manager, new_relative_path = self._checkpoint_manager_for_path(
        new_path)
    if new_checkpoint_manager != checkpoint_manager:
      raise HTTPError(
          400, 'Unsupported rename across file systems: {}->{}'.format(
              old_path, new_path))
    return await checkpoint_manager.rename_checkpoint(checkpoint_id,
                                                      old_relative_path,
                                                      new_relative_path)


class CombinedContentsManager(AsyncContentsManager):
  root_dir = Unicode(config=True)

  preferred_dir = Unicode("", config=True)

  @default('checkpoints')
  def _default_checkpoints(self):
    return CombinedCheckpointsManager(self._content_managers)

  def __init__(self, **kwargs):
    print('Creating the combined contents manager...')
    super(CombinedContentsManager, self).__init__(**kwargs)

    file_cm = AsyncLargeFileManager(**kwargs)
    file_cm.checkpoints = AsyncGenericFileCheckpoints(**file_cm.checkpoints_kwargs)
    gcs_cm = GCSContentsManager(**kwargs)
    self._content_managers = {
        'Local Disk': file_cm,
        'GCS': gcs_cm,
    }

  def _content_manager_for_path(self, path):
    path = path or ''
    path = path.strip('/')
    for path_prefix in self._content_managers:
      if path == path_prefix or path.startswith(path_prefix + '/'):
        relative_path = path[len(path_prefix):]
        return self._content_managers[path_prefix], relative_path, path_prefix
    if '/' in path:
      path_parts = path.split('/', 1)
      return None, path_parts[1], path_parts[0]
    return None, path, ''

  async def is_hidden(self, path):
    try:
      cm, relative_path, unused_path_prefix = self._content_manager_for_path(
          path)
      if not cm:
        return False
      return await cm.is_hidden(relative_path)
    except HTTPError as err:
      raise err
    except Exception as ex:
      raise HTTPError(
          500, 'Internal server error: [{}] {}'.format(type(ex), str(ex)))

  async def file_exists(self, path):
    try:
      cm, relative_path, unused_path_prefix = self._content_manager_for_path(
          path)
      if not cm:
        return False
      return await cm.file_exists(relative_path)
    except HTTPError as err:
      raise err
    except Exception as ex:
      raise HTTPError(
          500, 'Internal server error: [{}] {}'.format(type(ex), str(ex)))

  async def dir_exists(self, path):
    if path in ['', '/']:
      return True
    try:
      cm, relative_path, unused_path_prefix = self._content_manager_for_path(
          path)
      if not cm:
        return False
      return await cm.dir_exists(relative_path)
    except HTTPError as err:
      raise err
    except Exception as ex:
      raise HTTPError(
          500, 'Internal server error: [{}] {}'.format(type(ex), str(ex)))

  async def _make_model_relative(self, model, path_prefix):
    if 'path' in model:
      model['path'] = '{}/{}'.format(path_prefix, model['path'])
    if model.get('type', None) == 'directory':
      await self._make_children_relative(model, path_prefix)

  async def _make_children_relative(self, model, path_prefix):
    children = model.get('content', None)
    if children:
      for child in children:
        await self._make_model_relative(child, path_prefix)

  async def get(self, path, content=True, type=None, format=None, **kwargs):
    if path in ['', '/']:
      dir_obj = {}
      dir_obj['path'] = ''
      dir_obj['name'] = ''
      dir_obj['type'] = 'directory'
      dir_obj['mimetype'] = None
      dir_obj['writable'] = False
      dir_obj['format'] = None
      dir_obj['content'] = None
      contents = []
      for path_prefix in self._content_managers:
        child_obj = await self._content_managers[path_prefix].get('', content=False, **kwargs)
        child_obj['path'] = path_prefix
        child_obj['name'] = path_prefix
        child_obj['writable'] = False
        contents.append(child_obj)
      if content:
        dir_obj['content'] = contents
        dir_obj['format'] = 'json'
      dir_obj['created'] = contents[0]['created']
      dir_obj['last_modified'] = contents[0]['last_modified']
      return dir_obj
    try:
      cm, relative_path, path_prefix = self._content_manager_for_path(path)
      if not cm:
        raise HTTPError(404, 'No content manager defined for "{}"'.format(path))
      model = await cm.get(relative_path, content=content, type=type, format=format, **kwargs)
      await self._make_model_relative(model, path_prefix)
      return model
    except HTTPError as err:
      raise err
    except Exception as ex:
      raise HTTPError(
          500, 'Internal server error: [{}] {}'.format(type(ex), str(ex)))

  async def save(self, model, path):
    if path in ['', '/']:
      raise HTTPError(403, 'The top-level directory is read-only')
    try:
      chunk = model.get("chunk", None)
      if chunk is None or chunk == 1:
        # Follow the upstream pattern of only running the pre-save hooks for the first chunk
        # (or for non-chunked uploads).
        self.run_pre_save_hook(model=model, path=path)

      cm, relative_path, path_prefix = self._content_manager_for_path(path)
      if (relative_path in ['', '/']) or (path_prefix in ['', '/']):
        raise HTTPError(403, 'The top-level directory contents are read-only')
      if not cm:
        raise HTTPError(404, 'No content manager defined for "{}"'.format(path))

      if 'path' in model:
        model['path'] = relative_path

      model = await cm.save(model, relative_path)
      if 'path' in model:
        model['path'] = path
      return model
    except HTTPError as err:
      raise err
    except Exception as ex:
      raise HTTPError(
          500, 'Internal server error: [{}] {}'.format(type(ex), str(ex)))

  async def delete_file(self, path):
    if path in ['', '/']:
      raise HTTPError(403, 'The top-level directory is read-only')
    try:
      cm, relative_path, path_prefix = self._content_manager_for_path(path)
      if (relative_path in ['', '/']) or (path_prefix in ['', '/']):
        raise HTTPError(403, 'The top-level directory contents are read-only')
      if not cm:
        raise HTTPError(404, 'No content manager defined for "{}"'.format(path))
      return await cm.delete_file(relative_path)
    except OSError as err:
      # The built-in file contents manager will not attempt to wrap permissions
      # errors when deleting files if they occur while trying to move the
      # to-be-deleted file to the trash, because the underlying send2trash
      # library does not set the errno attribute of the raised OSError.
      #
      # To work around this we explicitly catch such errors, check if they
      # start with the magic text "Permission denied", and then wrap them
      # in an HTTPError.
      if str(err).startswith('Permission denied'):
        raise HTTPError(403, str(err))
      raise HTTPError(
          500, 'Internal server error: [{}] {}'.format(err.errno, str(err)))
    except HTTPError as err:
      raise err
    except Exception as ex:
      raise HTTPError(
          500, 'Internal server error: [{}] {}'.format(type(ex), str(ex)))

  async def rename_file(self, old_path, new_path):
    if (old_path in ['', '/']) or (new_path in ['', '/']):
      raise HTTPError(403, 'The top-level directory is read-only')
    try:
      old_cm, old_relative_path, old_prefix = self._content_manager_for_path(
          old_path)
      if (old_relative_path in ['', '/']) or (old_prefix in ['', '/']):
        raise HTTPError(403, 'The top-level directory contents are read-only')
      if not old_cm:
        raise HTTPError(404,
                        'No content manager defined for "{}"'.format(old_path))

      new_cm, new_relative_path, new_prefix = self._content_manager_for_path(
          new_path)
      if (new_relative_path in ['', '/']) or (new_prefix in ['', '/']):
        raise HTTPError(403, 'The top-level directory contents are read-only')
      if not new_cm:
        raise HTTPError(404,
                        'No content manager defined for "{}"'.format(new_path))

      if old_cm != new_cm:
        raise HTTPError(400, 'Unsupported rename across file systems')
      return await old_cm.rename_file(old_relative_path, new_relative_path)
    except HTTPError as err:
      raise err
    except Exception as ex:
      raise HTTPError(
          500, 'Internal server error: [{}] {}'.format(type(ex), str(ex)))
