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
import tempfile
import handlers
import subprocess
import unittest
import json
import tornado.ioloop
import tornado.web
import tornado.testing

remote_dir = tempfile.TemporaryDirectory()
not_git_dir = tempfile.TemporaryDirectory()
dir1 = tempfile.TemporaryDirectory()
dir2 = tempfile.TemporaryDirectory()
dir1_path = dir1.name
dir2_path = dir2.name


home = os.path.expanduser("~")
FNULL = open(os.devnull, 'w')

def create_files(num_files, dir_name):
    for i in range(1, num_files + 1):
        with open(os.path.join(dir_name, "test" + str(i) + ".py"), 'a') as temp_file:
            temp_file.write("# Test file")

def create_tornado_app():
    app = tornado.web.Application()
    host_pattern = '.*$'
    app.add_handlers(host_pattern, [
        ('/detachedComments', handlers.DetachedCommentsHandler),
        ('/remotePull', handlers.PullFromRemoteRepoHandler),
        ('/addDetachedComment', handlers.AddDetachedCommentHandler),
        ('/reviewComments', handlers.ReviewCommentsHandler)])
    return app

def setup_repos():
    #Initialize remote repositories with test files
    subprocess.call(['git', 'init'], cwd=remote_dir.name, stdout=FNULL, stderr=subprocess.STDOUT)
    create_files(7, remote_dir.name)
    create_files(4, not_git_dir.name)
    subprocess.call(['git', 'add', '.'], cwd=remote_dir.name, stdout=FNULL, stderr=subprocess.STDOUT)
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
        return create_tornado_app()

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
        return create_tornado_app()

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

class TestNotInGitRepo(tornado.testing.AsyncHTTPTestCase):

    def get_app(self):
        return create_tornado_app()

    def test_pull_file_not_in_git(self):
        self.assertRaises(Exception, self.fetch('/remotePull?file_path=' + os.path.join(not_git_dir.name, 'test1.py') + '&server_root=' + home, method="POST", body=json.dumps({})))

    def test_fetch_detached_file_not_in_git(self):
        self.assertRaises(Exception, self.fetch('/detachedComments?file_path=' + os.path.join(not_git_dir.name, 'test2.py') + '&server_root=' + home, method="GET"))

    def test_fetch_review_file_not_in_git(self):
        self.assertRaises(Exception, self.fetch('/reviewComments?file_path=' + os.path.join(not_git_dir.name, 'test3.py') + '&server_root=' + home, method="GET"))


