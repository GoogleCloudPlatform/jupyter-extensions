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

import typing

import google.auth
import google.auth.transport.requests
from jupyter_server.gateway.gateway_client import GatewayTokenRenewerBase


class GoogleAuthTokenRenewer(GatewayTokenRenewerBase):
    """Token renewer that uses Application Default Credentials via the google-auth library.

    This replaces the previous approach of shelling out to `gcloud` to obtain
    access tokens. Credentials are obtained via google.auth.default(), which
    supports service accounts, user credentials (from `gcloud auth application-default login`),
    and metadata-server credentials on GCE/Cloud Run/etc.
    """

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self._credentials, _ = google.auth.default(
            scopes=["https://www.googleapis.com/auth/cloud-platform"]
        )
        self._request = google.auth.transport.requests.Request()

    def get_token(
        self,
        auth_header_key: str,
        auth_scheme: typing.Union[str, None],
        auth_token: str,
        **kwargs: typing.Any,
    ):
        if not self._credentials.valid:
            self._credentials.refresh(self._request)
        return self._credentials.token
