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
import pytest
from traitlets.config import Configurable

from google.cloud.jupyter_config.websockets import DataprocGatewayWebSocketConnection


def test_websocket_connection_failure_reports_to_sink():
  """Verify WebSocket connection errors are caught and reported to notifications sink."""
  mock_sink = MagicMock()
  parent = Configurable()
  parent.remote_manager = MagicMock(notifications_sink=mock_sink)
  conn = DataprocGatewayWebSocketConnection(parent=parent)

  with patch.object(DataprocGatewayWebSocketConnection, "kernel_id", "k-123"), \
       patch("jupyter_server.gateway.connections.GatewayWebSocketConnection._connection_done"):
    fut = asyncio.Future()
    fut.set_exception(RuntimeError("HTTP 500: Internal Server Error"))
    conn._connection_done(fut)

  mock_sink.assert_called_once()
  assert "ws-k-123" == mock_sink.call_args[0][0][0]["id"]
  assert "Failed to connect to kernel k-123 via WebSocket: HTTP 500: Internal Server Error" == mock_sink.call_args[0][0][0]["message"]
  assert mock_sink.call_args[0][0][0]["sticky"] is False


def test_websocket_connection_success_does_not_report_to_sink():
  """Verify WebSocket connection success is silent and does not report to notifications sink."""
  mock_sink = MagicMock()
  parent = Configurable()
  parent.remote_manager = MagicMock(notifications_sink=mock_sink)
  conn = DataprocGatewayWebSocketConnection(parent=parent)

  with patch.object(DataprocGatewayWebSocketConnection, "kernel_id", "k-456"), \
       patch("jupyter_server.gateway.connections.GatewayWebSocketConnection._connection_done"):
    fut = asyncio.Future()
    fut.set_result(None)
    conn._connection_done(fut)

  mock_sink.assert_not_called()
