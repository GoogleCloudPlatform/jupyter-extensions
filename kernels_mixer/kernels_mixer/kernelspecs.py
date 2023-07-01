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

from jupyter_client.kernelspec import KernelSpecManager
from jupyter_core.utils import run_sync
from jupyter_server.gateway.managers import GatewayKernelSpecManager

class MixingKernelSpecManager(KernelSpecManager):

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.local_manager = KernelSpecManager(*args, **kwargs)
        self.remote_manager= GatewayKernelSpecManager(*args, **kwargs)
        self._local_kernels = set()
        self._remote_kernels = set()

    def is_remote(self, kernel_name):
        return kernel_name in self._remote_kernels

    def get_all_specs(self):
        ks = self.local_manager.get_all_specs()
        for name in ks:
            self._local_kernels = self._local_kernels | {name}
        try:
            remote_ks = run_sync(self.remote_manager.get_all_specs)()
            for name, spec in remote_ks.items():
                if name not in self._local_kernels:
                    ks[name] = spec
                    self._remote_kernels = self._remote_kernels | {name}
        except Exception as ex:
            self.log.exception('Failure listing remote kernelspecs: %s', ex)
            # Otherwise ignore the exception, so that local kernels are still usable.
        self.log.debug(f'Found {len(self._local_kernels)} local kernels: {self._local_kernels}')
        self.log.debug(f'Found {len(self._remote_kernels)} remote kernels: {self._remote_kernels}')
        return ks

    def get_kernel_spec(self, kernel_name, *args, **kwargs):
        if self.is_remote(kernel_name):
            self.log.debug(f'Looking up remote kernel {kernel_name}...')
            return run_sync(self.remote_manager.get_kernel_spec)(kernel_name, *args, **kwargs)
        self.log.debug(f'Looking up local kernel {kernel_name}...')
        return self.local_manager.get_kernel_spec(kernel_name, *args, **kwargs)

    async def get_kernel_spec_resource(self, kernel_name, path):
        if self.is_remote(kernel_name):
            self.log.debug(f'Looking up remote kernel spec resource for {kernel_name}...')
            return await self.remote_manager.get_kernel_spec_resource(kernel_name, path)
        return None

    
