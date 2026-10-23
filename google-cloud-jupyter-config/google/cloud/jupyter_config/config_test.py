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
import shutil
import subprocess
import sys
from unittest.mock import AsyncMock

import pytest
from tornado import httpclient

from google.cloud.jupyter_config.config import (
    _gcloud_argv,
    async_run_gcloud_subcommand,
    async_get_gcloud_config,
    gcp_account,
    gcp_credentials,
    gcp_project,
    gcp_project_number,
    gcp_region,
    run_gcloud_subcommand,
)


skip_on_windows = pytest.mark.skipif(
    sys.platform.startswith("win"),
    reason="On Windows the command runs in a long-lived worker process with its own PATH.",
)


@pytest.fixture
def gcloud_path(monkeypatch):
    """Makes shutil.which report a fixed gcloud path. Nothing is run."""
    path = "/fake/bin/gcloud"
    monkeypatch.setattr(shutil, "which", lambda cmd: path if cmd == "gcloud" else None)
    return path


@pytest.fixture
def fake_gcloud(tmp_path, monkeypatch):
    """Puts a fake gcloud first on the PATH. It prints its arguments as JSON."""
    script = tmp_path / "fake_gcloud.py"
    script.write_text("import json, sys\nprint(json.dumps(sys.argv[1:]))\n")
    if sys.platform.startswith("win"):
        (tmp_path / "gcloud.cmd").write_text(f'@"{sys.executable}" "{script}" %*\n')
    else:
        launcher = tmp_path / "gcloud"
        launcher.write_text(f'#!/bin/sh\nexec "{sys.executable}" "{script}" "$@"\n')
        launcher.chmod(0o755)
    monkeypatch.setenv("PATH", str(tmp_path), prepend=os.pathsep)


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


def test_run_gcloud_subcommand_with_list(mock_gcloud_env):
    token = run_gcloud_subcommand(
        ["config", "config-helper", "--format=value(credential.access_token)"]
    )
    assert token == "example-token"


async def test_async_run_gcloud_subcommand_with_list(mock_gcloud_env):
    token = await async_run_gcloud_subcommand(
        ["config", "config-helper", "--format=value(credential.access_token)"]
    )
    assert token == "example-token"


def test_run_gcloud_subcommand_passes_list_items_unchanged(fake_gcloud):
    args = ["config", "set", "core/project", "x; id"]
    assert json.loads(run_gcloud_subcommand(args)) == args


@skip_on_windows
async def test_async_run_gcloud_subcommand_passes_list_items_unchanged(fake_gcloud):
    args = ["config", "set", "core/project", "x; id"]
    assert json.loads(await async_run_gcloud_subcommand(args)) == args


def test_run_gcloud_subcommand_without_gcloud(tmp_path, monkeypatch):
    monkeypatch.setenv("PATH", str(tmp_path))
    with pytest.raises(subprocess.CalledProcessError) as err:
        run_gcloud_subcommand(["info"])
    assert err.value.returncode == 127


@skip_on_windows
async def test_async_run_gcloud_subcommand_without_gcloud(tmp_path, monkeypatch):
    monkeypatch.setenv("PATH", str(tmp_path))
    with pytest.raises(subprocess.CalledProcessError) as err:
        await async_run_gcloud_subcommand(["info"])
    assert err.value.returncode == 127


async def test_async_run_gcloud_subcommand_on_windows_passes_list_to_worker(monkeypatch):
    run_in_worker = AsyncMock(return_value="")
    monkeypatch.setattr(
        "google.cloud.jupyter_config.config._run_gcloud_subcommand_via_process_pool_executor",
        run_in_worker,
    )
    monkeypatch.setattr(sys, "platform", "win32")
    args = ["config", "set", "core/project", "x; id"]
    await async_run_gcloud_subcommand(args)
    run_in_worker.assert_awaited_once_with(args)


@pytest.mark.parametrize(
    "subcmd, expected",
    [
        (
            "config config-helper --min-expiry=30m --format=json",
            ["config", "config-helper", "--min-expiry=30m", "--format=json"],
        ),
        (
            'projects describe example-project --format="value(projectNumber)"',
            ["projects", "describe", "example-project", "--format=value(projectNumber)"],
        ),
        (
            'services list --enabled --filter="NAME=dataproc.googleapis.com"',
            ["services", "list", "--enabled", "--filter=NAME=dataproc.googleapis.com"],
        ),
        (
            "beta composer environments list-packages example-env --location us-central1",
            [
                "beta", "composer", "environments", "list-packages", "example-env",
                "--location", "us-central1",
            ],
        ),
        (
            "gcloud compute instances create my-test-vm --description \"my test instance\"",
            [
                "gcloud", "compute", "instances", "create", "my-test-vm", "--description", 'my test instance',
            ]
        ),
    ],
)
def test_gcloud_argv_splits_string_commands(gcloud_path, subcmd, expected):
    assert _gcloud_argv(subcmd) == [gcloud_path, *expected]


def test_gcloud_argv_unbalanced_quote(gcloud_path):
    with pytest.raises(subprocess.CalledProcessError):
        _gcloud_argv('config set core/project "example-project')


@pytest.mark.parametrize("char", list('&|<>^%!"\r\n'))
def test_gcloud_argv_on_windows_rejects_cmd_special_characters(gcloud_path, monkeypatch, char):
    monkeypatch.setattr(sys, "platform", "win32")
    with pytest.raises(subprocess.CalledProcessError):
        _gcloud_argv(["config", "set", "core/project", f"example{char}project"])


@pytest.mark.parametrize(
    "subcmd",
    [
        ["projects", "describe", "example-project", "--format=value(projectNumber)"],
        'projects describe example-project --format="value(projectNumber)"',
    ],
    ids=["list", "string"],
)
def test_gcloud_argv_on_windows_allows_other_arguments(gcloud_path, monkeypatch, subcmd):
    monkeypatch.setattr(sys, "platform", "win32")
    assert _gcloud_argv(subcmd) == [
        gcloud_path, "projects", "describe", "example-project", "--format=value(projectNumber)",
    ]


def test_gcloud_argv_on_linux_keeps_cmd_special_characters(gcloud_path, monkeypatch):
    monkeypatch.setattr(sys, "platform", "linux")
    args = ["config", "set", "core/project", 'a&b|c<d>e^f%g!h"i\nj']
    assert _gcloud_argv(args) == [gcloud_path, *args]


def test_gcp_project_number_passes_project_as_one_argument(fake_gcloud, monkeypatch):
    monkeypatch.setattr(
        "google.cloud.jupyter_config.config.gcp_project", lambda: "example project"
    )
    assert json.loads(gcp_project_number()) == [
        "projects", "describe", "example project", "--format=value(projectNumber)",
    ]


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


async def test_set_properties_runs_gcloud_with_argument_list(jp_fetch, monkeypatch):
    run_gcloud = AsyncMock(return_value="")
    monkeypatch.setattr(
        "google.cloud.jupyter_config.config.async_run_gcloud_subcommand", run_gcloud
    )
    updated_properties = {
        "compute": {
            "region": "us-central1",
        },
    }
    response = await jp_fetch(
        "gcloud", "config", "properties", method="POST", body=json.dumps(updated_properties))
    assert response.code == 200
    run_gcloud.assert_awaited_once_with(["config", "set", "compute/region", "us-central1"])


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
