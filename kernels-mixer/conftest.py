# Copyright 2024 Google LLC
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

import pytest

from jupyter_client.kernelspec import KernelSpecManager
from jupyter_server.services.sessions.sessionmanager import SessionManager

from kernels_mixer.kernelspecs import MixingKernelSpecManager
from kernels_mixer.kernels import MixingMappingKernelManager
from kernels_mixer.websockets import DelegatingWebsocketConnection


pytest_plugins = ['pytest_jupyter.jupyter_server']


@pytest.fixture
def jp_server_config(jp_server_config):
    return {
        "ServerApp": {
            "kernel_spec_manager_class": KernelSpecManager,
            "kernel_manager_class": MixingMappingKernelManager,
            "kernel_websocket_connection_class": DelegatingWebsocketConnection,
            "session_manager_class": SessionManager,
        },
    }
