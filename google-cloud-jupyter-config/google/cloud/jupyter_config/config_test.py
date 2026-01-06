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

import json
import os

import pytest
from tornado import httpclient

from google.cloud.jupyter_config.config import (
    async_run_gcloud_subcommand,
    async_get_gcloud_config,
    gcp_account,
    gcp_credentials,
    gcp_project,
    gcp_region,
)


def test_gcp_account(mock_gcloud_env):
    assert gcp_account() == "example-account"

    # Verify that changing the OS environment variable does not modify the cached property
    os.environ["CLOUDSDK_CORE_ACCOUNT"] = "should-not-be-used"
    assert gcp_account() == "example-account"


def test_gcp_credentials(mock_gcloud_env):
    assert gcp_credentials() == "example-token"

    # Verify that changing the OS environment variable does not modify the cached property
    os.environ["CLOUDSDK_AUTH_ACCESS_TOKEN"] = "should-not-be-used"
    assert gcp_credentials() == "example-token"

    
def test_gcp_project(mock_gcloud_env):
    assert gcp_project() == "example-project"

    # Verify that changing the OS environment variable does not modify the cached property
    os.environ["CLOUDSDK_CORE_PROJECT"] = "should-not-be-used"
    assert gcp_project() == "example-project"


def test_gcp_region(mock_gcloud_env):
    assert gcp_region() == "example-region"

    # Verify that changing the OS environment variable does not modify the cached property
    os.environ["CLOUDSDK_DATAPROC_REGION"] = "should-not-be-used"
    assert gcp_region() == "example-region"


async def test_async_run_gcloud_subcommand(mock_gcloud_env):
    test_project = await async_run_gcloud_subcommand("config get core/project")
    assert test_project == "example-project"


async def test_async_gcloud_config(mock_gcloud_env):
    test_account = await async_get_gcloud_config(
        "configuration.properties.core.account"
    )
    assert test_account == "example-account"


async def test_get_properties(jp_fetch, mock_gcloud_env):
    response = await jp_fetch("gcloud", "config", "properties")
    assert response.code == 200

    properties = json.loads(response.body)
    assert properties["core"]["account"] == "example-account"
    assert properties["core"]["project"] == "example-project"
    assert properties["dataproc"]["region"] == "example-region"


async def test_set_properties(jp_fetch, mock_gcloud_env):
    updated_properties = {
        "compute": {
            "region": "updated-example-region",
        },
    }
    update_response = await jp_fetch(
        "gcloud", "config", "properties", method="POST", body=json.dumps(updated_properties))
    assert update_response.code == 200

    get_response = await jp_fetch("gcloud", "config", "properties")
    assert get_response.code == 200
    properties = json.loads(get_response.body)

    assert properties["compute"]["region"] == "updated-example-region"


async def test_set_invalid_property(jp_fetch, mock_gcloud_env):
    updated_properties = {
        "compute; true": {
            "region": "updated-example-region",
        },
    }
    try:
        response = await jp_fetch(
            "gcloud", "config", "properties", method="POST", body=json.dumps(updated_properties))
        pytest.fail(f"Request with bash shell escape should be rejected; got {response.body}")
    except httpclient.HTTPClientError as err:
        assert err.code == 400


async def test_set_invalid_nested_property(jp_fetch, mock_gcloud_env):
    updated_properties = {
        "compute": {
            "region; true": "updated-example-region",
        },
    }
    try:
        response = await jp_fetch(
            "gcloud", "config", "properties", method="POST", body=json.dumps(updated_properties))
        pytest.fail(f"Request with bash shell escape should be rejected; got {response.body}")
    except httpclient.HTTPClientError as err:
        assert err.code == 400


async def test_set_invalid_property_value(jp_fetch, mock_gcloud_env):
    updated_properties = {
        "compute": {
            "region": "updated-example-region; true",
        },
    }
    try:
        response = await jp_fetch(
            "gcloud", "config", "properties", method="POST", body=json.dumps(updated_properties))
        pytest.fail(f"Request with bash shell escape should be rejected; got {response.body}")
    except httpclient.HTTPClientError as err:
        assert err.code == 400
