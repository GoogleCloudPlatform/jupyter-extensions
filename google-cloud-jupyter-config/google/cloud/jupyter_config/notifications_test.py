# Copyright 2026 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     https://apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""Unit tests for Dataproc Gateway notifications handler."""

from unittest.mock import MagicMock
import pytest

from google.cloud.jupyter_config.notifications import (
    NOTIFICATION_SCHEMA_ID,
    DataprocNotificationHandler,
)


def test_dataproc_notifications_handler_deduplication():
  mock_logger = MagicMock()
  handler = DataprocNotificationHandler(mock_logger)

  notifications_run1 = [
      {"id": "1", "created": "100", "message": "Sticky 1", "sticky": True},
      {"id": "2", "created": "101", "message": "Non-sticky 2", "sticky": False},
  ]

  # First run: emits both
  handler(notifications_run1)
  assert mock_logger.emit.call_count == 2
  mock_logger.emit.assert_any_call(
      schema_id=NOTIFICATION_SCHEMA_ID,
      data={
          "id": "1",
          "created": "100",
          "message": "Sticky 1",
          "sticky": True,
      },
  )
  mock_logger.emit.assert_any_call(
      schema_id=NOTIFICATION_SCHEMA_ID,
      data={
          "id": "2",
          "created": "101",
          "message": "Non-sticky 2",
          "sticky": False,
      },
  )
  mock_logger.emit.reset_mock()

  # Second run (duplicate API poll): emits NOTHING
  handler(notifications_run1)
  mock_logger.emit.assert_not_called()

  # Third run: Sticky 1 is gone, new notification 3 appears
  notifications_run3 = [
      {"id": "3", "created": "102", "message": "New 3", "sticky": True},
  ]
  handler(notifications_run3)

  assert mock_logger.emit.call_count == 1
  mock_logger.emit.assert_called_once_with(
      schema_id=NOTIFICATION_SCHEMA_ID,
      data={
          "id": "3",
          "created": "102",
          "message": "New 3",
          "sticky": True,
      },
  )


def test_handler_memory_limit():
  mock_logger = MagicMock()
  handler = DataprocNotificationHandler(mock_logger)

  # Fill up seen_ids past the 1000 limit
  for i in range(1001):
    handler([{
        "id": str(i),
        "created": "100",
        "message": "msg",
        "sticky": False,
    }])

  # Should have truncated to roughly half
  assert len(handler.seen_ids) < 1001
  assert len(handler.seen_ids) > 400


@pytest.fixture
def jp_server_config():
  return {
      "ServerApp": {
          "jpserver_extensions": {"google.cloud.jupyter_config": True},
          "kernel_spec_manager_class": (
              "google.cloud.jupyter_config.managers"
              ".DataprocGatewayKernelSpecManager"
          ),
          "kernel_manager_class": (
              "google.cloud.jupyter_config.managers"
              ".DataprocGatewayMappingKernelManager"
          ),
      }
  }


async def test_extension_initialization_direct(jp_serverapp):
  # When server extension loads, the singleton is initialized and managers resolve it
  assert DataprocNotificationHandler.initialized()
  sink = jp_serverapp.kernel_spec_manager._get_notifications_sink()
  assert isinstance(sink, DataprocNotificationHandler)

  mapping_sink = jp_serverapp.kernel_manager._get_notifications_sink()
  assert isinstance(mapping_sink, DataprocNotificationHandler)


def test_extension_initialization_registers_schema_and_singleton():
  from google.cloud.jupyter_config import _load_jupyter_server_extension, DATAPROC_NOTIFICATION_SCHEMA
  DataprocNotificationHandler.clear_instance()

  mock_server_app = MagicMock()
  mock_server_app.web_app.settings = {"base_url": "/"}

  _load_jupyter_server_extension(mock_server_app)

  mock_server_app.event_logger.register_event_schema.assert_called_once_with(DATAPROC_NOTIFICATION_SCHEMA)
  assert DataprocNotificationHandler.initialized()
  DataprocNotificationHandler.clear_instance()


def test_singleton_instance_resolution():
  DataprocNotificationHandler.clear_instance()
  mock_logger = MagicMock()
  handler = DataprocNotificationHandler.instance(event_logger=mock_logger)
  assert DataprocNotificationHandler.instance() is handler
  assert DataprocNotificationHandler.initialized()
  DataprocNotificationHandler.clear_instance()
