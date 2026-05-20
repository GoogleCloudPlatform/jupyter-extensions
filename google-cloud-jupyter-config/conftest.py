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
import sys

import pytest

from google.cloud.jupyter_config.config import clear_gcloud_cache


pytest_plugins = ['pytest_jupyter.jupyter_server']


@pytest.fixture
def jp_server_config(jp_server_config):
    return {
        "ServerApp": {
            "jpserver_extensions": {
                "google.cloud.jupyter_config": True
            },
        },
    }


@pytest.fixture
def mock_gcloud_env():
    _mock_cloudsdk_variables = {
        "CLOUDSDK_AUTH_ACCESS_TOKEN": "example-token",
        "CLOUDSDK_CORE_ACCOUNT": "example-account",
        "CLOUDSDK_CORE_PROJECT": "example-project",
        "CLOUDSDK_DATAPROC_REGION": "example-region",
        # Make sure that gcloud uses the same python environment as the test to
        # avoid issues caused by conflicting versions.
        "CLOUDSDK_PYTHON": sys.executable,
    }

    # First override the existing environment with our mock variables
    original_cloudsdk_variables = {}
    for key in os.environ:
        if key.startswith("CLOUDSDK_"):
            original_cloudsdk_variables[key] = os.environ[key]
    for key in _mock_cloudsdk_variables:
        os.environ[key] = _mock_cloudsdk_variables[key]
    clear_gcloud_cache()

    # Yield the modified environment
    yield os.environ

    # Cleanup the environment by resetting any modified variables
    for key in _mock_cloudsdk_variables:
        del os.environ[key]
    for key in original_cloudsdk_variables:
        os.environ[key] = original_cloudsdk_variables[key]
