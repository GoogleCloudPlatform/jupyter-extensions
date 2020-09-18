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

import os
import subprocess
import tornado.web
from jupyterlab_comments import handlers
FNULL = open(os.devnull, 'w')


#Container class for the temp directories used during testing
class TestEnv(object):

  def __init__(self, remote_dir, dir1, dir2, not_git_dir):
    self.remote_dir = remote_dir
    self.dir1 = dir1
    self.dir2 = dir2
    self.not_git_dir = not_git_dir


def create_files(num_files, dir_name):
  for i in range(1, num_files + 1):
    with open(os.path.join(dir_name, "test" + str(i) + ".py"),
              'a') as test_file:
      test_file.write("# Test file")


def setup_repos(working_dir):
  remote_dir = os.path.join(working_dir, "remote")
  os.makedirs(remote_dir)
  not_git_dir = os.path.join(working_dir, "not_git")
  os.makedirs(not_git_dir)
  dir1 = os.path.join(working_dir, "dir1")
  os.makedirs(dir1)
  dir2 = os.path.join(working_dir, "dir2")
  os.makedirs(dir2)
  #Initialize remote repositories with test files
  subprocess.call(['git', 'init'],
                  cwd=remote_dir,
                  stdout=FNULL,
                  stderr=subprocess.STDOUT)
  create_files(1, remote_dir)
  create_files(1, not_git_dir)
  subprocess.call(['git', 'add', '.'],
                  cwd=remote_dir,
                  stdout=FNULL,
                  stderr=subprocess.STDOUT)
  subprocess.call(
      ['git', 'commit', '-a', '-m', '"Initial commit with a test file"'],
      cwd=remote_dir,
      stdout=FNULL,
      stderr=subprocess.STDOUT)

  #Initialize first test directory
  subprocess.call(['git', 'init'],
                  cwd=dir1,
                  stdout=FNULL,
                  stderr=subprocess.STDOUT)
  subprocess.call(['git', 'remote', 'add', 'origin',
                   str(remote_dir)],
                  cwd=dir1,
                  stdout=FNULL,
                  stderr=subprocess.STDOUT)
  subprocess.call(['git', 'pull'],
                  cwd=dir1,
                  stdout=FNULL,
                  stderr=subprocess.STDOUT)
  subprocess.call(['git', 'checkout', 'master'],
                  cwd=dir1,
                  stdout=FNULL,
                  stderr=subprocess.STDOUT)

  #Initialize second test directory
  subprocess.call(['git', 'init'],
                  cwd=dir2,
                  stdout=FNULL,
                  stderr=subprocess.STDOUT)
  subprocess.call(['git', 'remote', 'add', 'origin',
                   str(remote_dir)],
                  cwd=dir2,
                  stdout=FNULL,
                  stderr=subprocess.STDOUT)
  subprocess.call(['git', 'pull'],
                  cwd=dir2,
                  stdout=FNULL,
                  stderr=subprocess.STDOUT)
  subprocess.call(['git', 'checkout', 'master'],
                  cwd=dir2,
                  stdout=FNULL,
                  stderr=subprocess.STDOUT)

  return TestEnv(remote_dir, dir1, dir2, not_git_dir)


def add_detached_comment(text, file, cwd):
  subprocess.call(['git', 'appraise', 'comment', '-d', '-m', text, '-f', file],
                  cwd=cwd,
                  stdout=FNULL,
                  stderr=subprocess.STDOUT)


def create_code_review(cwd, branch_name):
  #Creates a new code review and returns the commit hash associated with the review
  subprocess.call(['git', 'checkout', '-b', branch_name],
                  cwd=cwd,
                  stdout=FNULL,
                  stderr=subprocess.STDOUT)
  subprocess.call([
      'git', 'commit', '--allow-empty', '-m',
      '"empty commit to create a code review for testing"'
  ],
                  cwd=cwd,
                  stdout=FNULL,
                  stderr=subprocess.STDOUT)
  subprocess.call(['git', 'appraise', 'request'], cwd=cwd)
  commit_hash = subprocess.check_output(
      ['git', 'log', '-n1', '--format=format:%H'], cwd=cwd)
  commit_hash = commit_hash.decode('UTF-8')
  subprocess.call(['git', 'push', 'origin', branch_name],
                  cwd=cwd,
                  stdout=FNULL,
                  stderr=subprocess.STDOUT)
  return commit_hash


def add_review_comment(text, file, id_hash, cwd):
  subprocess.call(
      ['git', 'appraise', 'comment', '-f', file, '-m', text, id_hash],
      cwd=cwd,
      stdout=FNULL,
      stderr=subprocess.STDOUT)


def appraise_push(cwd):
  subprocess.call(['git', 'appraise', 'push', 'origin'],
                  cwd=cwd,
                  stdout=FNULL,
                  stderr=subprocess.STDOUT)


def create_tornado_app():
  app = tornado.web.Application()
  host_pattern = '.*$'
  app.add_handlers(host_pattern,
                   [('/detachedComments', handlers.DetachedCommentsHandler),
                    ('/remotePull', handlers.PullFromRemoteRepoHandler),
                    ('/addDetachedComment', handlers.AddDetachedCommentHandler),
                    ('/reviewComments', handlers.ReviewCommentsHandler),
                    ('/addReviewComment', handlers.AddReviewCommentHandler)])
  return app
