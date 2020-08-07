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
import json
import tornado.testing
import unittest

from tornado.web import Application
from tornado.httpclient import HTTPClientError
from unittest.mock import patch, MagicMock

from . import handlers, test_data

PATH = '/gcp/v1/details'


# Function that returns a future to be used with mocks that need to be awaited
def async_return(result, as_exception=False):
  f = asyncio.Future()
  if as_exception:
    f.set_exception(result)
  else:
    f.set_result(result)
  return f


@patch(__name__ + '.handlers.AsyncHTTPClient')
class GetMetadataTest(tornado.testing.AsyncTestCase):

  @tornado.testing.gen_test
  async def test_get_metadata(self, mock_http_client):
    mock_response = MagicMock()
    mock_response.body = test_data.METADATA_RESPONSE_BODY
    mock_fetch = MagicMock(return_value=async_return(mock_response))
    mock_http_client.return_value.fetch = mock_fetch

    metadata = await handlers.get_metadata()
    mock_fetch.assert_called_once()
    self.assertIn('instance', metadata)
    self.assertIn('machineType', metadata['instance'])
    self.assertIn('zone', metadata['instance'])

  @tornado.testing.gen_test
  async def test_get_metadata_throws_error(self, mock_http_client):
    error = HTTPClientError(500, 'Unable to get metadata')
    mock_fetch = MagicMock(return_value=async_return(error, True))
    mock_http_client.return_value.fetch = mock_fetch

    metadata = await handlers.get_metadata()
    mock_fetch.assert_called_once()
    self.assertEqual(metadata, {})

@patch('asyncio.create_subprocess_shell')
class GetGpuListTest(tornado.testing.AsyncTestCase):

  @tornado.testing.gen_test
  async def test_get_gpu_list(self, mock_create_subprocess):
    mock_process = MagicMock()
    mock_process.returncode = 0
    mock_process.communicate = MagicMock(
        return_value=async_return((test_data.ACCELERATOR_LIST_STDOUT, '')))
    mock_create_subprocess.return_value = async_return(mock_process)

    gpu_list = await handlers.get_gpu_list(
        test_data.ZONE)
    self.assertEqual([
        {
          "creationTimestamp": "1969-12-31T16:00:00.000-08:00",
          "description": "NVIDIA Tesla K80",
          "id": "10002",
          "kind": "compute#acceleratorType",
          "maximumCardsPerInstance": 8,
          "name": "nvidia-tesla-k80",
          "selfLink": "https://www.googleapis.com/compute/v1/projects/test-project/zones/us-west1-b/acceleratorTypes/nvidia-tesla-k80",
          "zone": "https://www.googleapis.com/compute/v1/projects/test-project/zones/us-west1-b"
        }
      ], gpu_list)
    self.assertEqual(
        handlers.ACCELERATOR_TYPES_CMD +
        ' --filter="zone:us-west1-b"',
        mock_create_subprocess.call_args[0][0])

  @tornado.testing.gen_test
  async def test_get_gpu_list_is_empty_on_err(
      self, mock_create_subprocess):
    mock_process = MagicMock()
    mock_process.returncode = -1
    mock_process.communicate = MagicMock(
        return_value=async_return(('', 'gcloud failed')))
    mock_create_subprocess.return_value = async_return(mock_process)

    gpu_list = await handlers.get_gpu_list(
        test_data.ZONE)
    self.assertEqual([], gpu_list)
    self.assertEqual(
        handlers.ACCELERATOR_TYPES_CMD +
        ' --filter="zone:us-west1-b"',
        mock_create_subprocess.call_args[0][0])


@patch('asyncio.create_subprocess_shell')
class GetMachineTypeDetailsTest(tornado.testing.AsyncTestCase):

  @tornado.testing.gen_test
  async def test_get_machine_type_details(self, mock_create_subprocess):
    mock_process = MagicMock()
    mock_process.returncode = 0
    mock_process.communicate = MagicMock(
        return_value=async_return((test_data.MACHINE_TYPE_STDOUT, '')))
    mock_create_subprocess.return_value = async_return(mock_process)

    machine_type_details = await handlers.get_machine_type_details(
        test_data.ZONE, test_data.MACHINE_TYPE)
    self.assertEqual(
        {
            'name': 'n1-standard-1',
            'description': '1 vCPU, 3.75 GB RAM'
        }, machine_type_details)
    self.assertEqual(
        handlers.MACHINE_TYPE_CMD +
        ' n1-standard-1 --zone projects/123456/zones/us-west1-b',
        mock_create_subprocess.call_args[0][0])

  @tornado.testing.gen_test
  async def test_get_machine_type_details_is_empty_on_err(
      self, mock_create_subprocess):
    mock_process = MagicMock()
    mock_process.returncode = -1
    mock_process.communicate = MagicMock(
        return_value=async_return(('', 'gcloud failed')))
    mock_create_subprocess.return_value = async_return(mock_process)

    machine_type_details = await handlers.get_machine_type_details(
        test_data.ZONE, test_data.MACHINE_TYPE)
    self.assertEqual({
        'name': 'n1-standard-1',
        'description': ''
    }, machine_type_details)
    self.assertEqual(
        handlers.MACHINE_TYPE_CMD +
        ' n1-standard-1 --zone projects/123456/zones/us-west1-b',
        mock_create_subprocess.call_args[0][0])


