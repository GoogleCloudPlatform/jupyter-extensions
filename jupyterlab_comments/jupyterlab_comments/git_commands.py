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

import subprocess
import json
from traitlets.config.configurable import Configurable
from traitlets import Int, Float, Unicode, Bool


class Git(Configurable):
    """
    Remote repository should be configured by the
    user in their Jupyter config file. Default remote is 'origin'
    """
    remote = Unicode(u'origin', config=True)

    def __init__(self, **kwargs):
        super(Git, self).__init__(**kwargs)

    def run(self, current_path, *args):
        try:
          return subprocess.check_output(['git'] + list(args), cwd=current_path)
        except subprocess.CalledProcessError as e:
          print("Error invoking git command")
          print(e.output)

    def status(self, current_path):
        status = self.run(current_path, 'status').decode('utf-8')
        return status

    def appraise_pull(self, current_path):
        self.run(current_path, 'appraise', 'pull', self.remote)

    def inside_git_repo(self, current_path):
        """
        Return true if the current directory is a git repository.
        """
        try:
          return_code = subprocess.check_call(['git', 'rev-parse'],
                                              cwd=current_path)
          print(return_code)
          return return_code == 0
        except Exception as e:
          print("Error invoking git command")
          print(e.output)


    def get_comments_for_path(self, file_path, current_path):
        """
        Returns a JSON list of commments for the given file_path.

        Keys of objects returned: timestamp, author, location, description
        """

        if self.inside_git_repo(current_path):
          #self.appraise_pull(current_path) #pull new comments from remote repo
          comments_string = self.run(current_path, 'appraise', 'show', '-d',
                                     '-json', file_path)
          comments_json = json.loads(comments_string)
          comments_list = []
          if comments_json is not None:
            for comment_obj in comments_json:
              comments_list.append(comment_obj['comment'])
          return comments_list
        else:
          #TODO (mkalil): notify user that they are not connected to a Git repo
          pass

    def get_code_review_comments(self, file_path, current_path):
        pass

    def add_comment(self, file_path, current_path):
        pass

    def get_previous_names(self, file_path, current_path):
        # names_string = run('log', '--follow', '--name-only', '--pretty=format:""', file_path)
        pass
