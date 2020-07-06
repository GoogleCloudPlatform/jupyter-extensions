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

	def run(self, cwd, *args):
		try:
		  return subprocess.check_output(['git'] + list(args), cwd=cwd)
		except subprocess.CalledProcessError as e:
		  print("Error invoking git command")
		  print(e.output)

	def status(self, repo_path):
		status = self.run(repo_path, 'status').decode('utf-8')
		return status

	def appraise_pull(self, repo_path):
		self.run(repo_path, 'appraise', 'pull', self.remote)

	def inside_git_repo(self, path_to_file):
		"""
		Return true if the path is inside a git repository.
		"""
		try:
		  return_code = subprocess.call(['git', 'rev-parse'],
											  cwd=path_to_file)
		  return return_code == 0
		except Exception as e:
		  print("Unexpected error when checking 'git rev-parse' command return code")
		  print(e)

	def get_repo_root(self, full_file_path):
		git_repo_root = self.run(full_file_path, 'rev-parse', '--show-toplevel').decode('utf-8').rstrip("\n")
		return git_repo_root


	def get_comments_for_path(self, file_path_from_repo_root, git_root_dir):
		"""
		Returns a JSON list of commments for the given file.

		Assumes that git_root_dir is a valid path within a Git repo.
		Keys of objects returned: hash, comment, original, children
		"""
		#self.appraise_pull(current_path) #pull new comments from remote repo
		comments_string = self.run(git_root_dir, 'appraise', 'show', '-d',
									'-json', file_path_from_repo_root)
		comments_json = json.loads(comments_string)
		return comments_json

	def get_code_review_comments(self, file_path_from_repo_root, git_root_dir):
		"""
		Returns the JSON for the current code review with comments for the requested file path.

		Returns None of there are no review comments for the file path.
		"""
		#self.appraise_pull(current_path) #pull new comments from remote repo
		review_string = self.run(git_root_dir, 'appraise', 'show',
									'-json')
		review_json = json.loads(review_string)
		if "comments" in review_json.keys():
			comments_on_file = []
			for item in review_json["comments"]:
				location = item["comment"]["location"]
				if "path" in location.keys() and location["path"] == file_path_from_repo_root:
					comments_on_file.append(item)

			review_json["comments"] = comments_on_file
			return review_json
		else:
			return None

	def add_comment(self, file_path, server_root):
		pass

	def get_previous_names(self, file_path, server_root):
		# names_string = run('log', '--follow', '--name-only', '--pretty=format:""', file_path)
		pass
