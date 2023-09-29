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
import unittest
import uuid

from jupyter_client.kernelspec import KernelSpec
from jupyter_client.kernelspec import KernelSpecManager
from jupyter_core.utils import ensure_async, run_sync
from jupyter_server.gateway.gateway_client import GatewayClient
from jupyter_server.gateway.managers import GatewayMappingKernelManager
from jupyter_server.services.kernels.kernelmanager import AsyncMappingKernelManager, ServerKernelManager

from kernels_mixer.kernels import MixingMappingKernelManager
from kernels_mixer.kernelspecs import MixingKernelSpecManager

remote_kernel = "remote-python3"
remote_kernel_manager = KernelSpecManager()
remote_kernel_manager.default_kernel_name=remote_kernel
local_kernel_manager = KernelSpecManager()


def mock_kernel_spec(kernel_name):
    return KernelSpec(name=kernel_name, display_name=kernel_name, language="python")


class MockKernelSpecManager(KernelSpecManager):
    def get_kernel_spec(self, kernel_name, **kwargs):
        return mock_kernel_spec(kernel_name)

    def get_all_specs(self):
        return [self.get_kernel_spec(self.default_kernel_name)]

    def list_kernel_specs(self):
        return {
            "default": self.default_kernel_name,
            "kernelspecs": self.get_all_specs(),
        }


class MockClient():
    async def wait_for_ready(self, *args, **kwargs):
        return


class MockKernelManager(ServerKernelManager):
    def __init__(self, *args, **kwargs):
        super(MockKernelManager, self).__init__(*args, **kwargs)
        self.kernel_id = None
        pass

    def has_kernel(self):
        return self.kernel_id is not None

    def client(self, *args, **kwargs):
        return MockClient()

    async def start_kernel(self, kernel_name=None, kernel_id=None, **kwargs):
        kernel_name = kernel_name or self.parent.kernel_spec_manager.default_kernel_name
        kernel_id = kernel_id or str(uuid.uuid4())
        self.kernel_name = kernel_name
        self.kernel_id = kernel_id
        self.last_activity = datetime.datetime.utcnow()
        self.execution_state = "idle"
        self.ready.set_result(None)
        return kernel_id

    async def shutdown_kernel(self, *args, **kwargs):
        self.kernel_id = None

    async def restart_kernel(self, *args, **kwargs):
        pass

    async def interrupt_kernel(self, *args, **kwargs):
        pass


class MockLocalMappingKernelManager(AsyncMappingKernelManager):
    def __init__(self, *args, **kwargs):
        super(MockLocalMappingKernelManager, self).__init__(*args, **kwargs)
        self.kernel_spec_manager = MockKernelSpecManager()
        self.kernel_manager_class = "kernels_mixer.kernels_test.MockKernelManager"

    async def start_kernel(self, *args, **kwargs):
        km = self.kernel_manager_factory(parent=self)
        kernel_id = await km.start_kernel(*args, **kwargs)
        self._kernels[kernel_id] = km
        return kernel_id

    def _get_changed_ports(self, *args, **kwargs):
        pass


class MockRemoteMappingKernelManager(GatewayMappingKernelManager):
    def __init__(self, *args, **kwargs):
        self.kernel_spec_manager = MockKernelSpecManager()
        self.kernel_spec_manager.default_kernel_name = remote_kernel
        self.kernel_manager_class = "kernels_mixer.kernels_test.MockKernelManager"

    def kernel_model(self, kernel_id):
        return {
            "id": kernel_id,
            "name": self.kernel_spec_manager.default_kernel_name,
            "additional": {
                "foo": "bar",
            },
        }


class MockMixingKernelSpecManager(MixingKernelSpecManager):
    def __init__(self, local_km=None, remote_km=None, **kwargs):
        self.local_manager = local_km or local_kernel_manager
        self.remote_manager= remote_km or remote_kernel_manager
        self._local_kernels = set()
        self._remote_kernels = set()

    def is_remote(self, kernel_name):
        return kernel_name == remote_kernel

class TestKernelModel(unittest.TestCase):
    gwc = GatewayClient.instance()
    gwc.url = gwc.url or "https://example.com"
    gwc.kernelspecs_endpoint = gwc.kernelspecs_endpoint or "/api/kernelspecs"

    local_multikernel_manager = MockLocalMappingKernelManager()
    remote_multikernel_manager =  MockRemoteMappingKernelManager()
    ksm = MockMixingKernelSpecManager(
        local_km=local_multikernel_manager,
        remote_km=remote_multikernel_manager)
    mkm = MixingMappingKernelManager(kernel_spec_manager=ksm)
    mkm.local_manager = local_multikernel_manager
    mkm.remote_manager = remote_multikernel_manager

    async def interrupt_kernel(self, kernel_id):
        await ensure_async(self.mkm.interrupt_kernel(kernel_id))

    def test_local_kernel_model(self):
        local_kernel_name = "python3"
        local_kernel_id = run_sync(self.mkm.start_kernel)(kernel_name=local_kernel_name)
        local_kernel_model = self.mkm.kernel_model(local_kernel_id)
        self.assertEqual(local_kernel_model["id"], local_kernel_id)
        self.assertEqual(local_kernel_model["name"], local_kernel_name)
        self.assertEqual(local_kernel_model["execution_state"], "idle")
        self.assertNotIn("additional", local_kernel_model)
        run_sync(self.interrupt_kernel)(local_kernel_id)
        run_sync(self.mkm.restart_kernel)(local_kernel_id)

    def test_remote_kernel_model(self):
        remote_kernel_id = run_sync(self.mkm.start_kernel)(kernel_name=remote_kernel)
        remote_kernel_model = self.mkm.kernel_model(remote_kernel_id)
        self.assertEqual(remote_kernel_model["id"], remote_kernel_id)
        self.assertEqual(remote_kernel_model["name"], remote_kernel)
        self.assertEqual(remote_kernel_model["additional"]["foo"], "bar")
        self.assertNotIn("execution_state", remote_kernel_model)
        run_sync(self.interrupt_kernel)(remote_kernel_id)
        run_sync(self.mkm.restart_kernel)(remote_kernel_id)


if __name__ == '__main__':
    unittest.main()
