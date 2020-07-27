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


sys.path.append(os.getcwd())
home = os.path.expanduser("~")
FNULL = open(os.devnull, 'w')


def setup_repos():
    #Initialize remote repository with test file
    subprocess.call(['git', 'init'], cwd=remote_dir.name, stdout=FNULL, stderr=subprocess.STDOUT)
    with open(os.path.join(remote_dir.name, "test1.py"), 'a') as temp_file:
        temp_file.write("# Test file")
    with open(os.path.join(remote_dir.name, "test2.py"), 'a') as temp_file:
        temp_file.write("# Test file")
    with open(os.path.join(remote_dir.name, "test3.py"), 'a') as temp_file:
        temp_file.write("# Test file")
    with open(os.path.join(remote_dir.name, "test4.py"), 'a') as temp_file:
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

def add_detached_comment(text, file, cwd):
    subprocess.call(['git', 'appraise', 'comment', '-d', '-m', text, '-f', file], cwd=cwd)

def appraise_push(cwd):
    subprocess.call(['git', 'appraise', 'push'], cwd=cwd, stdout=FNULL, stderr=subprocess.STDOUT)

class TestLocalDetachedComments(tornado.testing.AsyncHTTPTestCase):

    def get_app(self):
        app = tornado.web.Application()
        host_pattern = '.*$'
        app.add_handlers(host_pattern, [('/detachedComments', handlers.DetachedCommentsHandler)])
        return app

    def test_single_local_comment(self):
        add_detached_comment("Adding a new local comment", 'test1.py', dir1_path)
        file_path = os.path.join(dir1_path, 'test1.py')
        response = self.fetch('/detachedComments?file_path=' + file_path + '&server_root=' + home, method="GET")
        self.assertIn('Adding a new local comment', str(response.body))

    def test_multiple_local_comments(self):
        add_detached_comment('Adding a first local comment', 'test2.py', dir1_path)
        add_detached_comment('Adding a second local comment', 'test2.py', dir1_path)
        add_detached_comment('Adding a third local comment', 'test2.py', dir1_path)

        file_path = os.path.join(dir1_path, 'test2.py')
        response = self.fetch('/detachedComments?file_path=' + file_path + '&server_root=' + home, method="GET")
        data = json.loads(response.body)
        self.assertEqual(3, len(data))

class TestRemoteDetachedComments(tornado.testing.AsyncHTTPTestCase):

    def get_app(self):
        app = tornado.web.Application()
        host_pattern = '.*$'
        app.add_handlers(host_pattern, [
            ('/detachedComments', handlers.DetachedCommentsHandler),
            ('/remotePull', handlers.PullFromRemoteRepoHandler),
            ('/addDetachedComment', handlers.AddDetachedCommentHandler)])
        return app

    def test_pull_from_remote(self):
        #Add comments in dir1, push to remote, pull in dir2
        add_detached_comment("First comment", "test3.py", dir1_path)
        add_detached_comment("Second comment", "test3.py", dir1_path)
        appraise_push(dir1_path)
        file_path = os.path.join(dir2_path, 'test3.py')
        self.fetch('/remotePull?file_path=' + file_path + '&server_root=' + home, method="POST", body=json.dumps({}))
        response = self.fetch('/detachedComments?file_path=' + file_path + '&server_root=' + home, method="GET")
        data = json.loads(response.body)
        self.assertEqual(2, len(data))

    def test_add_comment(self):
        response = self.fetch('/detachedComments?file_path=' + os.path.join(dir2_path, 'test4.py') + '&server_root=' + home, method="GET")
        data = json.loads(response.body)
        #No comments
        self.assertEqual(None, data)
        file_path_dir_1 = os.path.join(dir1_path, 'test4.py')
        self.fetch('/addDetachedComment?file_path=' + file_path_dir_1 + '&server_root=' + home, method="POST", body=json.dumps({"comment": "Test comment"}))
        response = self.fetch('/detachedComments?file_path=' + file_path_dir_1 + '&server_root=' + home, method="GET")
        #Comment stored locally in dir1
        self.assertIn("Test comment", str(response.body))
        self.fetch('/remotePull?file_path=' + os.path.join(dir2_path, 'test4.py') + '&server_root=' + home, method="POST", body=json.dumps({}))
        response = self.fetch('/detachedComments?file_path=' + os.path.join(dir2_path, 'test4.py') + '&server_root=' + home, method="GET")
        #Comments can be fetched remotely in dir2
        self.assertIn('Test comment', str(response.body))
        self.fetch('/addDetachedComment?file_path=' + file_path_dir_1 + '&server_root=' + home, method="POST", body=json.dumps({"comment": "Another test comment"}))
        self.fetch('/remotePull?file_path=' + os.path.join(dir2_path, 'test4.py') + '&server_root=' + home, method="POST", body=json.dumps({}))
        response = self.fetch('/detachedComments?file_path=' + os.path.join(dir2_path, 'test4.py') + '&server_root=' + home, method="GET")
        data = json.loads(response.body)
        self.assertIn('Test comment', str(response.body))
        self.assertIn('Another test comment', str(response.body))
        self.assertEqual(2, len(data))


if __name__ == '__main__':
    setup_repos()
    suite1 = unittest.TestLoader().loadTestsFromTestCase(TestLocalDetachedComments)
    suite2 = unittest.TestLoader().loadTestsFromTestCase(TestRemoteDetachedComments)
    unittest.TextTestRunner(verbosity=2).run(suite1)
    unittest.TextTestRunner(verbosity=2).run(suite2)
