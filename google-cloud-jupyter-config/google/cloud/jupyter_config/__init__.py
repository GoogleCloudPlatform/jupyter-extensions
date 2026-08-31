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

from traitlets.config import Configurable
from jupyter_server.utils import url_path_join

from google.cloud.jupyter_config.config import async_get_gcloud_config
from google.cloud.jupyter_config.config import get_gcloud_config
from google.cloud.jupyter_config.config import gcp_project
from google.cloud.jupyter_config.config import gcp_region
from google.cloud.jupyter_config.config import configure_gateway_client
from google.cloud.jupyter_config.config import PropertiesHandler
from google.cloud.jupyter_config.managers import DataprocGatewayKernelSpecManager
from google.cloud.jupyter_config.managers import DataprocGatewayMappingKernelManager
from google.cloud.jupyter_config.websockets import DataprocGatewayWebSocketConnection
from google.cloud.jupyter_config.notifications import (
    NOTIFICATION_SCHEMA_ID,
    DATAPROC_NOTIFICATION_SCHEMA,
    DataprocNotificationHandler,
)


def _load_jupyter_server_extension(server_app):
    host_pattern = ".*$"
    base_url = server_app.web_app.settings["base_url"]
    config_url = url_path_join(base_url, "gcloud", "config", "properties")
    server_app.web_app.add_handlers(host_pattern, [(config_url, PropertiesHandler)])

    try:
        server_app.event_logger.register_event_schema(DATAPROC_NOTIFICATION_SCHEMA)
        parent = server_app if isinstance(server_app, Configurable) else None
        DataprocNotificationHandler.instance(
            parent=parent,
            event_logger=getattr(server_app, "event_logger", None),
        )
        server_app.log.info("Initialized Dataproc Notification System backend")
    except Exception as e:
        server_app.log.error(f"Failed to initialize Dataproc Notification System: {e}")


def _jupyter_server_extension_points():
    return [{"module": "google.cloud.jupyter_config"}]
