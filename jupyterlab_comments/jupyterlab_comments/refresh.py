# Copyright 2020 Google LLC
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

from traitlets.config.configurable import Configurable
from traitlets import Int


class Refresh(Configurable):

  #Time interval for checking for new comments and refreshing the frontend
  interval = Int(10, config=True)

  def __init__(self, **kwargs):
    super(Refresh, self).__init__(**kwargs)

  def get_interval(self):
    return self.interval
