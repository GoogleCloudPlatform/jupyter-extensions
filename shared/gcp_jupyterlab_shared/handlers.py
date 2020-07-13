# Copyright 2020 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
"""Tornado request handler classes for extension."""
import json
import os
from base64 import b64decode

import google.auth
from google.auth.exceptions import GoogleAuthError
from google.auth.transport.requests import Request
from notebook.base.handlers import APIHandler, app_log
from tornado import web
from tornado.httpclient import AsyncHTTPClient, HTTPClientError, HTTPRequest

from . import VERSION

METADATA_SERVER = os.environ.get(
    'METADATA_SERVER',
    'http://metadata.google.internal') + '/computeMetadata/v1/?recursive=true'
METADATA_HEADER = {'Metadata-Flavor': 'Google'}
SCOPE = ('https://www.googleapis.com/auth/cloud-platform',)
FRAMEWORK_ENV_VAR = 'ENV_VERSION_FILE_PATH'


async def get_metadata():
  """Retrieves JSON-formatted metadata from the local metadata server."""
  request = HTTPRequest(METADATA_SERVER, headers=METADATA_HEADER)
  client = AsyncHTTPClient()
  metadata = {}
  try:
    app_log.debug('Retrieving GCE Metadata')
    response = await client.fetch(request)
    metadata = json.loads(response.body)
  except HTTPClientError as e:
    app_log.error('Unable to retrieve Metadata %s: %s', e.code, e.message)
  return metadata


class AuthProvider:
  """Provides default GCP authentication credential.

  Use this if you need to be able to manually access and refresh the machine's
  OAuth 2.0 access token.
  """

  _instance = None

  def __init__(self):
    self._auth, self._project = google.auth.default(scopes=SCOPE)

  @property
  def project(self):
    return self._project

  def refresh(self):
    if not self._auth.valid:
      app_log.info('Refreshing Google Cloud Credential')
      try:
        self._auth.refresh(Request())
      except GoogleAuthError:
        msg = 'Unable to refresh Google Cloud Credential'
        app_log.exception(msg)
        raise

  def get_header(self):
    return {'Authorization': 'Bearer {}'.format(self._auth.token)}

  @classmethod
  def get(cls):
    if not cls._instance:
      auth = AuthProvider()
      cls._instance = auth
    cls._instance.refresh()
    return cls._instance


class BaseHandler(APIHandler):
  """Base class for all API handlers requires a logged-in user."""

  def prepare(self):
    if not self.get_current_user():
      raise web.HTTPError(403)
    return super().prepare()


class MetadataHandler(BaseHandler):
  """Returns parts of the GCE Metadata."""

  async def get(self):
    try:
      metadata = await get_metadata()
      instance = metadata.get('instance', {})
      instance_custom_metadata = instance.get('attributes', {})
      response = {
          'project':
              metadata.get('project', {}).get('projectId'),
          'numericProjectId':
              metadata.get('project', {}).get('numericProjectId'),
          'framework':
              instance_custom_metadata.get('framework'),
          'id':
              instance.get('id'),
          'name':
              instance.get('name'),
          'frameworkTitle':
              instance_custom_metadata.get('title'),
          'dlvmImageVersion':
              instance_custom_metadata.get('version'),
          'machineType':
              instance.get('machineType'),
          'zone':
              instance.get('zone'),
      }
      self.finish(response)
    except:
      msg = 'Unexpected error obtaining instance metadata'
      app_log.exception(msg)
      self.set_status(500, msg)


class ProjectHandler(APIHandler):
  """Returns the Project ID from the default GCP credential."""

  def get(self):
    try:
      self.finish({'project': AuthProvider.get().project})
    except GoogleAuthError:
      msg = 'Unable to determine Google Cloud Project'
      app_log.exception(msg)
      self.set_status(403, msg)


class ProxyHandler(BaseHandler):
  """Attaches authentication credential and forwards GCP requests."""

  async def _make_request(self, base64_url, method='GET', body=None):
    try:
      url = b64decode(base64_url).decode()
      if not (url.startswith('https://') and 'googleapis.com' in url):
        raise ValueError('URL is not a valid Google API service')
    except ValueError as e:
      app_log.exception(e)
      self.set_status(400)
      self.finish(
          {'error': {
              'code': 400,
              'status': 'BAD_REQUEST',
              'message': str(e)
          }})
      return

    try:
      headers = AuthProvider.get().get_header()
    except:
      self.set_status(403)
      self.finish({
          'error': {
              'code': 403,
              'status': 'UNAUTHORIZED',
              'message': 'Unable to obtain authentication token'
          }
      })
      return

    headers['Content-Type'] = 'application/json'
    user_agent = 'jupyterlab_gcpextension/{}'.format(VERSION)
    request = HTTPRequest(url, method, headers, body, user_agent=user_agent)
    client = AsyncHTTPClient()
    try:
      app_log.info('Proxying GCP %s request to %s', method, url)
      response = await client.fetch(request)
      self.finish(response.body)
    except HTTPClientError as e:
      app_log.error('GCP %s request to %s returned %s: %s', method, url, e.code,
                    e.message)
      self.set_status(e.code)
      self.finish(e.response.body)

  async def get(self, base64_url):
    """Proxies the HTTP GET request."""
    await self._make_request(base64_url)

  async def delete(self, base64_url):
    """Proxies the HTTP DELETE request."""
    await self._make_request(base64_url, 'DELETE')

  async def post(self, base64_url):
    """Proxies the HTTP POST request."""
    await self._make_request(base64_url, 'POST', self.request.body)

  async def put(self, base64_url):
    """Proxies the HTTP PUT request."""
    await self._make_request(base64_url, 'PUT', self.request.body)


class RuntimeEnvHandler(APIHandler):
  """Handler to obtain runtime environment"""

  def get(self):
    version = 'unknown'
    try:
      env_version = os.environ[FRAMEWORK_ENV_VAR]
      with open(env_version) as f:
        version = f.read().rstrip()
    except KeyError:
      app_log.warning(
          'Environment variable {} is not set'.format(FRAMEWORK_ENV_VAR))
    except OSError:
      app_log.warning('Unable to read framework version from {}'.format(
          os.environ[FRAMEWORK_ENV_VAR]))
    self.finish(version)