class TestReplyComments(tornado.testing.AsyncHTTPTestCase):

    def get_app(self):
        return create_tornado_app()

    def test_comment_has_children(self):
        #Add comment in dir1, add reply to that comment in dir2, check that comment has children after pulling remote changes in dir1
        file_path_dir_1 = os.path.join(dir1_path, 'test5.py')
        file_path_dir_2 = os.path.join(dir2_path, 'test5.py')
        self.fetch('/addDetachedComment?file_path=' + file_path_dir_1 + '&server_root=' + home, method="POST", body=json.dumps({"comment": "Test comment"}))
        self.fetch('/remotePull?file_path=' + file_path_dir_2 + '&server_root=' + home, method="POST", body=json.dumps({}))
        response = self.fetch('/detachedComments?file_path=' + file_path_dir_2 + '&server_root=' + home, method="GET")
        data = json.loads(response.body)
        parent_hash = data[0].get("hash")
        self.fetch('/addDetachedComment?file_path=' + file_path_dir_2 + '&server_root=' + home, method="POST", body=json.dumps({"comment": "Reply comment", "parent": str(parent_hash)}))
        self.fetch('/remotePull?file_path=' + file_path_dir_1 + '&server_root=' + home, method="POST", body=json.dumps({}))
        response = self.fetch('/detachedComments?file_path=' + file_path_dir_1 + '&server_root=' + home, method="GET")
        data = json.loads(response.body)
        children = data[0].get("children")
        self.assertEqual(1, len(data))
        self.assertEqual(1, len(children))
        self.assertIn('Reply comment', str(children))

    def test_multiple_children(self):
        #Add comment with 2 replies in dir1, pull and check in dir2
        file_path_dir_1 = os.path.join(dir1_path, 'test6.py')
        file_path_dir_2 = os.path.join(dir2_path, 'test6.py')
        self.fetch('/addDetachedComment?file_path=' + file_path_dir_1 + '&server_root=' + home, method="POST", body=json.dumps({"comment": "Test comment"}))
        response = self.fetch('/detachedComments?file_path=' + file_path_dir_1 + '&server_root=' + home, method="GET")
        data = json.loads(response.body)
        parent_hash = data[0].get("hash")
        self.fetch('/addDetachedComment?file_path=' + file_path_dir_1 + '&server_root=' + home, method="POST", body=json.dumps({"comment": "First reply comment", "parent": str(parent_hash)}))
        self.fetch('/addDetachedComment?file_path=' + file_path_dir_1 + '&server_root=' + home, method="POST", body=json.dumps({"comment": "Second reply comment", "parent": str(parent_hash)}))
        self.fetch('/remotePull?file_path=' + file_path_dir_2 + '&server_root=' + home, method="POST", body=json.dumps({}))
        response = self.fetch('/detachedComments?file_path=' + file_path_dir_2 + '&server_root=' + home, method="GET")
        data = json.loads(response.body)
        children = data[0].get("children")
        self.assertEqual(1, len(data))
        self.assertEqual(2, len(children))
        self.assertIn('First reply comment', str(children))
        self.assertIn('Second reply comment', str(children))

    def test_nested_replies(self):
        file_path_dir_1 = os.path.join(dir1_path, 'test7.py')
        file_path_dir_2 = os.path.join(dir2_path, 'test7.py')
        self.fetch('/addDetachedComment?file_path=' + file_path_dir_1 + '&server_root=' + home, method="POST", body=json.dumps({"comment": "Test comment"}))
        response = self.fetch('/detachedComments?file_path=' + file_path_dir_1 + '&server_root=' + home, method="GET")
        data = json.loads(response.body)
        parent_hash = data[0].get("hash")
        #Add reply comment
        self.fetch('/addDetachedComment?file_path=' + file_path_dir_1 + '&server_root=' + home, method="POST", body=json.dumps({"comment": "Reply comment", "parent": str(parent_hash)}))
        response = self.fetch('/detachedComments?file_path=' + file_path_dir_1 + '&server_root=' + home, method="GET")
        data = json.loads(response.body)
        children = data[0].get("children")
        parent_hash = children[0].get("hash")
        #Add reply to reply comment
        self.fetch('/addDetachedComment?file_path=' + file_path_dir_1 + '&server_root=' + home, method="POST", body=json.dumps({"comment": "Reply to reply comment", "parent": str(parent_hash)}))
        self.fetch('/remotePull?file_path=' + file_path_dir_2 + '&server_root=' + home, method="POST", body=json.dumps({}))
        response = self.fetch('/detachedComments?file_path=' + file_path_dir_2 + '&server_root=' + home, method="GET")
        data = json.loads(response.body)
        children = data[0].get("children")
        self.assertEqual(1, len(data))
        self.assertEqual(1, len(children))
        nested_children = children[0].get("children")
        self.assertEqual(1, len(nested_children))
        self.assertIn('Reply to reply comment', str(nested_children))



if __name__ == '__main__':
    setup_repos()

    test_classes = [TestLocalDetachedComments, TestRemoteDetachedComments, TestNotInGitRepo, TestReplyComments]
    test_loader = unittest.TestLoader()
    suites = []
    for test_class in test_classes:
        suite = test_loader.loadTestsFromTestCase(test_class)
        suites.append(suite)

    test_suite = unittest.TestSuite(suites)
    unittest.TextTestRunner(verbosity=2).run(test_suite)
