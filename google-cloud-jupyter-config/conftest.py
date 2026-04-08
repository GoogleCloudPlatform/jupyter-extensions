# Copyright 2023 Google LLC
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

import configparser
import os
import tempfile

import pytest


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
def mock_gcloud_properties(monkeypatch, tmp_path):
    """Create a fake gcloud config directory with properties."""
    config_dir = tmp_path / "gcloud"
    config_dir.mkdir()

    # Write active_config
    (config_dir / "active_config").write_text("default")

    # Write config file
    configs_dir = config_dir / "configurations"
    configs_dir.mkdir()
    config = configparser.ConfigParser()
    config["core"] = {
        "account": "example-account",
        "project": "example-project",
    }
    config["dataproc"] = {
        "region": "example-region",
    }
    config_file = configs_dir / "config_default"
    with open(config_file, "w") as f:
        config.write(f)

    monkeypatch.setenv("CLOUDSDK_CONFIG", str(config_dir))
    return config_dir
