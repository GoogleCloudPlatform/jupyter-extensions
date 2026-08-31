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

"""Unit tests for Dataproc Gateway WebSocket connections."""

import asyncio
from unittest.mock import MagicMock, patch
from google.cloud.jupyter_config.notifications import (
    NOTIFICATION_SCHEMA_ID,
    DataprocNotificationHandler,
)
from google.cloud.jupyter_config.websockets import DataprocGatewayWebSocketConnection


def test_websocket_connection_failure_reports_to_sink():
  """Verify WebSocket connection errors are caught and reported to notifications sink."""
  DataprocNotificationHandler.clear_instance()
  mock_logger = MagicMock()
  DataprocNotificationHandler.instance(event_logger=mock_logger)
  conn = DataprocGatewayWebSocketConnection()

  with patch.object(DataprocGatewayWebSocketConnection, "kernel_id", "k-123"), \
       patch("google.cloud.jupyter_config.websockets._BaseWebSocketConnection._connection_done"):
    fut = asyncio.Future()
    fut.set_exception(RuntimeError("HTTP 500: Internal Server Error"))
    conn._connection_done(fut)

  mock_logger.emit.assert_called_once()
  assert mock_logger.emit.call_args[1]["schema_id"] == NOTIFICATION_SCHEMA_ID
  assert mock_logger.emit.call_args[1]["data"]["id"].startswith("ws-k-123-")
  assert "Failed to connect to kernel k-123 via WebSocket: HTTP 500: Internal Server Error" == mock_logger.emit.call_args[1]["data"]["message"]
  assert mock_logger.emit.call_args[1]["data"]["sticky"] is False
  DataprocNotificationHandler.clear_instance()


def test_websocket_connection_success_does_not_report_to_sink():
  """Verify WebSocket connection success is silent and does not report to notifications sink."""
  DataprocNotificationHandler.clear_instance()
  mock_logger = MagicMock()
  DataprocNotificationHandler.instance(event_logger=mock_logger)
  conn = DataprocGatewayWebSocketConnection()

  with patch.object(DataprocGatewayWebSocketConnection, "kernel_id", "k-456"), \
       patch("google.cloud.jupyter_config.websockets._BaseWebSocketConnection._connection_done"):
    fut = asyncio.Future()
    fut.set_result(None)
    conn._connection_done(fut)

  mock_logger.emit.assert_not_called()
  DataprocNotificationHandler.clear_instance()
