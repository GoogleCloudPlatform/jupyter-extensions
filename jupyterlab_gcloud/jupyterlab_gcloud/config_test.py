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

import os
import unittest

from jupyterlab_gcloud.config import gcp_project, gcp_region


class TestConfig(unittest.TestCase):
    def test_gcp_project(self):
        original_project_var = os.environ.get('CLOUDSDK_CORE_PROJECT', None)
        os.environ['CLOUDSDK_CORE_PROJECT'] = 'example-project'
        project = gcp_project()
        self.assertEqual(project, 'example-project')
        del os.environ['CLOUDSDK_CORE_PROJECT']
        if original_project_var:
            os.environ['CLOUDSDK_CORE_PROJECT'] = original_project_var

    def test_gcp_region(self):
        original_region_var = os.environ.get('CLOUDSDK_COMPUTE_REGION', None)
        os.environ['CLOUDSDK_COMPUTE_REGION'] = 'example-region'
        region = gcp_region()
        self.assertEqual(region, 'example-region')
        del os.environ['CLOUDSDK_COMPUTE_REGION']
        if original_region_var:
            os.environ['CLOUDSDK_COMPUTE_REGION'] = original_region_var


if __name__ == '__main__':
    unittest.main()
