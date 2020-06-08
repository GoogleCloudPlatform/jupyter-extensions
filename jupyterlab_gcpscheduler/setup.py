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

from setuptools import find_packages, setup

with open("README.md") as f:
  long_description = f.read()

version = None
with open(os.path.join(os.getcwd(), "jupyterlab_gcpscheduler",
                       "version.py")) as f:
  for l in f:
    if l.startswith("VERSION"):
      version = l.rstrip().split(" = ")[1].replace("'", "")

if not version:
  raise RuntimeError("Unable to determine version")

npm_package = "jupyterlab_gcpscheduler-{}.tgz".format(version)
if not os.path.exists(os.path.join(os.getcwd(), npm_package)):
  raise FileNotFoundError("Cannot find NPM package. Did you run `npm pack`?")

data_files = [
    ("share/jupyter/lab/extensions", (npm_package,)),
    ("etc/jupyter/jupyter_notebook_config.d",
     ("jupyter-config/jupyter_notebook_config.d/jupyterlab_gcpscheduler.json",
     )),
]

setup(
    name="jupyterlab_gcpscheduler",
    version=version,
    description="GCP Notebooks Scheduler Extension",
    long_description=long_description,
    long_description_content_type="text/markdown",
    url="https://github.com/GoogleCloudPlatform/jupyter-extensions",
    data_files=data_files,
    license="Apache License 2.0",
    packages=find_packages(),
    python_requires=">=3.6",
    install_requires=[
        "google-auth>=1.6.3",
        "jupyterlab~=1.2.0",
        "requests>=2.22.0",
    ],
)
