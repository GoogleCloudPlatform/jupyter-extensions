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
import typing


from abc import abstractmethod
from traitlets import Int, Unicode
from jupyter_server.gateway.gateway_client import GatewayTokenRenewerBase


class CachedTokenRenewerBase(GatewayTokenRenewerBase):
    """Token renewer base class that only renews the token after a specified timeout."""

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

    _created = datetime.datetime.min

    def get_token(
        self,
        auth_header_key: str,
        auth_scheme: typing.Union[str, None],
        auth_token: str,
        **kwargs: typing.Any,
    ):
        current_time = datetime.datetime.now()
        duration = (current_time - self._created).total_seconds()
        if (not auth_token) or (duration > self.token_lifetime_seconds):
            auth_token = self.force_new_token(auth_header_key, auth_scheme, **kwargs)
            self._created = datetime.datetime.now()

        return auth_token


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
