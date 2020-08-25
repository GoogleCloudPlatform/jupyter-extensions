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

# This script is meant to be run from the repository root and will not work
# properly if not.
set -e

SCRIPTS_DIR=$(realpath $(dirname $0))
RUN_PYTHON_TESTS=$SCRIPTS_DIR/run_python_tests.sh

. $SCRIPTS_DIR/common.sh
echo ${PYTHON_PACKAGES[@]}

echo "============= Running TypeScript tests ============="
#npm test
echo "============= Finished TypeScript tests ============="
echo

for p in ${PYTHON_PACKAGES[@]} ; do
  echo "============= Running Python tests in $p ============="
  pushd $p
  $RUN_PYTHON_TESTS coverage
  popd
  echo "============= Finished Python tests in $p ============="
  echo
done



