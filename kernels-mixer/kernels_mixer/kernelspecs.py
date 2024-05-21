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
from jupyter_core.utils import ensure_async
from jupyter_server.gateway.managers import GatewayKernelSpecManager

from traitlets import Type, Unicode, default


def append_display_name(spec, suffix):
    """Append the given suffix onto the display name of the given kernelspec.

    The supplied kernelspec is updated in place.

    Args:
      spec: Either an object with a "display_name" attribute, or a
            dictionary with a "display_name" string field.
      suffix: A string suffix to append to the spec's display name.
    """
    if hasattr(spec, "display_name"):
        spec.display_name = spec.display_name + suffix
    else:
        spec["display_name"] = spec.get("display_name", "") + suffix


class MixingKernelSpecManager(KernelSpecManager):

    local_display_name_suffix = Unicode(
        " (Local)",
        config=True,
        help="Suffix added to the display names of local kernels.",
    )

    remote_display_name_suffix = Unicode(
        " (Remote)",
        config=True,
        help="Suffix added to the display names of remote kernels.",
    )

    local_kernel_spec_manager_class = Type(
        config=True,
        default_value=KernelSpecManager,
        help="""
        The kernel spec manager class to use for local kernels.

        Must be a subclass of `jupyter_client.kernelspec.KernelSpecManager`.""",
    )

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.local_manager = self.local_kernel_spec_manager_class(*args, **kwargs)
        self.remote_manager= GatewayKernelSpecManager(*args, **kwargs)
        self._local_kernels = set()
        self._remote_kernels = set()

    def is_remote(self, kernel_name):
        return kernel_name in self._remote_kernels

    async def get_all_specs(self):
        """Get a list of all kernelspecs supported.

        This is a combination of the kernelspecs supported by both the local and remote
        kernel spec managers.

        In case a kernel name is supported by both the local and remote kernel spec
        manager, the local kernel spec manager's version is used and the remote
        one is ignored.

        The return value is a dictionary mapping kernel names to kernelspecs.

        Each kernelspec is a dictionary with the following keys:
          1. "name": The name of the kernel, which must adhere to the Jupyter API naming rules.
          2. "spec": A "KernelSpecFile" resource, which itself is a dictionary.
          3. "resources": A dictionary mapping resource names to URIs.

        A KernelSpecFile dictionary is described here:
          https://github.com/jupyter-server/jupyter_server/blob/c5dc0f696f376e1db5a9a0cbcebb40a0bf98875c/jupyter_server/services/api/api.yaml#L781

        Of particular note, it contains one entry with a key of "display_name" whose value is
        the name for the kernel displayed in the JupyterLab launcher and kernel picker.

        Returns:
          A map from kernel names (str) to kernelspecs.
        """
        ks = self.local_manager.get_all_specs()
        for name, kernelspec in ks.items():
            spec = kernelspec.get("spec", {})
            append_display_name(spec, self.local_display_name_suffix)
            self._local_kernels = self._local_kernels | {name}
        try:
            remote_ks = await ensure_async(self.remote_manager.get_all_specs())
            for name, kernelspec in remote_ks.items():
                if name not in self._local_kernels:
                    spec = kernelspec.get("spec", {})
                    append_display_name(spec, self.remote_display_name_suffix)
                    ks[name] = kernelspec
                    self._remote_kernels = self._remote_kernels | {name}
                    
        except Exception as ex:
            self.log.exception('Failure listing remote kernelspecs: %s', ex)
            # Otherwise ignore the exception, so that local kernels are still usable.
        self.log.debug(f'Found {len(self._local_kernels)} local kernels: {self._local_kernels}')
        self.log.debug(f'Found {len(self._remote_kernels)} remote kernels: {self._remote_kernels}')
        return ks

    async def get_original_kernel_spec(self, kernel_name, *args, **kwargs):
        if self.is_remote(kernel_name):
            self.log.debug(f'Looking up remote kernel {kernel_name}...')
            return await self.remote_manager.get_kernel_spec(kernel_name, *args, **kwargs)
        self.log.debug(f'Looking up local kernel {kernel_name}...')
        return self.local_manager.get_kernel_spec(kernel_name, *args, **kwargs)

    async def get_kernel_spec(self, kernel_name, *args, **kwargs):
        spec = await self.get_original_kernel_spec(kernel_name, *args, **kwargs)
        suffix = self.local_display_name_suffix
        if self.is_remote(kernel_name):
            suffix = self.remote_display_name_suffix
        append_display_name(spec, suffix)
        return spec

    async def get_kernel_spec_resource(self, kernel_name, path):
        if self.is_remote(kernel_name):
            self.log.debug(f'Looking up remote kernel spec resource for {kernel_name}...')
            return await self.remote_manager.get_kernel_spec_resource(kernel_name, path)
        return None
