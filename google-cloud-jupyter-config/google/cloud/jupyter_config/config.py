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
from concurrent import futures
import datetime
import json
import re
import subprocess
import sys
import tempfile
import threading

import cachetools
from jupyter_server.base.handlers import APIHandler
import tornado

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


async def _run_gcloud_subcommand_via_process_pool_executor(subcmd):
    loop = asyncio.get_running_loop()
    with futures.ProcessPoolExecutor() as pool:
        return await loop.run_in_executor(pool, run_gcloud_subcommand, subcmd)


async def async_run_gcloud_subcommand(subcmd):
    """Run a specified gcloud sub-command and return its output.

    The supplied subcommand is the full command line invocation, *except* for
    the leading `gcloud` being omitted.

    e.g. `info` instead of `gcloud info`.

    We reuse the system stderr for the command so that any prompts from gcloud
    will be displayed to the user.
    """

    # Jupyter forces the use of a SelectorEventLoop on Windows, which does not
    # support subprocesses. To work around that, on Windows (and *only* on
    # Windows), we run the gcloud command synchronously inside of a separate
    # process rather than asynchronously in the main process.
    #
    # This is a heavy-handed approach, but it ensures that our calls to gcloud
    # do not block the Tornado request serving thread.
    #
    # See https://github.com/jupyter-server/jupyter_server/issues/1587 for
    # more details.
    if sys.platform.startswith("win"):
        return await _run_gcloud_subcommand_via_process_pool_executor(subcmd)

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


@cachetools.cached(
    cache=cachetools.TTLCache(maxsize=1024, ttl=(20 * 60)), lock=threading.Lock()
)
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
    config = json.loads(out)
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


# N.B. The two following regular expressions are used to prevent shell escape
# injections when updating gcloud properties.
#
# This means that we do not support the full set of potential property names and values.
#
# This is an intentional restriction.
_allowed_property_names = re.compile("^[a-zA-Z0-9_-]+$")
_allowed_property_values = re.compile("^[a-zA-Z0-9.:_-]+$")


class PropertiesHandler(APIHandler):
    @tornado.web.authenticated
    async def get(self):
        properties = await async_get_gcloud_config("configuration.properties")
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
                await async_run_gcloud_subcommand(f"config set {k} {v}")
            clear_gcloud_cache()
            self.finish(json.dumps(updated_properties_list))
        except ValueError as ve:
            self.set_status(400)
            self.finish(str(ve))
        return
