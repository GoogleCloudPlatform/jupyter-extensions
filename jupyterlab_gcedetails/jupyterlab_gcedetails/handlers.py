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
"""GCE Details request handlers and helper functions."""
import asyncio
import json
import os
import time
import xml.etree.ElementTree as xml

import psutil

from notebook.base.handlers import APIHandler, app_log
from tornado.httpclient import AsyncHTTPClient, HTTPClientError, HTTPRequest

from .version import VERSION

METADATA_SERVER = os.environ.get(
    'METADATA_SERVER',
    'http://metadata.google.internal') + '/computeMetadata/v1/?recursive=true'
METADATA_HEADER = {'Metadata-Flavor': 'Google'}
MACHINE_TYPE_CMD = 'gcloud compute machine-types describe'
ACCELERATOR_TYPES_CMD = 'gcloud compute accelerator-types list --format="json"'
NVIDIA_CMD = 'nvidia-smi -q -x'

# Constants for field names
ACCELERATOR_TYPES = 'acceleratorTypes'
CPU = 'cpu'
CUDA_VERSION = 'cuda_version'
COUNT = 'count'
DESCRIPTION = 'description'
DRIVER_VERSION = 'driver_version'
GPU = 'gpu'
INSTANCE = 'instance'
MACHINE_TYPE = 'machineType'
MEMORY = 'memory'
NAME = 'name'
TEMPERATURE = 'temperature'
UTILIZATION = 'utilization'
ZONE = 'zone'


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


async def get_machine_type_details(zone, machine_type):
  """Uses gcloud to return the Machine Type details."""
  machine_type_name = machine_type[machine_type.rindex('/') + 1:]
  details = {NAME: machine_type_name, DESCRIPTION: ''}
  app_log.debug('Getting Machine Type details from gcloud')
  process = await asyncio.create_subprocess_shell(
      '{} {} --zone {}'.format(MACHINE_TYPE_CMD, machine_type_name, zone),
      stdout=asyncio.subprocess.PIPE,
      stderr=asyncio.subprocess.PIPE)
  stdout, _ = await process.communicate()

  if process.returncode != 0:
    app_log.error('Unable to obtain Machine Type details for %s', machine_type)
    return details

  for line in stdout.decode().splitlines():
    if line.startswith(DESCRIPTION):
      details[DESCRIPTION] = line.split(': ')[1].strip()
    elif line.startswith(NAME):
      details[NAME] = line.split(': ')[1].strip()
  return details


def get_resource_utilization():
  """Returns CPU and memory utilization."""
  cpu_percent = psutil.cpu_percent()
  if not cpu_percent:  # first call returns 0, wait 0.1s
    time.sleep(0.1)
    cpu_percent = psutil.cpu_percent()
  memory = psutil.virtual_memory()
  return {CPU: cpu_percent, MEMORY: memory.percent}


async def get_gpu_details():
  """Gets GPU details from nvidia-smi."""
  details = {
      NAME: '',
      DRIVER_VERSION: '',
      CUDA_VERSION: '',
      COUNT: 0,
      GPU: 0,
      MEMORY: 0,
      TEMPERATURE: '',
  }
  app_log.debug('Getting GPU information from nvidia-smi')
  process = await asyncio.create_subprocess_shell(
      NVIDIA_CMD,
      stdout=asyncio.subprocess.PIPE,
      stderr=asyncio.subprocess.PIPE)
  stdout, _ = await process.communicate()

  if process.returncode != 0:
    app_log.warning('Unable to determine GPU information')
    return details

  root = xml.fromstring(stdout)
  details[DRIVER_VERSION] = root.find(DRIVER_VERSION).text
  details[CUDA_VERSION] = root.find(CUDA_VERSION).text
  gpu = root.find(GPU)
  details[COUNT] = int(root.find('attached_gpus').text)
  details[NAME] = gpu.find('product_name').text
  utilization = gpu.find('utilization')
  details[GPU] = int(utilization.find('gpu_util').text[:-1].strip())
  details[MEMORY] = int(utilization.find('memory_util').text[:-1].strip())
  details[TEMPERATURE] = gpu.find(TEMPERATURE).find('gpu_temp').text

  return details

async def get_gpu_list(zone):
  """Uses gcloud to return a list of available Accelerator Types."""
  accelerator_types = []
  zone = zone[zone.rindex('/') + 1:]
  app_log.debug('Getting Accelerator Types from gcloud')
  process = await asyncio.create_subprocess_shell(
      '{} --filter="zone:{}"'.format(ACCELERATOR_TYPES_CMD, zone),
      stdout=asyncio.subprocess.PIPE,
      stderr=asyncio.subprocess.PIPE)
  stdout, _ = await process.communicate()

  if process.returncode != 0:
    app_log.error('Unable to obtain Accelerator Types from gcloud')
    return accelerator_types

  accelerator_types = json.loads(stdout.decode())
  return accelerator_types


class VmDetailsHandler(APIHandler):
  """Handler to obtain details from the metadata server and local system."""

  def initialize(self, gce_details):
    """Gets the gce_details object from the application."""
    self.details = gce_details

  async def get(self):
    """Retrieve VM details, caching static values."""
    if not len(self.details):
      # No keys populated yet, fetch and cache
      metadata = await get_metadata()
      instance = metadata.get(INSTANCE, {})
      machine_type = instance.get(MACHINE_TYPE, '')
      zone = instance.get(ZONE, '')
      instance[MACHINE_TYPE] = await get_machine_type_details(
          zone, machine_type)
      metadata[ACCELERATOR_TYPES] = await get_gpu_list(zone)
      self.details.update(metadata)

    self.details[UTILIZATION] = get_resource_utilization()
    self.details[GPU] = await get_gpu_details()
    self.finish(self.details)
