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

import subprocess

from jupyterlab_gcloud.tokenrenewer import CommandTokenRenewer


def get_gcloud_config(field):
  """Helper method that invokes the gcloud config helper."""
  p = subprocess.run(
    f'gcloud config config-helper --format="value({field})"',
    stdin=subprocess.DEVNULL, capture_output=True, check=True, encoding='UTF-8', shell=True)
  return p.stdout.strip()


def gcp_project():
  """Helper method to get the project configured through gcloud"""
  return get_gcloud_config('configuration.properties.core.project')


def gcp_project_number():
  """Helper method to get the project number for the project configured through gcloud"""
  project = gcp_project()
  p = subprocess.run(
      f'gcloud projects describe {project} --format="value(projectNumber)"',
    stdin=subprocess.DEVNULL, capture_output=True, check=True, encoding='UTF-8', shell=True)
  return p.stdout.strip()
  

def gcp_region():
  """Helper method to get the project configured through gcloud"""
  region = get_gcloud_config('configuration.properties.dataproc.region')
  if not region:
    region = get_gcloud_config('configuration.properties.compute.region')
  return region


def gcp_kernel_gateway_url():
  """Helper method to return the kernel gateway URL for the configured project and region."""
  project = gcp_project_number()
  region = gcp_region()
  return f'https://{project}-dot-{region}.kernels.googleusercontent.com'


def configure_gateway_client(c):
  """Helper method for configuring the given Config object to use the GCP kernel gateway."""
  c.GatewayClient.url = gcp_kernel_gateway_url()
  c.GatewayClient.gateway_token_renewer_class = CommandTokenRenewer
  c.CommandTokenRenewer.token_command = (
    'gcloud config config-helper --format="value(credential.access_token)"')
  c.GatewayClient.auth_scheme = 'Bearer'
  c.GatewayClient.headers = '{"Cookie": "_xsrf=XSRF", "X-XSRFToken": "XSRF"}'
