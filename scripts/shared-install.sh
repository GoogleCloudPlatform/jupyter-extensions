#!/bin/bash
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

# This file assumes that it will be run from within the shared folder
extension=$(grep 'name' package.json -m 1 | cut -d\" -f4)
echo "Installing ${extension} for local development..."

npm pack
pip install -e .
cp -v jupyter-config/jupyter_notebook_config.d/${extension}.json \
  `pipenv --venv`/etc/jupyter/jupyter_notebook_config.d/
