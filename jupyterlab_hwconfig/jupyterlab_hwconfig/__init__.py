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

from notebook.utils import url_path_join

from .handlers import VmDetailsHandler, PricelistHandler
from .version import VERSION

__version__ = VERSION


def _jupyter_server_extension_paths():
  return [{'module': 'jupyterlab_hwconfig'}]


def load_jupyter_server_extension(nb_server_app):
  """
    Called when the extension is loaded.

    Args:
        nb_server_app (NotebookWebApplication): handle to the Notebook webserver
          instance.
  """
  host_pattern = '.*$'
  app = nb_server_app.web_app
  gcp_v1_endpoint = url_path_join(app.settings['base_url'], 'gcp', 'v1')
  # Configure the details handle, pass an empty details dict for caching
  app.add_handlers(host_pattern, [
      (url_path_join(gcp_v1_endpoint,
                     'details'), VmDetailsHandler, dict(gce_details={})),
      (url_path_join(gcp_v1_endpoint, 'pricelist'), PricelistHandler),
  ])
