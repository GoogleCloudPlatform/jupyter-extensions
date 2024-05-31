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

import datetime
import json
import uuid

from tornado.escape import json_decode, utf8

from jupyter_server.gateway.connections import GatewayWebSocketConnection
from jupyter_server.gateway.managers import GatewayKernelManager
from jupyter_server.services.kernels.connection.base import BaseKernelWebsocketConnection
from jupyter_server.services.kernels.connection.channels import ZMQChannelsWebsocketConnection

class StartingReportingWebsocketConnection(GatewayWebSocketConnection):
    """Extension of GatewayWebSocketConnection that reports a starting status on connection.

    The purpose of this class is to bridge the time period between when the websocket
    connection from the client is created and the websocket connection to the Gateway
    server is created.

    During that time, the JupyterLab UI believes that it is connected to the running
    kernel, but it has not yet received any status messages from the kernel, so it will
    display a kernel status of "Unknown".

    That "Unknown" status is not very helpful to users because they have no idea why
    the kernel status is unknown and have no indication that something is still
    happening under the hood.

    To improve that, we report a provisional status as soon as the client connection
    is established. This provisional status will be replaced by the real status
    reported by the kernel as soon as the backend kernel connection is established.

    The only kernel statuses supported by the JupyterLab UI are "starting", "idle",
    "busy", "restarting", and "dead".

    Of those, the "starting" message is the closest match to what is going on, so
    we use that one.

    However, the "starting" message is only supposed to be reported once, so we
    also intercept any "starting" messages received from the kernel and discard
    them, as we know we will have already reported this status.
    """
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

    async def connect(self):
        # The kernel message format is defined
        # [here](https://jupyter-client.readthedocs.io/en/latest/messaging.html#general-message-format).
        status_message_id = str(uuid.uuid4())
        status_message = {
            "header": {
                "msg_id": status_message_id,
                "session": self.kernel_id,
                "username": "username",
                "date": datetime.datetime.utcnow().isoformat(),
                "msg_type": "status",
                "version": "5.3",
            },
            "parent_header": {},
            "metadata": {},
            "msg_id": status_message_id,
            "msg_type": "status",
            "channel": "iopub",
            "content": {
                "execution_state": "starting",
            },
            "buffers": [],
        }
        super().handle_outgoing_message(json.dumps(status_message))
        return await super().connect()

    def is_starting_message(self, incoming_msg):
        try:
            msg = json_decode(utf8(incoming_msg))
            if msg.get("content", {}).get("execution_state", "") == "starting":
                return True
        except Exception as ex:
            pass
        return False

    def handle_outgoing_message(self, incoming_msg, *args, **kwargs):
        if self.is_starting_message(incoming_msg):
            # We already sent a starting message, so drop this one.
            return
        return super().handle_outgoing_message(incoming_msg, *args, **kwargs)


class DelegatingWebsocketConnection(BaseKernelWebsocketConnection):
    """Implementation of BaseKernelWebsocketConnection that delegates to another connection.

    If the parent KernelManager instance is for a remote kernel (i.e. it is a
    GatewayKernelManager), then the delegate is an instance of
    StartingReportingWebsocketConnection, which extends GatewayWebSocketConnection.

    Otherwise, it is an instance of ZMQChannelsWebsocketConnection.
    """

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        delegate_class = ZMQChannelsWebsocketConnection
        if self.kernel_manager.is_remote:
            delegate_class = StartingReportingWebsocketConnection
        self.delegate = delegate_class(
            parent=self.kernel_manager.delegate,
            websocket_handler=self.websocket_handler,
            config=self.config)

    async def connect(self):
        return await self.delegate.connect()

    def disconnect(self):
        return self.delegate.disconnect()

    def handle_incoming_message(self, msg):
        return self.delegate.handle_incoming_message(msg)

    def handle_outgoing_message(self, stream, msg):
        return self.delegate.handle_outgoing_message(stream, msg)

    # Prepare actually comes from ZMQChannelsWebsocketConnection.
    #
    # It is called by the jupyter_server kernels websocket handler if present, so
    # we provide an implemention of it in case the delegate is an instance of the
    # ZMQChannelWebsocketConnection class.
    async def prepare(self):
        if hasattr(self.delegate, "prepare"):
            return await self.delegate.prepare()
