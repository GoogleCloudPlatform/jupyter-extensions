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
#   from gcs_contents_manager import CombinedContentsManager
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

import atexit
import asyncio
import base64
import concurrent
import hashlib
import mimetypes
import posixpath
import re

import nbformat

from jupyter_server.services.contents.filecheckpoints import AsyncGenericFileCheckpoints
from jupyter_server.services.contents.largefilemanager import AsyncLargeFileManager
from jupyter_server.services.contents.manager import AsyncContentsManager
from jupyter_server.services.contents.checkpoints import (
    AsyncCheckpoints,
    AsyncGenericCheckpointsMixin,
)
from jupyter_server.utils import url_path_join

from tornado.web import HTTPError
from traitlets import Unicode, default

from google.cloud import storage

utf8_encoding = "utf-8"


_executor_ = concurrent.futures.ThreadPoolExecutor()
atexit.register(_executor_.shutdown)


def normalize_path(path):
    path = path or ""
    return path.strip("/")


class GCSBasedFileManager:
    def __init__(self, project: str, bucket_name: str, bucket_path_prefix: str):
        self.project = project
        self.bucket_name = bucket_name
        self.bucket_path_prefix = bucket_path_prefix
        self._cached_bucket = None

    @property
    def bucket(self):
        if not self._cached_bucket:
            if self.project:
                storage_client = storage.Client(project=self.project)
            else:
                storage_client = storage.Client()
            self._cached_bucket = storage_client.get_bucket(self.bucket_name)
        return self._cached_bucket

    def _gcs_path(self, path):
        path = normalize_path(path)
        if not self.bucket_path_prefix:
            return path
        if not path:
            return self.bucket_path_prefix
        return url_path_join(self.bucket_path_prefix, path)

    def _chunks_path(self, path):
        path_hash = hashlib.sha256(path.encode("utf-8")).hexdigest()
        return self._gcs_path(url_path_join(".chunks/", path_hash, "chunk#"))

    def _list_chunks(self, path):
        return [blob for blob in self.bucket.list_blobs(prefix=self._chunks_path(path))]

    def _blob(self, path, create_if_missing=False, chunk=None):
        blob_name = self._gcs_path(path)
        if chunk:
            blob_name = f"{self._chunks_path(path)}{chunk:09d}"
        blob = self.bucket.get_blob(blob_name)
        if not blob and create_if_missing:
            blob = self.bucket.blob(blob_name)
        return blob

    def _combine_chunks(self, path, content_type):
        blob_name = self._gcs_path(path)
        blob = self.bucket.blob(blob_name)
        blob.content_type = content_type
        chunk_blobs = self._list_chunks(path)
        # The last chunk is -1, which lexicographically comes first; move it to the end.
        chunk_blobs = chunk_blobs[1:] + chunk_blobs[0:1]
        blob.compose(chunk_blobs, if_generation_match=0)
        # Clean up the no-longer needed chunk blobs
        for chunk in self._list_chunks(path):
            chunk.delete()
        return blob

    def _list_blobs(self, path):
        prefix = self._gcs_path(path)
        return self.bucket.list_blobs(prefix=prefix)

    def file_exists(self, path):
        path = normalize_path(path)
        if not path:
            return False
        blob = self._blob(path)
        return blob is not None

    def dir_exists(self, path):
        path = normalize_path(path)
        if not path:
            return self.bucket.exists()
        if self._blob(path):
            # There is a regular file matching the specified directory.
            #
            # We could have both a blob matching a directory path
            # and other blobs under that path. In that case, we cannot
            # treat the path as both a directory and a regular file,
            # so we treat the regular file as overriding the logical
            # directory.
            return False
        dir_contents = self._list_blobs(path)
        for _ in dir_contents:
            return True
        return False

    def create_file(
        self, content: str, content_type: str, path: str, chunk: int | None
    ) -> dict[str, str]:
        blob = self._blob(path, create_if_missing=True, chunk=chunk)
        # GCS doesn't allow specifying the key version, so drop it if present
        if blob.kms_key_name:
            blob._properties["kmsKeyName"] = re.split(
                r"/cryptoKeyVersions/\d+$", blob.kms_key_name
            )[0]
        blob.upload_from_string(content, content_type=content_type)
        if chunk == -1:
            blob = self._combine_chunks(path, content_type)
        return self._file_metadata(path, blob)

    def create_notebook(self, nb, path):
        if type(nb) == dict:
            nb = nbformat.from_dict(nb)
        content = nbformat.writes(nb)
        return self.create_file(content, "text/plain", path, None)

    def file_contents(self, path: str, blob=None) -> tuple[bytes, str]:
        blob = blob or self._blob(path)
        if not blob:
            return None, None
        return blob.download_as_bytes(), blob.content_type

    def notebook_contents(self, path: str, blob=None):
        content_bytes, content_type = self.file_contents(path, blob=blob)
        if content_bytes is None:
            return None
        return nbformat.reads(content_bytes.decode(utf8_encoding), as_version=4)

    def delete_file(self, path):
        blob = self._blob(path)
        if blob:
            # The path corresponds to a regular file; delete it.
            blob.delete()

        # The path (possibly) corresponds to a directory. Delete
        # every file underneath it.
        for blob in self._list_blobs(path):
            blob.delete()
        return None

    def rename_file(self, old_path, new_path):
        blob = self._blob(old_path)
        if blob:
            self.bucket.rename_blob(blob, self._gcs_path(new_path))
            return None

        # The path (possibly) corresponds to a directory. Rename
        # every file underneath it.
        for b in self._list_blobs(old_path):
            self.bucket.rename_blob(b, b.name.replace(old_path, new_path))
        return None

    def _file_metadata(self, path, blob):
        return {
            "path": path,
            "name": posixpath.basename(path),
            "last_modified": blob.updated,
            "created": blob.time_created,
            "writable": True,
            "type": "notebook" if path.endswith(".ipynb") else "file",
            "content": None,
            "format": None,
            "mimetype": None,
        }

    def _dir_metadata(self, path):
        return {
            "path": path,
            "name": posixpath.basename(path),
            "type": "directory",
            "last_modified": self.bucket.time_created,
            "created": self.bucket.time_created,
            "content": None,
            "format": None,
            "mimetype": None,
            "writable": True,
        }

    def mkdir(self, path):
        blob_name = self._gcs_path(path) + "/"
        blob = self.bucket.blob(blob_name)
        blob.upload_from_string("", content_type="text/plain")
        return self._dir_metadata(path)

    def list_dir(self, path, include_content):
        dir_obj = self._dir_metadata(path)
        if not include_content:
            return dir_obj

        dir_obj["format"] = "json"
        dir_obj["content"] = []

        # We have to convert a list of GCS blobs, which may include multiple
        # entries corresponding to a single sub-directory, into a list of immediate
        # directory contents with no duplicates.
        #
        # To do that, we keep a dictionary of immediate children, and then convert
        # that dictionary into a list once it is fully populated.
        children = {}
        blob_name_prefix = self._gcs_path(path)
        blob_name_prefix_len = len(blob_name_prefix) + 1 if blob_name_prefix else 0
        for b in self._list_blobs(path):
            relative_path = b.name[blob_name_prefix_len:]
            if relative_path:  # Ignore the place-holder blob for the directory itself
                child_path = url_path_join(path, relative_path)
                first_slash = relative_path.find("/")
                if first_slash < 0:
                    children[relative_path] = self._file_metadata(child_path, b)
                else:
                    subdir = relative_path[0:first_slash]
                    if subdir not in children:
                        children[subdir] = self._dir_metadata(
                            url_path_join(path, subdir)
                        )

        for child in children:
            dir_obj["content"].append(children[child])

        return dir_obj

    def get_file(self, path, type, include_content, require_hash):
        if not type and self.dir_exists(path):
            type = "directory"
        if type == "directory":
            return self.list_dir(path, include_content)

        blob = self._blob(path)
        if not blob:
            return None

        file_model = self._file_metadata(path, blob)
        if require_hash:
            file_model["hash"] = blob.crc32c
            file_model["hash_algorithm"] = "crc32c"
        if not include_content:
            return file_model

        if file_model["type"] == "notebook":
            file_model["format"] = "json"
            file_model["content"] = self.notebook_contents(path, blob=blob)
        else:
            content, _ = self.file_contents(path, blob=blob)
            if blob.content_type.startswith("text/"):
                file_model["mimetype"] = "text/plain"
                file_model["format"] = "text"
                file_model["content"] = content.decode(utf8_encoding)
            else:
                file_model["mimetype"] = "application/octet-stream"
                file_model["format"] = "base64"
                file_model["content"] = base64.b64encode(content)
        return file_model


