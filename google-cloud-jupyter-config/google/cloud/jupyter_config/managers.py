# Copyright 2026 Google LLC
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

"""Custom Gateway managers for intercepting Dataproc notifications."""

from datetime import datetime, timezone
from google.cloud.jupyter_config.notifications import DataprocNotificationHandler
from jupyter_server.gateway.managers import (
    GatewayKernelSpecManager,
    GatewayMappingKernelManager,
)
from traitlets import Any


class DataprocGatewayKernelSpecManager(GatewayKernelSpecManager):
  """A GatewayKernelSpecManager that intercepts kernelspec notifications."""

  notifications_sink = Any(
      allow_none=True,
      config=True,
      help=(
          "Callback sink for intercepted notifications. "
          "Receives a list of notification dicts. Defaults to DataprocNotificationHandler.instance()."
      ),
  )

  def _get_notifications_sink(self):
    if self.notifications_sink is not None:
      return self.notifications_sink
    if DataprocNotificationHandler.initialized():
      return DataprocNotificationHandler.instance()
    return None

  async def list_kernel_specs(self):
    """Get a list of kernel specs and intercept warnings."""
    kernel_specs = await super().list_kernel_specs()

    sink = self._get_notifications_sink()
    if not isinstance(kernel_specs, dict) or not sink:
      return kernel_specs

    warnings = kernel_specs.get("warnings", [])
    notifications = []

    if isinstance(warnings, list):
      for warning in warnings:
        if (
            isinstance(warning, dict)
            and warning.get("id")
            and warning.get("message")
        ):
          notifications.append({
              "id": warning.get("id"),
              "created": datetime.now(timezone.utc).isoformat(),
              "message": warning.get("message"),
              "sticky": warning.get("sticky", False),
          })

    if notifications and sink:
      sink(notifications)
    return kernel_specs


class DataprocGatewayMappingKernelManager(GatewayMappingKernelManager):
  """A GatewayMappingKernelManager that intercepts kernel notifications."""

  notifications_sink = Any(
      allow_none=True,
      config=True,
      help=(
          "Callback sink for intercepted notifications. "
          "Receives a list of notification dicts. Defaults to DataprocNotificationHandler.instance()."
      ),
  )

  def _get_notifications_sink(self):
    if self.notifications_sink is not None:
      return self.notifications_sink
    if DataprocNotificationHandler.initialized():
      return DataprocNotificationHandler.instance()
    return None

  async def list_kernels(self, **kwargs):
    """Get running kernels and extract notifications for dead kernels."""

    kernels = await super().list_kernels(**kwargs)
    notifications = []

    sink = self._get_notifications_sink()
    if not isinstance(kernels, list) or not sink:
      return kernels

    for kernel in kernels:
      if isinstance(kernel, dict) and (
          kernel.get("execution_state") == "dead" or kernel.get("status") == "dead"
      ):
        kernel_id = kernel.get("id", "unknown")
        reason = kernel.get("message", "Unknown")
        notifications.append({
            "id": kernel_id,
            "created": datetime.now(timezone.utc).isoformat(),
            "message": f"Kernel {kernel_id} is not responsive: {reason}",
            "sticky": False,
        })

    if notifications and sink:
      sink(notifications)
    return kernels
