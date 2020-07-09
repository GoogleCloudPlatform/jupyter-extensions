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

from notebook.utils import url_path_join
from jupyterlab_comments.handlers import DetachedCommentsHandler, ReviewCommentsHandler, RefreshIntervalHandler, PullFromRemoteRepoHandler


def load_jupyter_server_extension(nb_server_app):
  """
    Called when the extension is loaded.

    Args:
        nb_server_app (NotebookWebApplication): handle to the Notebook webserver instance.
    """
  print("The jupyterlab-comments server extension has been loaded")
  web_app = nb_server_app.web_app
  host_pattern = '.*$'
  base_url = web_app.settings['base_url']
  detached_comments_route_pattern = url_path_join(base_url, '/detachedComments')
  review_comments_route_pattern = url_path_join(base_url, '/reviewComments')
  refresh_interval_route_pattern = url_path_join(base_url, '/refreshInterval')
  remote_pull_route_pattern = url_path_join(base_url, '/remotePull')


  web_app.add_handlers(host_pattern, [
      (detached_comments_route_pattern, DetachedCommentsHandler),
      (review_comments_route_pattern, ReviewCommentsHandler),
      (refresh_interval_route_pattern, RefreshIntervalHandler),
      (remote_pull_route_pattern, PullFromRemoteRepoHandler),
  ])
