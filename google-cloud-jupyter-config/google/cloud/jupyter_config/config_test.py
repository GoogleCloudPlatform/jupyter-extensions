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
from unittest import mock

import pytest
from tornado import httpclient

from google.cloud.jupyter_config.config import (
    gcp_account,
    gcp_credentials,
    gcp_project,
    gcp_region,
)


def test_gcp_account(mock_gcloud_properties):
    assert gcp_account() == "example-account"


def test_gcp_project(mock_gcloud_properties):
    assert gcp_project() == "example-project"


def test_gcp_region(mock_gcloud_properties):
    assert gcp_region() == "example-region"


@mock.patch("google.cloud.jupyter_config.config._get_credentials")
def test_gcp_credentials(mock_get_creds):
    mock_creds = mock.MagicMock()
    mock_creds.token = "test-access-token"
    mock_get_creds.return_value = (mock_creds, "test-project")
    assert gcp_credentials() == "test-access-token"
    mock_creds.refresh.assert_called_once()


@mock.patch("google.cloud.jupyter_config.config._get_credentials")
def test_gcp_project_from_adc(mock_get_creds):
    """Project from ADC takes priority over gcloud properties."""
    mock_creds = mock.MagicMock()
    mock_get_creds.return_value = (mock_creds, "adc-project")
    assert gcp_project() == "adc-project"


@mock.patch("google.cloud.jupyter_config.config._get_credentials")
def test_gcp_project_falls_back_to_gcloud(mock_get_creds, mock_gcloud_properties):
    """Falls back to gcloud properties when ADC has no project."""
    mock_creds = mock.MagicMock()
    mock_get_creds.return_value = (mock_creds, None)
    assert gcp_project() == "example-project"


async def test_get_properties(jp_fetch, mock_gcloud_properties):
    response = await jp_fetch("gcloud", "config", "properties")
    assert response.code == 200

    properties = json.loads(response.body)
    assert properties["core"]["account"] == "example-account"
    assert properties["core"]["project"] == "example-project"
    assert properties["dataproc"]["region"] == "example-region"


async def test_set_properties(jp_fetch, mock_gcloud_properties):
    with mock.patch(
        "google.cloud.jupyter_config.config._async_run_gcloud_subcommand"
    ) as mock_gcloud:
        mock_gcloud.return_value = ""
        updated_properties = {
            "compute": {
                "region": "updated-example-region",
            },
        }
        update_response = await jp_fetch(
            "gcloud", "config", "properties",
            method="POST", body=json.dumps(updated_properties),
        )
        assert update_response.code == 200
        mock_gcloud.assert_called_once_with("config set compute/region updated-example-region")


async def test_set_invalid_property(jp_fetch, mock_gcloud_properties):
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


async def test_set_invalid_nested_property(jp_fetch, mock_gcloud_properties):
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


async def test_set_invalid_property_value(jp_fetch, mock_gcloud_properties):
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
