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

"""Notification system implementation for JupyterLab and VS Code."""

import logging

from traitlets import Any
from traitlets.config import SingletonConfigurable

logger = logging.getLogger(__name__)

# --- Event Schemas ---

NOTIFICATION_SCHEMA_ID = "http://cloud.google.com/dataproc-jupyter/notification"

DATAPROC_NOTIFICATION_SCHEMA = f"""
$id: {NOTIFICATION_SCHEMA_ID}
version: "1"
title: Dataproc Notification
properties:
  id:
    title: Event ID
    type: string
  created:
    title: Creation timestamp
    type: string
  message:
    title: Notification message
    type: string
  sticky:
    title: Sticky Notification
    description: Whether the notification should be sticky
    type: boolean
required:
  - id
  - created
  - message
"""


# --- Handler ---


class DataprocNotificationHandler(SingletonConfigurable):
  """Callback handler for intercepted notifications.

  Accounts for duplicate messages and emits notification events.
  """

  event_logger = Any(
      allow_none=True,
      config=True,
      help="Jupyter EventLogger instance used to emit notification events.",
  )

  def __init__(self, *args, **kwargs):
    if args and not kwargs.get("event_logger"):
      kwargs["event_logger"] = args[0]
      args = args[1:]
    super().__init__(*args, **kwargs)
    self.seen_ids = {}
    if self.event_logger is None and hasattr(self.parent, "event_logger"):
      self.event_logger = self.parent.event_logger

  def __call__(self, notifications):
    """Handle intercepted notifications from REST API polls."""
    if not notifications or not self.event_logger:
      return

    for notification in notifications:
      if not isinstance(notification, dict):
        continue
      notification_id = notification.get("id")
      if not notification_id or notification_id in self.seen_ids:
        continue

      try:
        self.event_logger.emit(
            schema_id=NOTIFICATION_SCHEMA_ID,
            data=notification,
        )
        self.seen_ids[notification_id] = None

        # Prevent unbounded memory growth for extremely long-running servers
        if len(self.seen_ids) > 1000:
          to_remove = len(self.seen_ids) // 2
          for key in list(self.seen_ids.keys())[:to_remove]:
            del self.seen_ids[key]
      except Exception as e:
        logger.error("Failed to emit notification event: %s", e)
