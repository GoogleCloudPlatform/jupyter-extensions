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

"""Custom Gateway WebSocket connection for Dataproc kernels."""

from datetime import datetime, timezone
from google.cloud.jupyter_config.notifications import DataprocNotificationHandler
try:
  from kernels_mixer.websockets import StartingReportingWebsocketConnection as _BaseWebSocketConnection
except ImportError:
  from jupyter_server.gateway.connections import GatewayWebSocketConnection as _BaseWebSocketConnection


class DataprocGatewayWebSocketConnection(_BaseWebSocketConnection):
  """Gateway WebSocket connection that reports Dataproc connection events."""

  def _connection_done(self, fut):
    """Handle finished WebSocket connection future."""
    super()._connection_done(fut)
    if not self.disconnected and not fut.cancelled():
      exc = fut.exception()
      if exc is not None:
        self._report_websocket_event(
            f"Failed to connect to kernel {self.kernel_id} via WebSocket: {exc}"
        )

  def _report_websocket_event(self, message):
    """Find the notifications_sink in the manager hierarchy and report WebSocket event."""
    if not DataprocNotificationHandler.initialized():
      return

    sink = DataprocNotificationHandler.instance()
    try:
      sink([
          {
              "id": f"ws-{self.kernel_id}-{abs(hash(message))}",
              "created": datetime.now(timezone.utc).isoformat(),
              "message": message,
              "sticky": False,
          }
      ])
    except Exception as sink_ex:  # pylint: disable=broad-exception-caught
      self.log.error(
          f"Failed to push WebSocket error to notification sink: {sink_ex}"
      )
