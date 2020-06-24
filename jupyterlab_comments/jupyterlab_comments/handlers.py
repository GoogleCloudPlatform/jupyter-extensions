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

from notebook.base.handlers import APIHandler
from jupyterlab_comments.git_commands import Git
import traitlets.config
import json
from pathlib import Path

home = str(Path.home())
git = Git(config=traitlets.config.get_config())  #global instance of connection to git commands


class PreviousNamesHandler(APIHandler):

  def get(self):
    file_path = self.get_argument('file_path')
    self.finish('Load previous names for a file (unimplemented)')


class ReviewCommentsHandler(APIHandler):

  def get(self):
    file_path = self.get_argument('file_path')
    self.finish('List review comments for a file (unimplemented)')


class DetachedCommentsHandler(APIHandler):

  def get(self):
    file_path = self.get_argument('file_path')
    current_path = self.get_argument('current_path')

    if current_path.startswith("~"):
        """
        Replace the '~' with the full path to the user's home directory.
        The modified path is needed as input to a subprocess call (setting
        the current working directory)
        TODO (mkalil): deal with how other OS represent home directory
        """
        current_path = "".join([home, current_path[1:]])
    comments = git.get_comments_for_path(file_path, current_path)
    self.finish(json.dumps(comments))


class AddCommentHandler(APIHandler):

  def post(self):
    file_path = self.get_argument('file_path')
    comment = self.get_argument('comment')
    self.finish('Add a detached comment for a specific file (unimplemented)')


class VerifyInsideRepoHandler(APIHandler):

  def get(self):
    current_path = self.get_argument('current_path')
    if git.inside_git_repo():
      self.finish("Current directory is a git repository.")
    else:
      self.finish("Current directory is NOT a git repository.")
