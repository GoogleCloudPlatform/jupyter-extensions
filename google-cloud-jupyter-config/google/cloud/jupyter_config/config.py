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
import datetime
import json
import subprocess
import sys
import tempfile

import cachetools

from google.cloud.jupyter_config.tokenrenewer import CommandTokenRenewer


def run_gcloud_subcommand(subcmd):
    """Run a specified gcloud sub-command and return its output.

    The supplied subcommand is the full command line invocation, *except* for
    the leading `gcloud` being omitted.

    e.g. `info` instead of `gcloud info`.

    We reuse the system stderr for the command so that any prompts from gcloud
    will be displayed to the user.
    """
    with tempfile.TemporaryFile() as t:
        p = subprocess.run(
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


async def async_run_gcloud_subcommand(subcmd):
    """Run a specified gcloud sub-command and return its output.

    The supplied subcommand is the full command line invocation, *except* for
    the leading `gcloud` being omitted.

    e.g. `info` instead of `gcloud info`.

    We reuse the system stderr for the command so that any prompts from gcloud
    will be displayed to the user.
    """
    with tempfile.TemporaryFile() as t:
        p = await asyncio.create_subprocess_shell(
            f"gcloud {subcmd}",
            stdin=subprocess.DEVNULL,
            stderr=sys.stderr,
            stdout=t,
            check=True,
        )
        await p.wait()
        t.seek(0)
        return t.read().decode("UTF-8").strip()


@cachetools.cached(cache=cachetools.TTLCache(maxsize=1024, ttl=(20 * 60)))
def cached_gcloud_subcommand(subcmd):
    return run_gcloud_subcommand(subcmd)


def clear_gcloud_cache():
    """Clear the TTL cache used to cache gcloud subcommand results."""
    cached_gcloud_subcommand.cache_clear()


def _get_config_field(config, field):
    subconfig = config
    for path_part in field.split("."):
        if path_part:
            subconfig = subconfig.get(path_part, {})
    return subconfig


def get_gcloud_config(field):
    """Helper method that invokes the gcloud config helper.

    Invoking gcloud commands is a very heavyweight process, so the config is
    cached for up to 20 minutes.

    The config is generated with a minimum credential expiry of 30 minutes, so
    that we can ensure that the caller can use the cached credentials for at
    least ~10 minutes even if the cache entry is about to expire.

    Args:
        field: A period-separated search path for the config value to return.
               For example, 'configuration.properties.core.project'
    Returns:
        A JSON object whose type depends on the search path for the field within
        the gcloud config.

        For example, if the field is `configuration.properties.core.project`,
        then the return value will be a string. In comparison, if the field
        is `configuration.properties.core`, then the return value will be a
        dictionary containing a field named `project` with a string value.
    """
    subcommand = "config config-helper --min-expiry=30m --format=json"
    cached_config_str = cached_gcloud_subcommand(subcommand)
    cached_config = json.loads(cached_config_str)
    return _get_config_field(cached_config, field)


async def async_get_gcloud_config(field):
    """Async helper method that invokes the gcloud config helper.

    This is like `get_gcloud_config` but does not block on the underlying
    gcloud invocation when there is a cache miss.

    Args:
        field: A period-separated search path for the config value to return.
               For example, 'configuration.properties.core.project'
    Returns:
        An awaitable that resolves to a JSON object with a type depending on
        the search path for the field within the gcloud config.

        For example, if the field is `configuration.properties.core.project`,
        then the JSON object will be a string. In comparison, if the field
        is `configuration.properties.core`, then it will be a dictionary
        containing a field named `project` with a string value.
    """
    subcommand = "config config-helper --min-expiry=30m --format=json"
    with cached_gcloud_subcommand.cache_lock:
        if subcommand in cached_gcloud_subcommand.cache:
            cached_config_str = cached_gcloud_subcommand.cache[subcommand]
            cached_config = json.loads(cached_config_str)
            return _get_config_field(cached_config, field)

    out = await async_run_gcloud_subcommand(subcommand)
    with cached_gcloud_subcommand.cache_lock:
        cached_gcloud_subcommand.cache[subcommand] = out
    config = json.loads(cached_config_str)
    return _get_config_field(config, field)


def gcp_account():
    """Helper method to get the project configured through gcloud"""
    return get_gcloud_config("configuration.properties.core.account")


def gcp_credentials():
    """Helper method to get the project configured through gcloud"""
    return get_gcloud_config("credential.access_token")


def gcp_project():
    """Helper method to get the project configured through gcloud"""
    return get_gcloud_config("configuration.properties.core.project")


def gcp_project_number():
    """Helper method to get the project number for the project configured through gcloud"""
    project = gcp_project()
    return run_gcloud_subcommand(
        f'projects describe {project} --format="value(projectNumber)"'
    )


def gcp_region():
    """Helper method to get the project configured through gcloud"""
    region = get_gcloud_config("configuration.properties.dataproc.region")
    if not region:
        region = get_gcloud_config("configuration.properties.compute.region")
    return region


def gcp_kernel_gateway_url():
    """Helper method to return the kernel gateway URL for the configured project and region."""
    project = gcp_project_number()
    region = gcp_region()
    return f"https://{project}-dot-{region}.kernels.googleusercontent.com"


def configure_gateway_client(c):
    """Helper method for configuring the given Config object to use the GCP kernel gateway."""
    c.GatewayClient.url = gcp_kernel_gateway_url()
    c.GatewayClient.gateway_token_renewer_class = CommandTokenRenewer
    c.CommandTokenRenewer.token_command = (
        'gcloud config config-helper --format="value(credential.access_token)"'
    )

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
