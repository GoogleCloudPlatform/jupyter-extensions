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
import subprocess
import sys
import tempfile
import threading
import typing


from abc import abstractmethod
from traitlets import Int, Unicode
from jupyter_server.gateway.gateway_client import GatewayTokenRenewerBase


class CachedTokenRenewerBase(GatewayTokenRenewerBase):
    """Token renewer base class that only renews the token after a specified timeout.

    After the initial (blocking) token fetch, subsequent renewals are performed
    proactively in a background thread so that get_token() returns immediately
    from cache and never blocks the Tornado event loop.
    """

    token_lifetime_seconds = Int(
        default_value=300,
        config=True,
        help="""Time (in seconds) to wait between successive token renewals.""",
    )

    @abstractmethod
    def force_new_token(
        self,
        auth_header_key: str,
        auth_scheme: typing.Union[str, None],
        **kwargs: typing.Any,
    ):
        pass

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self._created = datetime.datetime.min
        self._lock = threading.Lock()
        self._refresh_pending = False
        self._cached_token = None

    def get_token(
        self,
        auth_header_key: str,
        auth_scheme: typing.Union[str, None],
        auth_token: str,
        **kwargs: typing.Any,
    ):
        with self._lock:
            if self._cached_token:
                auth_token = self._cached_token

        current_time = datetime.datetime.now()
        duration = (current_time - self._created).total_seconds()
        if (not auth_token) or (duration > self.token_lifetime_seconds):
            if auth_token:
                # We have a stale but potentially still-valid token (gcloud
                # tokens are generated with --min-expiry=30m, so a 5-minute-old
                # token still has ~25 minutes of validity). Refresh in the
                # background and return the current token immediately to avoid
                # blocking the event loop.
                self._schedule_background_refresh(
                    auth_header_key, auth_scheme, **kwargs
                )
                return auth_token
            # No token at all yet; must block for the initial fetch.
            auth_token = self.force_new_token(
                auth_header_key, auth_scheme, **kwargs
            )
            with self._lock:
                self._created = datetime.datetime.now()
                self._cached_token = auth_token
        return auth_token

    def _schedule_background_refresh(
        self, auth_header_key, auth_scheme, **kwargs
    ):
        with self._lock:
            if self._refresh_pending:
                return
            self._refresh_pending = True

        def _do_refresh():
            try:
                token = self.force_new_token(
                    auth_header_key, auth_scheme, **kwargs
                )
                with self._lock:
                    self._cached_token = token
                    self._created = datetime.datetime.now()
                    self._refresh_pending = False
            except Exception:
                with self._lock:
                    self._refresh_pending = False

        thread = threading.Thread(target=_do_refresh, daemon=True)
        thread.start()


class CommandTokenRenewer(CachedTokenRenewerBase):
    """Token renewer that invokes an external command to generate the token."""

    token_command = Unicode(
        default_value="",
        config=True,
        help="""External command run to generate auth tokens.""",
    )

    def force_new_token(
        self,
        auth_header_key: str,
        auth_scheme: typing.Union[str, None],
        **kwargs: typing.Any,
    ):
        """Run the specified command to generate a new token, which is taken from its output.

        We reuse the system stderr for the command so that any prompts from it
        will be displayed to the user.
        """
        with tempfile.TemporaryFile() as t:
            p = subprocess.run(
                self.token_command,
                stdin=subprocess.DEVNULL,
                stderr=sys.stderr,
                stdout=t,
                check=True,
                shell=True,
                encoding="UTF-8",
            )
            t.seek(0)
            return t.read().decode("UTF-8").strip()
