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

import asyncio
import configparser
import json
import os
import re
import subprocess
import sys
import tempfile

import google.auth
import google.auth.transport.requests
from google.cloud import resourcemanager_v3
from jupyter_server.base.handlers import APIHandler
import tornado

from google.cloud.jupyter_config.tokenrenewer import GoogleAuthTokenRenewer


def _get_gcloud_config_path():
    """Return the path to the gcloud CLI properties file."""
    config_dir = os.environ.get(
        "CLOUDSDK_CONFIG", os.path.join(os.path.expanduser("~"), ".config", "gcloud")
    )
    active_config = "default"
    active_config_file = os.path.join(config_dir, "active_config")
    if os.path.exists(active_config_file):
        with open(active_config_file, "r") as f:
            active_config = f.read().strip() or "default"
    return os.path.join(config_dir, "configurations", f"config_{active_config}")


def _read_gcloud_properties():
    """Read gcloud CLI properties from the config file.

    Returns a nested dict like {"core": {"project": "...", "account": "..."}, ...}.
    """
    config_path = _get_gcloud_config_path()
    parser = configparser.ConfigParser()
    parser.read(config_path)
    result = {}
    for section in parser.sections():
        result[section] = dict(parser.items(section))
    return result


def _get_credentials():
    """Get google-auth credentials with cloud-platform scope."""
    credentials, project = google.auth.default(
        scopes=["https://www.googleapis.com/auth/cloud-platform"]
    )
    return credentials, project


def gcp_account():
    """Get the account configured through gcloud properties."""
    props = _read_gcloud_properties()
    return props.get("core", {}).get("account", "")


def gcp_credentials():
    """Get a valid access token using Application Default Credentials."""
    credentials, _ = _get_credentials()
    request = google.auth.transport.requests.Request()
    credentials.refresh(request)
    return credentials.token


def gcp_project():
    """Get the project, preferring ADC's project, falling back to gcloud properties."""
    _, project = _get_credentials()
    if project:
        return project
    props = _read_gcloud_properties()
    return props.get("core", {}).get("project", "")


def gcp_project_number():
    """Get the project number for the configured project using the Resource Manager API."""
    project_id = gcp_project()
    client = resourcemanager_v3.ProjectsClient()
    project = client.get_project(name=f"projects/{project_id}")
    # project.name is "projects/<number>"
    return project.name.split("/")[1]


def gcp_region():
    """Get the region from gcloud properties (dataproc.region or compute.region)."""
    props = _read_gcloud_properties()
    region = props.get("dataproc", {}).get("region", "")
    if not region:
        region = props.get("compute", {}).get("region", "")
    return region


def gcp_kernel_gateway_url():
    """Return the kernel gateway URL for the configured project and region."""
    project = gcp_project_number()
    region = gcp_region()
    return f"https://{project}-dot-{region}.kernels.googleusercontent.com"


def configure_gateway_client(c):
    """Configure the given Config object to use the GCP kernel gateway."""
    c.GatewayClient.url = gcp_kernel_gateway_url()
    c.GatewayClient.gateway_token_renewer_class = GoogleAuthTokenRenewer

    # Version 2.8.0 of the `jupyter_server` package requires the `auth_token`
    # value to be set to a non-empty value or else it will never invoke the
    # token renewer. To accommodate this, we set it to an invalid initial
    # value that will be immediately replaced by the token renewer.
    #
    # See https://github.com/jupyter-server/jupyter_server/issues/1339 for more
    # details and discussion.
    c.GatewayClient.auth_token = "Initial, invalid value"

    c.GatewayClient.auth_scheme = "Bearer"
    c.GatewayClient.headers = '{"Cookie": "_xsrf=XSRF", "X-XSRFToken": "XSRF"}'


# N.B. The two following regular expressions are used to prevent shell escape
# injections when updating gcloud properties.
#
# This means that we do not support the full set of potential property names and values.
#
# This is an intentional restriction.
_allowed_property_names = re.compile("^[a-zA-Z0-9_-]+$")
_allowed_property_values = re.compile("^[a-zA-Z0-9.:_-]+$")


async def _async_run_gcloud_subcommand(subcmd):
    """Run a gcloud sub-command asynchronously.

    Only used for `gcloud config set` operations in PropertiesHandler.
    """
    if sys.platform.startswith("win"):
        loop = asyncio.get_running_loop()
        from concurrent import futures
        with futures.ProcessPoolExecutor() as pool:
            return await loop.run_in_executor(pool, _run_gcloud_subcommand, subcmd)

    with tempfile.TemporaryFile() as t:
        p = await asyncio.create_subprocess_shell(
            f"gcloud {subcmd}",
            stdin=subprocess.DEVNULL,
            stderr=sys.stderr,
            stdout=t,
        )
        await p.wait()
        if p.returncode != 0:
            raise subprocess.CalledProcessError(p.returncode, None, None, None)
        t.seek(0)
        return t.read().decode("UTF-8").strip()


def _run_gcloud_subcommand(subcmd):
    """Run a gcloud sub-command synchronously.

    Only used for `gcloud config set` operations.
    """
    with tempfile.TemporaryFile() as t:
        subprocess.run(
            f"gcloud {subcmd}",
            stdin=subprocess.DEVNULL,
            stderr=sys.stderr,
            stdout=t,
            check=True,
            encoding="UTF-8",
            shell=True,
        )
        t.seek(0)
        return t.read().decode("UTF-8").strip()


class PropertiesHandler(APIHandler):
    @tornado.web.authenticated
    async def get(self):
        properties = _read_gcloud_properties()
        self.finish(json.dumps(properties))
        return

    @tornado.web.authenticated
    async def post(self):
        updated_properties = self.get_json_body()

        def flatten_dictionary(name_prefix, properties_dict):
            as_list = []
            for k in properties_dict:
                if not re.fullmatch(_allowed_property_names, k):
                    raise ValueError(
                        f"Property name {k} not supported. " +
                        f"Only properties matching the regular expression " +
                        f"{_allowed_property_names.pattern} are allowed.")
                v = properties_dict[k]
                if type(v) == str:
                    if not re.fullmatch(_allowed_property_values, v):
                        raise ValueError(
                            f"Property value {v} (for the property {k}) not supported. " +
                            f"Only property values matching the regular expression " +
                            f"{_allowed_property_values.pattern} are allowed.")
                    as_list.append((name_prefix + k, v))
                elif type(v) == dict:
                    as_list.extend(flatten_dictionary(name_prefix + k + "/", v))
            return as_list

        try:
            updated_properties_list = flatten_dictionary("", updated_properties)
            for k, v in updated_properties_list:
                await _async_run_gcloud_subcommand(f"config set {k} {v}")
            self.finish(json.dumps(updated_properties_list))
        except ValueError as ve:
            self.set_status(400)
            self.finish(str(ve))
        return