class GCSCheckpointManager(AsyncGenericCheckpointsMixin, AsyncCheckpoints):
    checkpoints_dir = ".ipynb_checkpoints"

    def __init__(self, *args, **kwargs):
        self._parent = kwargs["parent"]
        self._file_manager = GCSBasedFileManager(
            self._parent.project, self._parent.bucket_name, ""
        )
        self._executor = _executor_

    def checkpoint_path(self, checkpoint_id, path):
        path = normalize_path(path)
        return url_path_join(self.checkpoints_dir, path, checkpoint_id)

    async def create_file_checkpoint(self, content, format, path):
        checkpoint_id = "checkpoint"
        checkpoint_path = self.checkpoint_path(checkpoint_id, path)
        content_type = "text/plain" if format == "text" else "application/octet-stream"
        loop = asyncio.get_running_loop()
        file_model = await loop.run_in_executor(
            self._executor,
            self._file_manager.create_file,
            content,
            content_type,
            checkpoint_path,
            None,
        )
        if file_model:
            file_model["id"] = checkpoint_id
        return file_model

    async def create_notebook_checkpoint(self, nb, path):
        checkpoint_id = "checkpoint"
        checkpoint_path = self.checkpoint_path(checkpoint_id, path)
        loop = asyncio.get_running_loop()
        nb_model = await loop.run_in_executor(
            self._executor, self._file_manager.create_notebook, nb, checkpoint_path
        )
        if nb_model:
            nb_model["id"] = checkpoint_id
        return nb_model

    async def get_file_checkpoint(self, checkpoint_id, path):
        checkpoint_path = self.checkpoint_path(checkpoint_id, path)
        loop = asyncio.get_running_loop()
        contents, content_type = await loop.run_in_executor(
            self._executor, self._file_manager.file_contents, checkpoint_path
        )
        if not contents:
            raise HTTPError(
                404, 'No such checkpoint for "{}": {}'.format(path, checkpoint_id)
            )
        checkpoint_obj = {
            "type": "file",
            "content": contents.decode(utf8_encoding),
            "format": "text" if content_type == "text/plain" else "base64",
        }
        return checkpoint_obj

    async def get_notebook_checkpoint(self, checkpoint_id, path):
        checkpoint_path = self.checkpoint_path(checkpoint_id, path)
        loop = asyncio.get_running_loop()
        contents = await loop.run_in_executor(
            self._executor, self._file_manager.notebook_contents, checkpoint_path
        )
        if not contents:
            raise HTTPError(
                404, 'No such checkpoint for "{}": {}'.format(path, checkpoint_id)
            )
        return {
            "type": "notebook",
            "content": contents,
        }

    async def delete_checkpoint(self, checkpoint_id, path):
        old_checkpoint_path = self.checkpoint_path(checkpoint_id, path)
        loop = asyncio.get_running_loop()
        return await loop.run_in_executor(
            self._executor, self._file_manager.delete_file, old_checkpoint_path
        )

    async def list_checkpoints(self, path):
        loop = asyncio.get_running_loop()
        dir_model = await loop.run_in_executor(
            self._executor, self._file_manager.list_dir, path, True
        )
        checkpoints = []
        for child in dir_model["content"]:
            if child.get("type", None) != "directory":
                checkpoint = {
                    "id": child["name"],
                    "last_modified": child["last_modified"],
                }
                checkpoints.append(checkpoint)
        return checkpoints

    async def rename_checkpoint(self, checkpoint_id, old_path, new_path):
        old_checkpoint_path = self.checkpoint_path(checkpoint_id, old_path)
        new_checkpoint_path = self.checkpoint_path(checkpoint_id, new_path)
        loop = asyncio.get_running_loop()
        return await loop.run_in_executor(
            self._executor,
            self._file_manager.rename_file,
            old_checkpoint_path,
            new_checkpoint_path,
        )


