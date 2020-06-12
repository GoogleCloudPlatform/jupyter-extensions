#!/bin/sh
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

# This script is meant to be run from the repository root and will not work
# properly if not.

npm test

RUN_PYTHON_TESTS=$(pwd)/scripts/run_python_tests.sh
PYTHON_PACKAGES=(
  jupyter-gcs-contents-manager
  jupyterlab_gcedetails
  jupyterlab_gcpscheduler
  jupyterlab_gcsfilebrowser
  shared/server
)

for p in ${PYTHON_PACKAGES[@]} ; do
  echo "============= Running tests in $p ============="
  pushd $p
  $RUN_PYTHON_TESTS coverage
  popd
  echo "============= Finished tests in $p ============="
  echo
done



