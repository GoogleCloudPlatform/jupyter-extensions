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

INSTANCE_NAME=$1

rm -rf dist
python setup.py sdist

ARCHIVE="$(ls dist)"

gcloud compute scp "dist/${ARCHIVE?}" "jupyter@${INSTANCE_NAME?}:/home/jupyter"
gcloud compute ssh "jupyter@${INSTANCE_NAME?}" -- \
       "sudo su -p -l root -c \"/opt/conda/bin/pip install ${ARCHIVE}\" && \
        sudo su -p -l root -c '/opt/conda/bin/jupyter lab build' && \
        sudo service jupyter restart"