class GCSContentsManager(AsyncContentsManager):

    bucket_name = Unicode(config=True)

    bucket_notebooks_path = Unicode(config=True)

    project = Unicode(config=True)

    @default("checkpoints_class")
    def _checkpoints_class_default(self):
        return GCSCheckpointManager

    @default("bucket_notebooks_path")
    def _bucket_notebooks_path_default(self):
        return ""

    def __init__(self, *args, **kwargs):
        super(GCSContentsManager, self).__init__(*args, **kwargs)
        self._file_manager = GCSBasedFileManager(
            self.project, self.bucket_name, self.bucket_notebooks_path
        )
        self._executor = _executor_

    def _is_hidden(self, path):
        path = normalize_path(path)
        return posixpath.basename(path).startswith(".")

    async def is_hidden(self, path):
        return self._is_hidden(path)

    async def file_exists(self, path):
        self.log.debug(f'Checking for the existence of the path "{path}" in GCS...')
        try:
            loop = asyncio.get_running_loop()
            return await loop.run_in_executor(
                self._executor, self._file_manager.file_exists, path
            )
        except HTTPError as err:
            raise err
        except Exception as ex:
            raise HTTPError(500, "Internal server error: {}".format(str(ex)))

    async def dir_exists(self, path):
        self.log.debug(
            f'Checking for the existence of the directory "{path}" in GCS...'
        )
        try:
            loop = asyncio.get_running_loop()
            return await loop.run_in_executor(
                self._executor, self._file_manager.dir_exists, path
            )
        except HTTPError as err:
            raise err
        except Exception as ex:
            raise HTTPError(500, "Internal server error: {}".format(str(ex)))

    async def get(
        self, path, content=True, type=None, format=None, require_hash=False, **kwargs
    ):
        self.log.debug(f'Getting the file "{path}" from GCS...')
        try:
            loop = asyncio.get_running_loop()
            model = await loop.run_in_executor(
                self._executor,
                self._file_manager.get_file,
                path,
                type,
                content,
                require_hash,
            )
            if not model:
                self.log.debug(f"No such file found in the GCS bucket for {path}")
                raise HTTPError(404, f"Not found: {path}")
            if (
                model
                and content
                and model.get("type", None) == "directory"
                and not self.allow_hidden
            ):
                # Filter out any hidden files if necessary.
                model["content"] = [
                    child
                    for child in model.get("content", [])
                    if not self._is_hidden(child.get("path", ""))
                ]
            return model
        except HTTPError as err:
            raise err
        except Exception as ex:
            raise HTTPError(500, "Internal server error: {}".format(str(ex)))

    async def save(self, model, path):
        self.log.debug(f'Saving the file "{model}" to the GCS path "{path}"...')
        try:
            chunk = model.get("chunk", None)
            if chunk is None or chunk == 1:
                self.run_pre_save_hooks(model=model, path=path)

            if chunk and model["type"] != "file":
                raise HTTPError(
                    400, "Chunked uploads to GCS are only supported for plain files."
                )

            loop = asyncio.get_running_loop()
            if model["type"] == "directory":
                return await loop.run_in_executor(
                    self._executor, self._file_manager.mkdir, path
                )

            content_type = model.get("mimetype", None)
            if not content_type:
                content_type, _ = mimetypes.guess_type(path or "")
            contents = model["content"]
            if model["type"] == "notebook":
                nb = nbformat.from_dict(contents)
                await loop.run_in_executor(
                    self._executor, self._file_manager.create_notebook, nb, path
                )
            elif model["type"] == "file":
                if model["format"] == "base64":
                    b64_bytes = contents.encode("ascii")
                    contents = base64.decodebytes(b64_bytes)
                created_model = await loop.run_in_executor(
                    self._executor,
                    self._file_manager.create_file,
                    contents,
                    content_type,
                    path,
                    chunk,
                )
                if chunk is not None and chunk != -1:
                    return created_model
            # Follow the upstream pattern of only running the post-save hooks for the last chunk
            # (or for non-chunked uploads).
            self.run_post_save_hooks(model=model, os_path=path)
            return await self.get(path, type=model["type"], content=False)
        except HTTPError as err:
            raise err
        except Exception as ex:
            raise HTTPError(500, "Internal server error: {}".format(str(ex)))

    async def delete_file(self, path):
        self.log.debug(f'Deleting the file "{path}" from GCS...')
        try:
            loop = asyncio.get_running_loop()
            return await loop.run_in_executor(
                self._executor, self._file_manager.delete_file, path
            )
        except HTTPError as err:
            raise err
        except Exception as ex:
            raise HTTPError(500, "Internal server error: {}".format(str(ex)))

    async def rename_file(self, old_path, new_path):
        self.log.debug(f'Renaming the file "{old_path}" in GCS to {new_path}...')
        try:
            loop = asyncio.get_running_loop()
            return await loop.run_in_executor(
                self._executor, self._file_manager.rename_file, old_path, new_path
            )
        except HTTPError as err:
            raise err
        except Exception as ex:
            raise HTTPError(500, "Internal server error: {}".format(str(ex)))


