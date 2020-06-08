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

import os

from setuptools import setup

data_files = [
    ("share/jupyter/lab/extensions", ("jupyterlab_gcpscheduler-1.0.0.tgz",)),
    ("etc/jupyter/jupyter_notebook_config.d",
     ("jupyter-config/jupyter_notebook_config.d/jupyterlab_gcpscheduler.json",
     )),
]

with open("README.md", "r") as fh:
  long_description = fh.read()

if not os.path.exists(
    os.path.join(os.getcwd(), "jupyterlab_gcpscheduler-1.0.0.tgz")):
  raise FileNotFoundError("Cannot find NPM package. Did you run `npm pack`?")

setup(
    name="jupyterlab_gcpscheduler",
    version="1.0.0",
    description="GCP Notebooks Scheduler Extension",
    long_description=long_description,
    long_description_content_type="text/markdown",
    url="https://github.com/GoogleCloudPlatform/jupyter-extensions",
    data_files=data_files,
    license="Apache License 2.0",
    python_requires=">=3.6",
    install_requires=[
        "google-auth>=1.6.3",
        "jupyterlab~=1.2.0",
        "requests>=2.22.0",
    ],
)
