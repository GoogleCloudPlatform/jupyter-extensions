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

from jupyter_server.gateway.connections import GatewayWebSocketConnection
from jupyter_server.gateway.managers import GatewayKernelManager
from jupyter_server.services.kernels.connection.base import BaseKernelWebsocketConnection
from jupyter_server.services.kernels.connection.channels import ZMQChannelsWebsocketConnection

class DelegatingWebsocketConnection(BaseKernelWebsocketConnection):
    """Implementation of BaseKernelWebsocketConnection that delegates to another connection.

    If the parent KernelManager instance is for a remote kernel (i.e. it is a
    GatewayKernelManager), then the delegate is an instance of GatewayWebSocketConnection.

    Otherwise, it is an instance of ZMQChannelsWebsocketConnection.
    """

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        delegate_class = ZMQChannelsWebsocketConnection
        if self.kernel_manager.is_remote:
            delegate_class = GatewayWebSocketConnection
        self.delegate = delegate_class(
            parent=self.kernel_manager.delegate,
            websocket_handler=self.websocket_handler,
            config=self.config)

    async def connect(self):
        return await self.delegate.connect()

    async def disconnect(self):
        return await self.delegate.disconnect()

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
