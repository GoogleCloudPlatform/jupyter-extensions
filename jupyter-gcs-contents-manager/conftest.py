# Copyright 2026 Google LLC
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

import os
import posixpath
import sys
import tempfile
import uuid

import pytest

from google.cloud import storage
from gcs_contents_manager import CombinedContentsManager


pytest_plugins = ["pytest_jupyter.jupyter_server"]


@pytest.fixture
def gcs_project():
    project = os.environ.get("GCS_TEST_PROJECT", None)
    assert (
        project
    ), "You must specify a project using the 'GCS_TEST_PROJECT' environment variable"
    return project


@pytest.fixture
def gcs_bucket_name():
    bucket = os.environ.get("GCS_TEST_BUCKET", None)
    assert (
        bucket
    ), "You must specify a bucket using the 'GCS_TEST_BUCKET' environment variable"
    return bucket


@pytest.fixture
def gcs_bucket(gcs_project, gcs_bucket_name):
    storage_client = storage.Client(project=gcs_project)
    return storage_client.get_bucket(gcs_bucket_name)


@pytest.fixture
def gcs_notebook_path(gcs_bucket):
    path = f"test-data/test-runs/{uuid.uuid4().hex}"
    assert len([blob for blob in gcs_bucket.list_blobs(prefix=path)]) == 0
    yield path

    for blob in gcs_bucket.list_blobs(prefix=path):
        blob.delete()
    return


@pytest.fixture
def local_root_dir():
    with tempfile.TemporaryDirectory() as temp_dir:
        yield temp_dir


@pytest.fixture(params=[False, True])
def allow_hidden(request):
    return request.param


@pytest.fixture
def jp_server_config(
    jp_server_config,
    gcs_project,
    gcs_bucket_name,
    gcs_notebook_path,
    local_root_dir,
    allow_hidden,
):
    original_cloudsdk_env = {
        k: os.environ[k] for k in os.environ if k.startswith("CLOUDSDK_")
    }
    os.environ["CLOUDSDK_PYTHON"] = sys.executable
    os.environ["CLOUDSDK_CONFIG"] = posixpath.join(os.environ["HOME"], ".config/gcloud")
    yield {
        "ServerApp": {
            "contents_manager_class": CombinedContentsManager,
        },
        "CombinedContentsManager": {
            "allow_hidden": allow_hidden,
        },
        "GCSContentsManager": {
            "allow_hidden": allow_hidden,
            "bucket_name": gcs_bucket_name,
            "bucket_notebooks_path": gcs_notebook_path,
            "project": gcs_project,
        },
        "FileContentsManager": {
            "allow_hidden": allow_hidden,
            "root_dir": local_root_dir,
            # The following two properties would not be recommended in real usage,
            # but they make it easier to test local file operations.
            "delete_to_trash": False,
            "always_delete_dir": True,
        },
    }

    for k in os.environ:
        if k.startswith("CLOUDSDK_"):
            del os.environ[k]
    for k in original_cloudsdk_env:
        os.environ[k] = original_cloudsdk_env[k]
