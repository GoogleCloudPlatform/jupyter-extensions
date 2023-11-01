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
import setuptools

with open("README.md", "r") as fh:
  long_description = fh.read()

setuptools.setup(
  name="kernels-mixer",
  version="0.0.7",
  author="Google, Inc.",
  description="Jupyter server extension that allows mixing local and remote kernels together",
  long_description=long_description,
  long_description_content_type="text/markdown",
  url="https://github.com/GoogleCloudPlatform/jupyter-extensions/tree/master/kernels-mixer",
  license="Apache License 2.0",
  packages=setuptools.find_packages(),
  python_requires=">=3.8",
  install_requires=[
    "jupyter_server>=2.7.3",
    "traitlets",
    "google-cloud-jupyter-config",
  ],
)
