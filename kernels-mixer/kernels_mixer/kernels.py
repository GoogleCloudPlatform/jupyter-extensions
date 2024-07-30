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

import copy

from jupyter_client.kernelspec import KernelSpecManager
from jupyter_client.manager import in_pending_state
from jupyter_core.utils import ensure_async, run_sync
from jupyter_server.gateway.managers import GatewayMappingKernelManager
from jupyter_server.services.kernels.kernelmanager import AsyncMappingKernelManager
from jupyter_server.services.kernels.kernelmanager import ServerKernelManager

from traitlets import Instance, default, observe

from .kernelspecs import MixingKernelSpecManager

class MixingMappingKernelManager(AsyncMappingKernelManager):

    kernel_spec_manager = Instance(KernelSpecManager)

    @default("kernel_spec_manager")
    def _default_kernel_spec_manager(self):
        return "kernels_mixer.kernelspecs.MixingKernelSpecManager"

    @observe("kernel_spec_manager")
    def _observe_kernel_spec_manager(self, change):
        self.log.debug(f"Configured kernel spec manager: {change.new}")
        if isinstance(change.new, MixingKernelSpecManager):
            return
        self.kernel_spec_manager = MixingKernelSpecManager(parent=change.new.parent)
        self.kernel_spec_manager.local_manager = change.new
        self.parent.kernel_spec_manager = self.kernel_spec_manager

    @default("kernel_manager_class")
    def _default_kernel_manager_class(self):
        return "kernels_mixer.kernels.MixingKernelManager"
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.log.debug(f"Kernel spec manager: {self.kernel_spec_manager}")

        # Set up the local kernel management.
        self.local_manager = AsyncMappingKernelManager(
            parent=self.parent,
            log=self.log,
            connection_dir=self.connection_dir,
            kernel_spec_manager=self.kernel_spec_manager.local_manager)

        # Set up the remote kernel management.
        self.remote_manager = GatewayMappingKernelManager(
            parent=self.parent,
            log=self.log,
            connection_dir=self.connection_dir,
            kernel_spec_manager=self.kernel_spec_manager.remote_manager)

    def has_remote_kernels(self):
        for kid in self._kernels:
            if self._kernels[kid].is_remote:
                return True
        return False

    async def list_kernels(self):
        if self.has_remote_kernels():
            # We have remote kernels, so we must call `list_kernels` on the
            # Gateway kernel manager to update our kernel models.
            try:
                await ensure_async(self.remote_manager.list_kernels())
            except Exception as ex:
                self.log.exception('Failure listing remote kernels: %s', ex)
                # Ignore the exception listing remote kernels, so that local kernels are still usable.
        return super().list_kernels()

    def kernel_model(self, kernel_id):
        self._check_kernel_id(kernel_id)
        kernel = self._kernels[kernel_id]
        # Normally, calls to `run_sync` pose a danger of locking up Tornado's
        # single-threaded event loop.
        #
        # However, the call below should be fine because it cannot block for an
        # arbitrary amount of time.
        #
        # This call blocks on the `model` method defined below, which in turn
        # blocks on the `GatewayMappingKernelManager`'s `kernel_model` method
        # (https://github.com/jupyter-server/jupyter_server/blob/547f7a244d89f79dd09fa7d382322d1c40890a3f/jupyter_server/gateway/managers.py#L94).
        #
        # That will only take a small, deterministic amount of time to complete
        # because that `kernel_model` only operates on existing, in-memory data
        # and does not block on any outgoing network requests.
        return run_sync(kernel.model)()

class MixingKernelManager(ServerKernelManager):
    _kernel_id_map = {}

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

    @property
    def is_remote(self):
        if not self.kernel_name or not self.kernel_id:
            return False
        return self.parent.kernel_spec_manager.is_remote(self.kernel_name)

    @property
    def delegate_kernel_id(self):
        if not self.kernel_id:
            return None
        return MixingKernelManager._kernel_id_map.get(self.kernel_id, None)

    @property
    def delegate_multi_kernel_manager(self):
        if self.is_remote:
            return self.parent.remote_manager
        return self.parent.local_manager

    @property
    def delegate(self):
        if not self.kernel_name or not self.kernel_id:
            return None
        return self.delegate_multi_kernel_manager.get_kernel(self.delegate_kernel_id)

    @property
    def has_kernel(self):
        delegate = self.delegate
        if not delegate:
            return false
        return delegate.has_kernel

    def client(self, *args, **kwargs):
        delegate = self.delegate
        if not delegate:
            return None
        return delegate.client(*args, **kwargs)

    @in_pending_state
    async def start_kernel(self, *args, **kwargs):
        self.kernel_name = kwargs.get("kernel_name", self.kernel_name)
        kernel_id = kwargs.pop("kernel_id", self.kernel_id)
        if kernel_id:
            self.kernel_id = kernel_id
        created_kernel_id = await ensure_async(self.delegate_multi_kernel_manager.start_kernel(
            kernel_name=self.kernel_name, **kwargs))
        MixingKernelManager._kernel_id_map[self.kernel_id] = created_kernel_id

    async def shutdown_kernel(self, *args, **kwargs):
        await ensure_async(self.delegate_multi_kernel_manager.shutdown_kernel(
            self.delegate_kernel_id, *args, **kwargs))
        MixingKernelManager._kernel_id_map.pop(self.kernel_id)

    async def interrupt_kernel(self):
        await ensure_async(self.delegate_multi_kernel_manager.interrupt_kernel(
            self.delegate_kernel_id))

    async def restart_kernel(self, *args, **kwargs):
        await ensure_async(self.delegate_multi_kernel_manager.restart_kernel(
            self.delegate_kernel_id, *args, **kwargs))

    async def model(self):
        delegate_model = await ensure_async(
            self.delegate_multi_kernel_manager.kernel_model(self.delegate_kernel_id))
        model = copy.deepcopy(delegate_model)
        model["id"] = self.kernel_id
        return model