class CombinedCheckpointsManager(AsyncGenericCheckpointsMixin, AsyncCheckpoints):

    def __init__(self, content_managers):
        self._content_managers = content_managers

    def _checkpoint_manager_for_path(self, path):
        path = normalize_path(path)
        for path_prefix in self._content_managers:
            if path == path_prefix or path.startswith(path_prefix + "/"):
                relative_path = path[len(path_prefix) :]
                return self._content_managers[path_prefix].checkpoints, relative_path
        raise HTTPError(400, "Unsupported checkpoint path: {}".format(path))

    async def create_file_checkpoint(self, content, format, path):
        checkpoint_manager, relative_path = self._checkpoint_manager_for_path(path)
        return await checkpoint_manager.create_file_checkpoint(
            content, format, relative_path
        )

    async def create_notebook_checkpoint(self, nb, path):
        checkpoint_manager, relative_path = self._checkpoint_manager_for_path(path)
        return await checkpoint_manager.create_notebook_checkpoint(nb, relative_path)

    async def get_file_checkpoint(self, checkpoint_id, path):
        checkpoint_manager, relative_path = self._checkpoint_manager_for_path(path)
        return await checkpoint_manager.get_file_checkpoint(
            checkpoint_id, relative_path
        )

    async def get_notebook_checkpoint(self, checkpoint_id, path):
        checkpoint_manager, relative_path = self._checkpoint_manager_for_path(path)
        return await checkpoint_manager.get_notebook_checkpoint(
            checkpoint_id, relative_path
        )

    async def delete_checkpoint(self, checkpoint_id, path):
        checkpoint_manager, relative_path = self._checkpoint_manager_for_path(path)
        return await checkpoint_manager.delete_checkpoint(checkpoint_id, relative_path)

    async def list_checkpoints(self, path):
        checkpoint_manager, relative_path = self._checkpoint_manager_for_path(path)
        return await checkpoint_manager.list_checkpoints(relative_path)

    async def rename_checkpoint(self, checkpoint_id, old_path, new_path):
        checkpoint_manager, old_relative_path = self._checkpoint_manager_for_path(
            old_path
        )
        new_checkpoint_manager, new_relative_path = self._checkpoint_manager_for_path(
            new_path
        )
        if new_checkpoint_manager != checkpoint_manager:
            raise HTTPError(
                400,
                "Unsupported rename across file systems: {}->{}".format(
                    old_path, new_path
                ),
            )
        return await checkpoint_manager.rename_checkpoint(
            checkpoint_id, old_relative_path, new_relative_path
        )


