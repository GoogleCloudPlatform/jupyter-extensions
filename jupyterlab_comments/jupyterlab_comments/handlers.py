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
from jupyterlab_comments.refresh import Refresh
import traitlets.config
import json
import os
import traceback


# global instance of connection to git commands
git = Git(config=traitlets.config.get_config())
# fetch the configured refresh interval used for pulling new comments
refresh = Refresh(config=traitlets.config.get_config())


class PreviousNamesHandler(APIHandler):

    def get(self):
        file_path = self.get_argument('file_path')
        self.finish('Load previous names for a file (unimplemented)')


class DetachedCommentsHandler(APIHandler):

    def get(self):
        try:
            #file_path is relative to the Jupyter Lab server root
            file_path = self.get_argument('file_path')
            #Replace '~'  or '~user' with the user's home directory
            server_root = os.path.expanduser(self.get_argument('server_root'))
            full_file_path = os.path.join(server_root, file_path)
            full_file_path_dir = os.path.dirname(full_file_path)

            if git.inside_git_repo(full_file_path_dir):
                git_root_dir = git.get_repo_root(full_file_path_dir)
                file_path_from_repo_root = os.path.relpath(full_file_path, start=git_root_dir)
                comments = git.get_comments_for_path(file_path_from_repo_root, git_root_dir)
                self.finish(json.dumps(comments))
            else:
                print("Error: file is not inside a git repository")
                self.finish(json.dumps({"error_message": "Error: file is not inside a git repository"}))



        except Exception as e:
            print("Error fetching detached comments")
            print(traceback.format_exc())


class ReviewCommentsHandler(APIHandler):

    def get(self):
        try:
            file_path = self.get_argument('file_path')
            server_root = os.path.expanduser(self.get_argument('server_root'))
            full_file_path = os.path.join(server_root, file_path)
            full_file_path_dir = os.path.dirname(full_file_path)

            if git.inside_git_repo(full_file_path_dir):
                git_root_dir = git.get_repo_root(full_file_path_dir)
                file_path_from_repo_root = os.path.relpath(full_file_path, start=git_root_dir)
                comments = git.get_all_code_review_comments(file_path_from_repo_root, git_root_dir)
                if comments is None:
                    self.finish(json.dumps({}))
                else:
                    self.finish(json.dumps(comments))
            else:
                print("Error: file is not inside a git repository")
                self.finish(json.dumps({"error_message": "Error: file is not inside a git repository"}))
        except Exception as e:
            print("Error fetching code review comments")
            print(traceback.format_exc())


class AddDetachedCommentHandler(APIHandler):
    """
    Assumes that the file is inside a Git repo (comment editor only appears when the file is stored in Git)
    """

    def post(self):
        try:
            file_path = self.get_argument('file_path')
            server_root = os.path.expanduser(self.get_argument('server_root'))
            data = json.loads(self.request.body)
            comment = data.get('comment')
            parent = data.get('parent', "")

            full_file_path = os.path.join(server_root, file_path)
            full_file_path_dir = os.path.dirname(full_file_path)
            git_root_dir = git.get_repo_root(full_file_path_dir)
            file_path_from_repo_root = os.path.relpath(full_file_path, start=git_root_dir)

            if parent:
                git.add_detached_reply_comment(file_path_from_repo_root, git_root_dir, comment, parent)
            else:
                git.add_detached_comment(file_path_from_repo_root, git_root_dir, comment)

        except Exception as e:
            print("Error adding a new detached comment")
            print(traceback.format_exc())


class AddReviewCommentHandler(APIHandler):

    def post(self):
        try:
            file_path = self.get_argument('file_path')
            server_root = os.path.expanduser(self.get_argument('server_root'))
            data = json.loads(self.request.body)
            comment = data.get('comment')
            review_hash = data.get('reviewHash')
            parent = data.get('parent', "")

            full_file_path = os.path.join(server_root, file_path)
            full_file_path_dir = os.path.dirname(full_file_path)
            git_root_dir = git.get_repo_root(full_file_path_dir)
            file_path_from_repo_root = os.path.relpath(full_file_path, start=git_root_dir)

            if parent:
                git.add_review_reply_comment(file_path_from_repo_root, git_root_dir, comment, parent, review_hash)
            else:
                git.add_review_comment(file_path_from_repo_root, git_root_dir, comment, review_hash)

        except Exception as e:
            print("Error adding a new detached comment")
            print(traceback.format_exc())

class RefreshIntervalHandler(APIHandler):

    def get(self):
        try:
            interval = refresh.get_interval()
            self.finish(json.dumps({"interval" : interval}))
        except TypeError as e:
            print("Error fetching configured refresh interval traitlet, JSON not serializable")
            print(traceback.format_exc())

class PullFromRemoteRepoHandler(APIHandler):

    def post(self):
        try:
            file_path = self.get_argument('file_path')
            server_root = os.path.expanduser(self.get_argument('server_root'))
            full_file_path = os.path.join(server_root, file_path)
            full_file_path_dir = os.path.dirname(full_file_path)
            if git.inside_git_repo(full_file_path_dir):
                git_root_dir = git.get_repo_root(full_file_path_dir)
                git.appraise_pull(git_root_dir)
                self.finish()
            else:
                print("Error: file is not inside a git repository, cannot pull from remote")
                self.finish()
        except Exception as e:
            print("Error pulling new comments from remote repository")
            print(traceback.format_exc())



