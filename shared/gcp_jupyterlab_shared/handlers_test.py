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

import asyncio
import base64
import json
import unittest
from unittest.mock import patch, MagicMock

import tornado.testing
from google.auth.exceptions import RefreshError
from tornado.web import Application
from tornado.httpclient import HTTPClientError
from gcp_jupyterlab_shared import VERSION, handlers, test_data

PATH = '/gcp/v1'
TEST_PROJECT = 'test-project'


# Function that returns a future to be used with mocks that need to be awaited
def async_return(result, as_exception=False):
  f = asyncio.Future()
  if as_exception:
    f.set_exception(result)
  else:
    f.set_result(result)
  return f


@patch('google.auth')
class AuthProviderTest(unittest.TestCase):

  def setUp(self):
    handlers.AuthProvider._instance = None

  def test_is_singleton(self, mock_google_auth):
    mock_auth = MagicMock()
    mock_auth.valid = False
    mock_google_auth.default = MagicMock(return_value=(mock_auth, TEST_PROJECT))
    auth_provider = handlers.AuthProvider.get()
    self.assertEqual(auth_provider, handlers.AuthProvider.get())
    self.assertEqual(mock_auth.refresh.call_count, 2)

  def test_refresh_reraises_on_error(self, mock_google_auth):
    mock_auth = MagicMock()
    mock_auth.valid = False
    mock_auth.refresh.side_effect = RefreshError('Unable to refresh token')
    mock_google_auth.default = MagicMock(return_value=(mock_auth, TEST_PROJECT))
    with self.assertRaises(RefreshError):
      handlers.AuthProvider.get()

  def test_get_project(self, mock_google_auth):
    mock_auth = MagicMock()
    mock_auth.valid = True
    mock_google_auth.default = MagicMock(return_value=(mock_auth, TEST_PROJECT))
    auth_provider = handlers.AuthProvider.get()
    self.assertEqual(TEST_PROJECT, auth_provider.project)

  def test_get_header(self, mock_google_auth):
    mock_auth = MagicMock()
    mock_auth.valid = True
    mock_auth.token = 'abc123XYZ'
    mock_google_auth.default = MagicMock(return_value=(mock_auth, TEST_PROJECT))
    self.assertEqual({'Authorization': 'Bearer abc123XYZ'},
                     handlers.AuthProvider.get().get_header())


@patch(__name__ + '.handlers.AsyncHTTPClient')
class GetMetadataTest(tornado.testing.AsyncHTTPTestCase):

  PATH = '/gcp/v1/metadata'

  def get_app(self):
    return Application([
        (PATH, handlers.MetadataHandler),
    ])

  def test_get(self, mock_http_client):
    mock_response = MagicMock()
    mock_response.body = test_data.METADATA_RESPONSE_BODY
    mock_fetch = MagicMock(return_value=async_return(mock_response))
    mock_http_client.return_value.fetch = mock_fetch

    response = self.fetch(PATH)
    self.assertEqual(test_data.METADATA_HANDLER_RESPONSE, response.body)

  def test_get_with_metadata_http_error(self, mock_http_client):
    error = HTTPClientError(500, 'Unable to get metadata')
    mock_fetch = MagicMock(return_value=async_return(error, True))
    mock_http_client.return_value.fetch = mock_fetch

    response = self.fetch(PATH)
    self.assertEqual(test_data.EMPTY_METADATA_HANDLER_RESPONSE, response.body)

  def test_get_with_metadata_error(self, mock_http_client):
    mock_fetch = MagicMock(
        return_value=async_return(RuntimeError('Unhandled'), True))
    mock_http_client.return_value.fetch = mock_fetch

    response = self.fetch(PATH)
    self.assertEqual(500, response.code)
    self.assertEqual('Unexpected error obtaining instance metadata',
                     response.reason)


