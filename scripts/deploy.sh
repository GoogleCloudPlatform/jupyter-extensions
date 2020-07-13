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

# This is meant to be run from within an extension directory.
# Requires the name and zone of a CAIP Notebook instance to be passed

INSTANCE_NAME=$1
ZONE=$2

if [[ -z $INSTANCE_NAME || -z $ZONE ]] ; then
  echo "Instance name and zone must be provided"
  exit 1
fi

npm run build-python

ARCHIVE="$(basename $(ls dist/*tar.gz))"
echo "Copying and installing ${ARCHIVE} on instance ${INSTANCE_NAME}"

gcloud compute scp --zone ${ZONE} "dist/${ARCHIVE?}" "${INSTANCE_NAME?}:"
gcloud compute ssh --zone ${ZONE} "${INSTANCE_NAME?}" -- \
       "sudo su -p -l root -c \"/opt/conda/bin/pip install ${ARCHIVE}\" && \
        sudo su -p -l root -c '/opt/conda/bin/jupyter lab build' && \
        sudo service jupyter restart"
