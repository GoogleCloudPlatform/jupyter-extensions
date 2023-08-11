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

from google.cloud.jupyter_config import configure_gateway_client

from kernels_mixer.kernelspecs import MixingKernelSpecManager
from kernels_mixer.kernels import MixingMappingKernelManager
from kernels_mixer.websockets import DelegatingWebsocketConnection

from jupyter_server.services.sessions.sessionmanager import SessionManager

def configure_kernels_mixer(c):
  """Helper method for configuring the given Config object to use the GCP kernel gateway."""
  configure_gateway_client(c)
  c.ServerApp.kernel_spec_manager_class = MixingKernelSpecManager
  c.ServerApp.kernel_manager_class = MixingMappingKernelManager
  c.ServerApp.session_manager_class = SessionManager
  c.ServerApp.kernel_websocket_connection_class = DelegatingWebsocketConnection