class CombinedContentsManager(AsyncContentsManager):
    root_dir = Unicode(config=True)

    preferred_dir = Unicode("", config=True)

    @default("checkpoints")
    def _default_checkpoints(self):
        return CombinedCheckpointsManager(self._content_managers)

    def __init__(self, *args, **kwargs):
        super(CombinedContentsManager, self).__init__(*args, **kwargs)

        file_cm = AsyncLargeFileManager(*args, **kwargs)
        file_cm.checkpoints = AsyncGenericFileCheckpoints(**file_cm.checkpoints_kwargs)
        gcs_cm = GCSContentsManager(*args, **kwargs)
        self._content_managers = {
            "Local Disk": file_cm,
            "GCS": gcs_cm,
        }

    def _content_manager_for_path(self, path):
        path = normalize_path(path)
        for path_prefix in self._content_managers:
            if path == path_prefix or path.startswith(path_prefix + "/"):
                relative_path = path[len(path_prefix) :]
                return self._content_managers[path_prefix], relative_path, path_prefix
        if "/" in path:
            path_parts = path.split("/", 1)
            return None, path_parts[1], path_parts[0]
        return None, path, ""

    async def is_hidden(self, path):
        try:
            cm, relative_path, unused_path_prefix = self._content_manager_for_path(path)
            if not cm:
                return False
            return await cm.is_hidden(relative_path)
        except HTTPError as err:
            raise err
        except Exception as ex:
            raise HTTPError(
                500, "Internal server error: [{}] {}".format(type(ex), str(ex))
            )

    async def file_exists(self, path):
        try:
            cm, relative_path, unused_path_prefix = self._content_manager_for_path(path)
            if not cm:
                return False
            return await cm.file_exists(relative_path)
        except HTTPError as err:
            raise err
        except Exception as ex:
            raise HTTPError(
                500, "Internal server error: [{}] {}".format(type(ex), str(ex))
            )

    async def dir_exists(self, path):
        if path in ["", "/"]:
            return True
        try:
            cm, relative_path, unused_path_prefix = self._content_manager_for_path(path)
            if not cm:
                return False
            return await cm.dir_exists(relative_path)
        except HTTPError as err:
            raise err
        except Exception as ex:
            raise HTTPError(
                500, "Internal server error: [{}] {}".format(type(ex), str(ex))
            )

    async def _make_model_relative(self, model, path_prefix):
        if "path" in model:
            model["path"] = "{}/{}".format(path_prefix, model["path"])
        if model.get("type", None) == "directory":
            await self._make_children_relative(model, path_prefix)

    async def _make_children_relative(self, model, path_prefix):
        children = model.get("content", None)
        if children:
            for child in children:
                await self._make_model_relative(child, path_prefix)

    async def get(self, path, content=True, type=None, format=None, **kwargs):
        if path in ["", "/"]:
            dir_obj = {}
            dir_obj["path"] = ""
            dir_obj["name"] = ""
            dir_obj["type"] = "directory"
            dir_obj["mimetype"] = None
            dir_obj["writable"] = False
            dir_obj["format"] = None
            dir_obj["content"] = None
            contents = []
            for path_prefix in self._content_managers:
                child_obj = await self._content_managers[path_prefix].get(
                    "", content=False, type="directory", **kwargs
                )
                child_obj["path"] = path_prefix
                child_obj["name"] = path_prefix
                child_obj["writable"] = False
                contents.append(child_obj)
            if content:
                dir_obj["content"] = contents
                dir_obj["format"] = "json"
            dir_obj["created"] = contents[0]["created"]
            dir_obj["last_modified"] = contents[0]["last_modified"]
            return dir_obj
        try:
            cm, relative_path, path_prefix = self._content_manager_for_path(path)
            if not cm:
                raise HTTPError(404, 'No content manager defined for "{}"'.format(path))
            model = await cm.get(
                relative_path, content=content, type=type, format=format, **kwargs
            )
            if model:
                await self._make_model_relative(model, path_prefix)
            return model
        except HTTPError as err:
            raise err
        except Exception as ex:
            raise HTTPError(
                500, "Internal server error: [{}] {}".format(type(ex), str(ex))
            )

    async def save(self, model, path):
        if path in ["", "/"]:
            raise HTTPError(403, "The top-level directory is read-only")
        try:
            chunk = model.get("chunk", None)
            if chunk is None or chunk == 1:
                # Follow the upstream pattern of only running the pre-save hooks for the first chunk
                # (or for non-chunked uploads).
                self.run_pre_save_hooks(model=model, path=path)

            cm, relative_path, path_prefix = self._content_manager_for_path(path)
            if (relative_path in ["", "/"]) or (path_prefix in ["", "/"]):
                raise HTTPError(403, "The top-level directory contents are read-only")
            if not cm:
                raise HTTPError(404, 'No content manager defined for "{}"'.format(path))

            if "path" in model:
                model["path"] = relative_path

            model = await cm.save(model, relative_path)
            if "path" in model:
                model["path"] = path
            if chunk is None or chunk == -1:
                # Follow the upstream pattern of only running the post-save hooks for the last chunk
                # (or for non-chunked uploads).
                self.run_post_save_hooks(model=model, os_path=relative_path)
            return model
        except HTTPError as err:
            raise err
        except Exception as ex:
            raise HTTPError(
                500, "Internal server error: [{}] {}".format(type(ex), str(ex))
            )

    async def delete_file(self, path):
        if path in ["", "/"]:
            raise HTTPError(403, "The top-level directory is read-only")
        try:
            cm, relative_path, path_prefix = self._content_manager_for_path(path)
            if (relative_path in ["", "/"]) or (path_prefix in ["", "/"]):
                raise HTTPError(403, "The top-level directory contents are read-only")
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
            if str(err).startswith("Permission denied"):
                raise HTTPError(403, str(err))
            raise HTTPError(
                500, "Internal server error: [{}] {}".format(err.errno, str(err))
            )
        except HTTPError as err:
            raise err
        except Exception as ex:
            raise HTTPError(
                500, "Internal server error: [{}] {}".format(type(ex), str(ex))
            )

    async def rename_file(self, old_path, new_path):
        if (old_path in ["", "/"]) or (new_path in ["", "/"]):
            raise HTTPError(403, "The top-level directory is read-only")
        try:
            old_cm, old_relative_path, old_prefix = self._content_manager_for_path(
                old_path
            )
            if (old_relative_path in ["", "/"]) or (old_prefix in ["", "/"]):
                raise HTTPError(403, "The top-level directory contents are read-only")
            if not old_cm:
                raise HTTPError(
                    404, 'No content manager defined for "{}"'.format(old_path)
                )

            new_cm, new_relative_path, new_prefix = self._content_manager_for_path(
                new_path
            )
            if (new_relative_path in ["", "/"]) or (new_prefix in ["", "/"]):
                raise HTTPError(403, "The top-level directory contents are read-only")
            if not new_cm:
                raise HTTPError(
                    404, 'No content manager defined for "{}"'.format(new_path)
                )

            if old_cm != new_cm:
                raise HTTPError(400, "Unsupported rename across file systems")
            return await old_cm.rename_file(old_relative_path, new_relative_path)
        except HTTPError as err:
            raise err
        except Exception as ex:
            raise HTTPError(
                500, "Internal server error: [{}] {}".format(type(ex), str(ex))
            )
