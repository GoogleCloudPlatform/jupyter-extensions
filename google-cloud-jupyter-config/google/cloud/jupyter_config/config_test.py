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

from google.cloud.jupyter_config.config import (
    gcp_account,
    gcp_credentials,
    gcp_project,
    gcp_region,
    clear_gcloud_cache,
)


class TestConfig(unittest.TestCase):
    _mock_cloudsdk_variables = {
        "CLOUDSDK_AUTH_ACCESS_TOKEN": "example-token",
        "CLOUDSDK_CORE_ACCOUNT": "example-account",
        "CLOUDSDK_CORE_PROJECT": "example-project",
        "CLOUDSDK_DATAPROC_REGION": "example-region",
    }

    def setUp(self):
        self.original_cloudsdk_variables = {}
        for key in os.environ:
            if key.startswith("CLOUDSDK_"):
                self.original_cloudsdk_variables[key] = os.environ[key]
        for key in self._mock_cloudsdk_variables:
            os.environ[key] = self._mock_cloudsdk_variables[key]
        clear_gcloud_cache()

    def tearDown(self):
        for key in self._mock_cloudsdk_variables:
            del os.environ[key]
        for key in self.original_cloudsdk_variables:
            os.environ[key] = self.original_cloudsdk_variables[key]
        clear_gcloud_cache()

    def test_gcp_account(self):
        self.assertEqual(gcp_account(), "example-account")
        os.environ["CLOUDSDK_CORE_ACCOUNT"] = "should-not-be-used"
        self.assertEqual(gcp_account(), "example-account")

    def test_gcp_credentials(self):
        self.assertEqual(gcp_credentials(), "example-token")
        os.environ["CLOUDSDK_AUTH_ACCESS_TOKEN"] = "should-not-be-used"
        self.assertEqual(gcp_credentials(), "example-token")

    def test_gcp_project(self):
        self.assertEqual(gcp_project(), "example-project")
        os.environ["CLOUDSDK_CORE_PROJECT"] = "should-not-be-used"
        self.assertEqual(gcp_project(), "example-project")

    def test_gcp_region(self):
        self.assertEqual(gcp_region(), "example-region")
        os.environ["CLOUDSDK_DATAPROC_REGION"] = "should-not-be-used"
        self.assertEqual(gcp_region(), "example-region")


if __name__ == "__main__":
    unittest.main()
