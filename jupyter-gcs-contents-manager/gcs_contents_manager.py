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

import base64
import errno
import json
import logging
import mimetypes
import posixpath
import re

import nbformat
from jupyter_server.services.contents.filecheckpoints import GenericFileCheckpoints
from jupyter_server.services.contents.filemanager import FileContentsManager
from jupyter_server.services.contents.manager import ContentsManager
from jupyter_server.services.contents.checkpoints import (
    Checkpoints,
    GenericCheckpointsMixin,
)
from tornado.web import HTTPError
from traitlets import Unicode, default

from google.cloud import storage

utf8_encoding = "utf-8"


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
        return posixpath.join(self.bucket_path_prefix, path)

    def _blob(self, path, create_if_missing=False):
        blob_name = self._gcs_path(path)
        blob = self.bucket.get_blob(blob_name)
        if not blob and create_if_missing:
            blob = self.bucket.blob(blob_name)
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

    def create_file(self, content: str, content_type: str, path: str) -> dict[str, str]:
        blob = self._blob(path, create_if_missing=True)
        # GCS doesn't allow specifying the key version, so drop it if present
        if blob.kms_key_name:
            blob._properties["kmsKeyName"] = re.split(
                r"/cryptoKeyVersions/\d+$", blob.kms_key_name
            )[0]
        blob.upload_from_string(content, content_type=content_type)
        return self._file_metadata(path, blob)

    def create_notebook(self, nb, path):
        if type(nb) == dict:
            nb = nbformat.from_dict(nb)
        content = nbformat.writes(nb)
        return self.create_file(content, "text/plain", path)

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
                child_path = posixpath.join(path, relative_path)
                first_slash = relative_path.find("/")
                if first_slash < 0:
                    children[relative_path] = self._file_metadata(child_path, b)
                else:
                    subdir = relative_path[0:first_slash]
                    if subdir not in children:
                        children[subdir] = self._dir_metadata(
                            posixpath.join(path, subdir)
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


class GCSCheckpointManager(GenericCheckpointsMixin, Checkpoints):
    checkpoints_dir = ".ipynb_checkpoints"

    def __init__(self, **kwargs):
        self._kwargs = kwargs
        self._parent = kwargs["parent"]
        self._file_manager = GCSBasedFileManager(
            self._parent.project, self._parent.bucket_name, ""
        )

    def checkpoint_path(self, checkpoint_id, path):
        path = normalize_path(path)
        return posixpath.join(self.checkpoints_dir, path, checkpoint_id)

    def create_file_checkpoint(self, content, format, path):
        checkpoint_id = "checkpoint"
        checkpoint_path = self.checkpoint_path(checkpoint_id, path)
        content_type = "text/plain" if format == "text" else "application/octet-stream"
        file_model = self._file_manager.create_file(content, content_type, checkpoint_path)
        if file_model:
            file_model["id"] = checkpoint_id
        return file_model

    def create_notebook_checkpoint(self, nb, path):
        checkpoint_id = "checkpoint"
        checkpoint_path = self.checkpoint_path(checkpoint_id, path)
        nb_model = self._file_manager.create_notebook(nb, checkpoint_path)
        if nb_model:
            nb_model["id"] = checkpoint_id
        return nb_model

    def _checkpoint_contents(self, checkpoint_id, path):
        checkpoint_path = self.checkpoint_path(checkpoint_id, path)
        contents, content_type = self._file_manager.file_contents(checkpoint_path)
        if not contents:
            raise HTTPError(
                404, 'No such checkpoint for "{}": {}'.format(path, checkpoint_id)
            )
        return contents, content_type

    def get_file_checkpoint(self, checkpoint_id, path):
        checkpoint_path = self.checkpoint_path(checkpoint_id, path)
        contents, content_type = self._file_manager.file_contents(checkpoint_path)
        if not contents:
            raise HTTPError(
                404, 'No such checkpoint for "{}": {}'.format(path, checkpoint_id)
            )
        checkpoint_obj = {
            "type": "file",
            "content": contents.decode(utf8_encoding),
        }
        checkpoint_obj["format"] = "text" if content_type == "text/plain" else "base64"
        return checkpoint_obj

    def get_notebook_checkpoint(self, checkpoint_id, path):
        checkpoint_path = self.checkpoint_path(checkpoint_id, path)
        nb = self._file_manager.notebook_contents(checkpoint_path)
        if not nb:
            raise HTTPError(
                404, 'No such checkpoint for "{}": {}'.format(path, checkpoint_id)
            )
        checkpoint_obj = {
            "type": "notebook",
            "content": nb,
        }
        return checkpoint_obj

    def delete_checkpoint(self, checkpoint_id, path):
        old_checkpoint_path = self.checkpoint_path(checkpoint_id, path)
        return self._file_manager.delete_file(old_checkpoint_path)

    def list_checkpoints(self, path):
        dir_model = self._file_manager.list_dir(path, True)
        checkpoints = []
        for child in dir_model["content"]:
            if child.get("type", None) != "directory":
                checkpoint = {
                    "id": child["name"],
                    "last_modified": child["last_modified"],
                }
                checkpoints.append(checkpoint)
        return checkpoints

    def rename_checkpoint(self, checkpoint_id, old_path, new_path):
        old_checkpoint_path = self.checkpoint_path(checkpoint_id, old_path)
        new_checkpoint_path = self.checkpoint_path(checkpoint_id, new_path)
        return self._file_manager.rename_file(
            old_checkpoint_path,
            new_checkpoint_path,
        )


class GCSContentsManager(ContentsManager):

    bucket_name = Unicode(config=True)

    bucket_notebooks_path = Unicode(config=True)

    project = Unicode(config=True)

    @default("checkpoints_class")
    def _checkpoints_class_default(self):
        return GCSCheckpointManager

    @default("bucket_notebooks_path")
    def _bucket_notebooks_path_default(self):
        return ""

    def __init__(self, **kwargs):
        super(GCSContentsManager, self).__init__(**kwargs)
        self._file_manager = GCSBasedFileManager(
            self.project, self.bucket_name, self.bucket_notebooks_path
        )

    def is_hidden(self, path):
        try:
            path = normalize_path(path)
            return posixpath.basename(path).startswith(".")
        except HTTPError as err:
            raise err
        except Exception as ex:
            raise HTTPError(500, "Internal server error: {}".format(str(ex)))

    def file_exists(self, path):
        try:
            path = normalize_path(path)
            return self._file_manager.file_exists(path)
        except HTTPError as err:
            raise err
        except Exception as ex:
            raise HTTPError(500, "Internal server error: {}".format(str(ex)))

    def dir_exists(self, path):
        try:
            path = normalize_path(path)
            return self._file_manager.dir_exists(path)
        except HTTPError as err:
            raise err
        except Exception as ex:
            raise HTTPError(500, "Internal server error: {}".format(str(ex)))

    def get(self, path, content=True, type=None, format=None, require_hash=False):
        try:
            path = normalize_path(path)
            model = self._file_manager.get_file(
                path,
                type,
                content,
                require_hash,
            )
            if not model:
                self.log.debug(f"No such file found in the GCS bucket for {path}")
                raise HTTPError(404, f"Not found: {path}")
            if (
                content
                and model.get("type", None) == "directory"
                and not self.allow_hidden
            ):
                # Filter out any hidden files if necessary.
                model["content"] = [
                    child
                    for child in model.get("content", [])
                    if not self.is_hidden(child.get("path", ""))
                ]
            return model
        except HTTPError as err:
            raise err
        except Exception as ex:
            raise HTTPError(500, "Internal server error: {}".format(str(ex)))

    def save(self, model, path):
        try:
            self.run_pre_save_hook(model=model, path=path)

            normalized_path = normalize_path(path)
            if model["type"] == "directory":
                return self._file_manager.mkdir(path)

            content_type = model.get("mimetype", None)
            if not content_type:
                content_type, _ = mimetypes.guess_type(normalized_path)
            contents = model["content"]
            if model["type"] == "notebook":
                self._file_manager.create_notebook(contents, path)
            else:
                if model["type"] == "file" and model["format"] == "base64":
                    b64_bytes = contents.encode("ascii")
                    contents = base64.decodebytes(b64_bytes)
                self._file_manager.create_file(contents, content_type, path)
            return self.get(path, type=model["type"], content=False)
        except HTTPError as err:
            raise err
        except Exception as ex:
            raise HTTPError(500, "Internal server error: {}".format(str(ex)))

    def delete_file(self, path):
        try:
            normalized_path = normalize_path(path)
            return self._file_manager.delete_file(path)
        except HTTPError as err:
            raise err
        except Exception as ex:
            raise HTTPError(500, "Internal server error: {}".format(str(ex)))

    def rename_file(self, old_path, new_path):
        try:
            old_path = normalize_path(old_path)
            new_path = normalize_path(new_path)
            return self._file_manager.rename_file(old_path, new_path)
        except HTTPError as err:
            raise err
        except Exception as ex:
            raise HTTPError(500, "Internal server error: {}".format(str(ex)))


class CombinedCheckpointsManager(GenericCheckpointsMixin, Checkpoints):

    def __init__(self, content_managers):
        self._content_managers = content_managers

    def _checkpoint_manager_for_path(self, path):
        path = normalize_path(path)
        for path_prefix in self._content_managers:
            if path == path_prefix or path.startswith(path_prefix + "/"):
                relative_path = path[len(path_prefix) :]
                return self._content_managers[path_prefix].checkpoints, relative_path
        raise HTTPError(400, "Unsupported checkpoint path: {}".format(path))

    def checkpoint_path(self, checkpoint_id, path):
        checkpoint_manager, relative_path = self._checkpoint_manager_for_path(path)
        return checkpoint_manager.checkpoint_path(checkpoint_id, relative_path)

    def checkpoint_blob(self, checkpoint_id, path, create_if_missing=False):
        checkpoint_manager, relative_path = self._checkpoint_manager_for_path(path)
        return checkpoint_manager.checkpoint_blob(
            checkpoint_id, relative_path, create_if_missing=create_if_missing
        )

    def create_file_checkpoint(self, content, format, path):
        checkpoint_manager, relative_path = self._checkpoint_manager_for_path(path)
        return checkpoint_manager.create_file_checkpoint(content, format, relative_path)

    def create_notebook_checkpoint(self, nb, path):
        checkpoint_manager, relative_path = self._checkpoint_manager_for_path(path)
        return checkpoint_manager.create_notebook_checkpoint(nb, relative_path)

    def get_file_checkpoint(self, checkpoint_id, path):
        checkpoint_manager, relative_path = self._checkpoint_manager_for_path(path)
        return checkpoint_manager.get_file_checkpoint(checkpoint_id, relative_path)

    def get_notebook_checkpoint(self, checkpoint_id, path):
        checkpoint_manager, relative_path = self._checkpoint_manager_for_path(path)
        return checkpoint_manager.get_notebook_checkpoint(checkpoint_id, relative_path)

    def delete_checkpoint(self, checkpoint_id, path):
        checkpoint_manager, relative_path = self._checkpoint_manager_for_path(path)
        return checkpoint_manager.delete_checkpoint(checkpoint_id, relative_path)

    def list_checkpoints(self, path):
        checkpoint_manager, relative_path = self._checkpoint_manager_for_path(path)
        return checkpoint_manager.list_checkpoints(relative_path)

    def rename_checkpoint(self, checkpoint_id, old_path, new_path):
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
        return checkpoint_manager.rename_checkpoint(
            checkpoint_id, old_relative_path, new_relative_path
        )


class CombinedContentsManager(ContentsManager):
    root_dir = Unicode(config=True)

    preferred_dir = Unicode("", config=True)

    @default("checkpoints")
    def _default_checkpoints(self):
        return CombinedCheckpointsManager(self._content_managers)

    def __init__(self, **kwargs):
        print("Creating the combined contents manager...")
        super(CombinedContentsManager, self).__init__(**kwargs)

        file_cm = FileContentsManager(**kwargs)
        file_cm.checkpoints = GenericFileCheckpoints(**file_cm.checkpoints_kwargs)
        gcs_cm = GCSContentsManager(**kwargs)
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

    def is_hidden(self, path):
        try:
            cm, relative_path, unused_path_prefix = self._content_manager_for_path(path)
            if not cm:
                return False
            return cm.is_hidden(relative_path)
        except HTTPError as err:
            raise err
        except Exception as ex:
            raise HTTPError(
                500, "Internal server error: [{}] {}".format(type(ex), str(ex))
            )

    def file_exists(self, path):
        try:
            cm, relative_path, unused_path_prefix = self._content_manager_for_path(path)
            if not cm:
                return False
            return cm.file_exists(relative_path)
        except HTTPError as err:
            raise err
        except Exception as ex:
            raise HTTPError(
                500, "Internal server error: [{}] {}".format(type(ex), str(ex))
            )

    def dir_exists(self, path):
        if path in ["", "/"]:
            return True
        try:
            cm, relative_path, unused_path_prefix = self._content_manager_for_path(path)
            if not cm:
                return False
            return cm.dir_exists(relative_path)
        except HTTPError as err:
            raise err
        except Exception as ex:
            raise HTTPError(
                500, "Internal server error: [{}] {}".format(type(ex), str(ex))
            )

    def _make_model_relative(self, model, path_prefix):
        if "path" in model:
            model["path"] = "{}/{}".format(path_prefix, model["path"])
        if model.get("type", None) == "directory":
            self._make_children_relative(model, path_prefix)

    def _make_children_relative(self, model, path_prefix):
        children = model.get("content", None)
        if children:
            for child in children:
                self._make_model_relative(child, path_prefix)

    def get(self, path, content=True, type=None, format=None, **kwargs):
        if path in ["", "/"]:
            dir_obj = {}
            dir_obj["path"] = ""
            dir_obj["name"] = ""
            dir_obj["type"] = "directory"
            dir_obj["mimetype"] = None
            dir_obj["writable"] = False
            dir_obj["format"] = None
            dir_obj["content"] = None
            dir_obj["format"] = "json"
            contents = []
            for path_prefix in self._content_managers:
                child_obj = self._content_managers[path_prefix].get("", content=False, **kwargs)
                child_obj["path"] = path_prefix
                child_obj["name"] = path_prefix
                child_obj["writable"] = False
                contents.append(child_obj)
            dir_obj["content"] = contents
            dir_obj["created"] = contents[0]["created"]
            dir_obj["last_modified"] = contents[0]["last_modified"]
            return dir_obj
        try:
            cm, relative_path, path_prefix = self._content_manager_for_path(path)
            if not cm:
                raise HTTPError(404, 'No content manager defined for "{}"'.format(path))
            model = cm.get(
                relative_path, content=content, type=type, format=format, **kwargs)
            self._make_model_relative(model, path_prefix)
            return model
        except HTTPError as err:
            raise err
        except Exception as ex:
            raise HTTPError(
                500, "Internal server error: [{}] {}".format(type(ex), str(ex))
            )

    def save(self, model, path):
        if path in ["", "/"]:
            raise HTTPError(403, "The top-level directory is read-only")
        try:
            self.run_pre_save_hook(model=model, path=path)

            cm, relative_path, path_prefix = self._content_manager_for_path(path)
            if (relative_path in ["", "/"]) or (path_prefix in ["", "/"]):
                raise HTTPError(403, "The top-level directory contents are read-only")
            if not cm:
                raise HTTPError(404, 'No content manager defined for "{}"'.format(path))

            if "path" in model:
                model["path"] = relative_path

            model = cm.save(model, relative_path)
            if "path" in model:
                model["path"] = path
            return model
        except HTTPError as err:
            raise err
        except Exception as ex:
            raise HTTPError(
                500, "Internal server error: [{}] {}".format(type(ex), str(ex))
            )

    def delete_file(self, path):
        if path in ["", "/"]:
            raise HTTPError(403, "The top-level directory is read-only")
        try:
            cm, relative_path, path_prefix = self._content_manager_for_path(path)
            if (relative_path in ["", "/"]) or (path_prefix in ["", "/"]):
                raise HTTPError(403, "The top-level directory contents are read-only")
            if not cm:
                raise HTTPError(404, 'No content manager defined for "{}"'.format(path))
            return cm.delete_file(relative_path)
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

    def rename_file(self, old_path, new_path):
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
            return old_cm.rename_file(old_relative_path, new_relative_path)
        except HTTPError as err:
            raise err
        except Exception as ex:
            raise HTTPError(
                500, "Internal server error: [{}] {}".format(type(ex), str(ex))
            )