@patch(__name__ + '.handlers.AsyncHTTPClient')
@patch(__name__ + '.handlers.AuthProvider')
class ProxyHandlerTest(tornado.testing.AsyncHTTPTestCase):

  URL = PATH + '/proxy'
  AUTH_HEADER = {'Authorization': 'Bearer abc123XYZ'}
  GCP_URL = 'https://servicemanagement.googleapis.com/v1'
  RESPONSE_BODY = b'{"success": true}'

  def _configure_mock_auth_provider(self, mock_auth_provider):
    mock_provider = MagicMock()
    mock_provider.get_header.return_value = dict(self.AUTH_HEADER)
    mock_auth_provider.get.return_value = mock_provider

  def _configure_mock_client(self, mock_client):
    mock_response = MagicMock()
    mock_response.body = self.RESPONSE_BODY
    mock_fetch = MagicMock(return_value=async_return(mock_response))
    mock_client.return_value.fetch = mock_fetch
    return mock_fetch

  def _make_url(self, path):
    gcp_path = base64.b64encode((self.GCP_URL + path).encode()).decode()
    return '{}/{}'.format(self.URL, gcp_path)

  def get_app(self):
    return Application([
        (self.URL + '/(.+)', handlers.ProxyHandler),
    ])

  def test_get(self, mock_auth_provider, mock_client):
    gcp_path = '/services?consumerId=project:TEST'
    self._configure_mock_auth_provider(mock_auth_provider)
    mock_fetch = self._configure_mock_client(mock_client)
    response = self.fetch(self._make_url(gcp_path))
    request = mock_fetch.call_args[0][0]
    self.assertEqual(200, response.code)
    self.assertEqual(self.RESPONSE_BODY, response.body)
    self.assertEqual(
        '{}{}'.format(self.GCP_URL, '/services?consumerId=project:TEST'),
        request.url)
    self.assertEqual('GET', request.method)
    self.assertEqual(None, request.body)
    self.assertEqual('jupyterlab_gcpextension/{}'.format(VERSION),
                     request.user_agent)
    expected_headers = dict(self.AUTH_HEADER)
    expected_headers['Content-Type'] = 'application/json'
    self.assertDictEqual(expected_headers, request.headers)

  def test_post(self, mock_auth_provider, mock_client):
    gcp_path = '/services/ml.googleapis.com:enable'
    body = json.dumps({'consumerId': 'project:TEST'})
    self._configure_mock_auth_provider(mock_auth_provider)
    mock_fetch = self._configure_mock_client(mock_client)
    response = self.fetch(self._make_url(gcp_path), method='POST', body=body)
    request = mock_fetch.call_args[0][0]
    self.assertEqual(200, response.code)
    self.assertEqual(self.RESPONSE_BODY, response.body)
    self.assertEqual('{}{}'.format(self.GCP_URL, gcp_path), request.url)
    self.assertEqual('POST', request.method)
    self.assertEqual(body.encode(), request.body)

  def test_put(self, mock_auth_provider, mock_client):
    gcp_path = '/services/ml.googleapis.com:reenable'
    body = json.dumps({'consumerId': 'project:TEST'})
    self._configure_mock_auth_provider(mock_auth_provider)
    mock_fetch = self._configure_mock_client(mock_client)
    response = self.fetch(self._make_url(gcp_path), method='PUT', body=body)
    request = mock_fetch.call_args[0][0]
    self.assertEqual(200, response.code)
    self.assertEqual(self.RESPONSE_BODY, response.body)
    self.assertEqual('{}{}'.format(self.GCP_URL, gcp_path), request.url)
    self.assertEqual('PUT', request.method)
    self.assertEqual(body.encode(), request.body)

  def test_delete(self, mock_auth_provider, mock_client):
    gcp_path = '/services/ml.googleapis.com:deactivate?consumerId=project:TEST'
    self._configure_mock_auth_provider(mock_auth_provider)
    mock_fetch = self._configure_mock_client(mock_client)
    response = self.fetch(self._make_url(gcp_path), method='DELETE')
    request = mock_fetch.call_args[0][0]
    self.assertEqual(200, response.code)
    self.assertEqual(self.RESPONSE_BODY, response.body)
    self.assertEqual('{}{}'.format(self.GCP_URL, gcp_path), request.url)
    self.assertEqual('DELETE', request.method)
    self.assertEqual(None, request.body)

  def test_bad_proxy_url(self, mock_auth_provider, mock_client):
    encoded_path = base64.b64encode(b'http://badrequest.com').decode()
    self._configure_mock_auth_provider(mock_auth_provider)
    mock_fetch = self._configure_mock_client(mock_client)
    response = self.fetch(self.URL + '/' + encoded_path)

    expected_response = json.dumps({
        'error': {
            'code': 400,
            'status': 'BAD_REQUEST',
            'message': 'URL is not a valid Google API service'
        }
    })
    self.assertEqual(400, response.code)
    self.assertEqual(expected_response.encode(), response.body)
    mock_auth_provider.assert_not_called()
    mock_fetch.assert_not_called()

  def test_unable_to_get_token(self, mock_auth_provider, mock_client):
    gcp_path = '/services?consumerId=project:TEST'
    mock_auth_provider.get.side_effect = Exception('Cannot obtain auth')
    mock_fetch = self._configure_mock_client(mock_client)
    response = self.fetch(self._make_url(gcp_path))

    expected_response = json.dumps({
        'error': {
            'code': 403,
            'status': 'UNAUTHORIZED',
            'message': 'Unable to obtain authentication token'
        }
    })
    self.assertEqual(403, response.code)
    self.assertEqual(expected_response.encode(), response.body)
    mock_auth_provider.get.assert_called_once()
    mock_fetch.assert_not_called()

  def test_returns_gcp_error(self, mock_auth_provider, mock_client):
    gcp_path = '/services?consumerId=project:TEST'
    self._configure_mock_auth_provider(mock_auth_provider)
    mock_fetch = self._configure_mock_client(mock_client)
    error_response = MagicMock()
    error_response.body = {
        'error': {
            'code': 404,
            'status': 'NOT_FOUND',
            'message': 'Resource not found'
        }
    }
    mock_fetch.side_effect = HTTPClientError(404, 'Resource not found',
                                             error_response)
    response = self.fetch(self._make_url(gcp_path))
    request = mock_fetch.call_args[0][0]
    self.assertEqual(404, response.code)
    self.assertEqual(json.dumps(error_response.body).encode(), response.body)
    self.assertEqual(
        '{}{}'.format(self.GCP_URL, '/services?consumerId=project:TEST'),
        request.url)
    self.assertEqual('GET', request.method)


if __name__ == '__main__':
  tornado.testing.main()
