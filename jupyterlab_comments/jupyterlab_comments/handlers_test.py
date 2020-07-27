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

import sys
import os
sys.path.append(os.getcwd())

import tempfile
import handlers
import subprocess
import unittest
import json
import tornado.ioloop
import tornado.web
import tornado.testing

remote_dir = tempfile.TemporaryDirectory()
dir1 = tempfile.TemporaryDirectory()
dir2 = tempfile.TemporaryDirectory()
dir1_path = dir1.name
dir2_path = dir2.name

from os.path import expanduser
home = expanduser("~")

FNULL = open(os.devnull, 'w')


def setup_repos():
    #Initialize remote repository with test file
    subprocess.call(['git', 'init'], cwd=remote_dir.name, stdout=FNULL, stderr=subprocess.STDOUT)
    with open(os.path.join(remote_dir.name, "test.py"), 'a') as temp_file:
        temp_file.write("# Test file")
    subprocess.call(['git', 'add', '.'], cwd=remote_dir.name, stdout=FNULL)
    subprocess.call(['git', 'commit', '-a', '-m', '"Initial commit with a test file"'], cwd=remote_dir.name, stdout=FNULL, stderr=subprocess.STDOUT)

    #Initialize first test directory
    subprocess.call(['git', 'init'], cwd=dir1_path, stdout=FNULL, stderr=subprocess.STDOUT)
    subprocess.call(['git', 'remote', 'add', 'origin', str(remote_dir.name)], cwd=dir1_path, stdout=FNULL, stderr=subprocess.STDOUT)
    subprocess.call(['git', 'fetch', 'origin'], cwd=dir1_path, stdout=FNULL, stderr=subprocess.STDOUT)
    subprocess.call(['git', 'checkout', 'origin/master'], cwd=dir1_path, stdout=FNULL, stderr=subprocess.STDOUT)

    #Initialize second test directory
    subprocess.call(['git', 'init'], cwd=dir2_path, stdout=FNULL, stderr=subprocess.STDOUT)
    subprocess.call(['git', 'remote', 'add', 'origin', str(remote_dir.name)], cwd=dir2_path, stdout=FNULL, stderr=subprocess.STDOUT)
    subprocess.call(['git', 'fetch', 'origin'], cwd=dir2_path, stdout=FNULL, stderr=subprocess.STDOUT)
    subprocess.call(['git', 'checkout', 'origin/master'], cwd=dir2_path, stdout=FNULL, stderr=subprocess.STDOUT)


class TestDetachedComments(tornado.testing.AsyncHTTPTestCase):

    def get_app(self):
        app = tornado.web.Application()
        host_pattern = '.*$'
        app.add_handlers(host_pattern, [('/detachedComments', handlers.DetachedCommentsHandler)])
        return app

    def test_single_local_comment(self):
        subprocess.call(['git', 'appraise', 'comment', '-d', '-m', 'Adding a new comment', '-f', 'test.py'], cwd=dir1_path)
        file_path = os.path.join(dir1_path, 'test.py')
        response = self.fetch('/detachedComments?file_path=' + file_path + '&server_root=' + home, method="GET")
        data = json.loads(response.body)
        comment = data[0].get("comment")
        self.assertEqual(comment.get("description"), 'Adding a new comment')



if __name__ == '__main__':
    setup_repos()
    suite = unittest.TestLoader().loadTestsFromTestCase(TestDetachedComments)
    unittest.TextTestRunner(verbosity=2).run(suite)









