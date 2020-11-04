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

# This script is meant to be run from the repository root
set -e

SCRIPTS_DIR=$(realpath $(dirname $0))
RUN_PYTHON_TESTS=$SCRIPTS_DIR/run_python_tests.sh

. $SCRIPTS_DIR/common.sh
echo ${LAB_EXTENSION_PACKAGES[@]}

echo "============= Linking gcp_jupyterlab_shared ============="
pushd shared
npm run link
popd
echo "============= Finished linking gcp_jupyterlab_shared ============="
echo

for p in ${LAB_EXTENSION_PACKAGES[@]} ; do
  echo "============= Installing $p ============="
  pushd $p
  jupyter labextension install . --no-build
  popd
  echo "============= Finished installing $p ============="
  echo
done

echo "============= Building JupyterLab ============="
jupyter lab build --dev-build=False --minimize=True
jupyter labextension list
echo "============= Finished building JupyterLab ============="