@patch('psutil.virtual_memory')
@patch('psutil.cpu_percent')
class GetResourceUtilizationTest(unittest.TestCase):

  def test_get_resource_utilization_calls_cpu_percent_twice_on_first(
      self, mock_cpu_percent, mock_virtual_memory):
    mock_cpu_percent.side_effect = [0, 15]
    mock_virtual_memory.return_value.percent = 10
    utilization = handlers.get_resource_utilization()
    self.assertEqual({'cpu': 15, 'memory': 10}, utilization)
    self.assertEqual(2, mock_cpu_percent.call_count)
    self.assertEqual(1, mock_virtual_memory.call_count)

  def test_get_resource_utilization(self, mock_cpu_percent,
                                    mock_virtual_memory):
    mock_cpu_percent.return_value = 99
    mock_virtual_memory.return_value.percent = 99
    utilization = handlers.get_resource_utilization()
    self.assertEqual({'cpu': 99, 'memory': 99}, utilization)
    self.assertEqual(1, mock_cpu_percent.call_count)
    self.assertEqual(1, mock_virtual_memory.call_count)


@patch('asyncio.create_subprocess_shell')
class GetGpuDetailsTest(tornado.testing.AsyncTestCase):

  @tornado.testing.gen_test
  async def test_gpu_details(self, mock_create_subprocess):
    mock_process = MagicMock()
    mock_process.returncode = 0
    mock_process.communicate = MagicMock(
        return_value=async_return((test_data.NVIDIA_SMI_STDOUT, '')))
    mock_create_subprocess.return_value = async_return(mock_process)

    gpu_details = await handlers.get_gpu_details()
    self.assertEqual(
        {
            'cuda_version': '10.1',
            'driver_version': '418.87.01',
            'gpu': 100,
            'count': 1,
            'memory': 6,
            'name': 'Tesla K80',
            'temperature': '42 C'
        }, gpu_details)

  @tornado.testing.gen_test
  async def test_gpu_details_is_empty_on_err(self, mock_create_subprocess):
    mock_process = MagicMock()
    mock_process.returncode = -1
    mock_process.communicate = MagicMock(
        return_value=async_return(('', 'nvidia-smi failed')))
    mock_create_subprocess.return_value = async_return(mock_process)

    gpu_details = await handlers.get_gpu_details()
    self.assertEqual(
        {
            'cuda_version': '',
            'driver_version': '',
            'gpu': 0,
            'count': 0,
            'memory': 0,
            'name': '',
            'temperature': ''
        }, gpu_details)


@patch(__name__ + '.handlers.get_resource_utilization')
@patch(__name__ + '.handlers.get_gpu_details')
@patch(__name__ + '.handlers.get_gpu_list')
@patch(__name__ + '.handlers.get_machine_type_details')
@patch(__name__ + '.handlers.get_metadata')
class VmDetailsHandlerTest(tornado.testing.AsyncHTTPTestCase):

  PATH = '/gcp/v1/details'

  def get_app(self):
    return Application([
        (PATH, handlers.VmDetailsHandler, dict(gce_details={})),
    ])

  def test_get(self, mock_get_metadata, mock_get_machine_type_details, mock_get_gpu_list,
               mock_get_gpu_details, mock_get_resource_utilization):
    mock_get_metadata.return_value = async_return(
        json.loads(test_data.METADATA_RESPONSE_BODY))
    mock_get_machine_type_details.return_value = async_return({
        'name': 'n1-standard-4',
        'description': '4 vCPU, 15 GB RAM'
    })
    mock_get_gpu_list.return_value = async_return(
      json.loads(test_data.ACCELERATOR_LIST_STDOUT))
    mock_get_gpu_details.return_value = async_return({
        'cuda_version': '10.1',
        'driver_version': '418.87.01',
        'gpu': 100,
        'count': 1,
        'memory': 6,
        'name': 'Tesla K80',
        'temperature': '42 C'
    })
    mock_get_resource_utilization.return_value = {'cpu': 50, 'memory': 16}
    response = self.fetch(PATH)
    self.assertEqual(200, response.code)
    self.assertEqual(test_data.DETAILS_RESPONSE_BODY, response.body)
    mock_get_metadata.assert_called_once()
    mock_get_machine_type_details.assert_called_once_with(
        'projects/123456/zones/us-west1-b',
        'projects/123456/machineTypes/n1-standard-1')
    mock_get_gpu_details.assert_called_once()
    mock_get_gpu_list.assert_called_once_with(
    'projects/123456/zones/us-west1-b')
    mock_get_resource_utilization.assert_called_once()

    # Second call should use cached metadata, gpu list and machine type details
    response = self.fetch(PATH)
    self.assertEqual(200, response.code)
    self.assertEqual(test_data.DETAILS_RESPONSE_BODY, response.body)
    mock_get_metadata.assert_called_once()
    mock_get_machine_type_details.assert_called_once_with(
        'projects/123456/zones/us-west1-b',
        'projects/123456/machineTypes/n1-standard-1')
    mock_get_gpu_list.assert_called_once_with(
      'projects/123456/zones/us-west1-b')
    self.assertEqual(2, mock_get_gpu_details.call_count)
    self.assertEqual(2, mock_get_resource_utilization.call_count)


if __name__ == '__main__':
  tornado.testing.main()
