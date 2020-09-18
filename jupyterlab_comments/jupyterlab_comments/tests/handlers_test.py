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
import tempfile
from test_helpers import *
import subprocess
import unittest
import json
import tornado.testing
import time

home = os.path.expanduser("~")


class TestLocalDetachedComments(tornado.testing.AsyncHTTPTestCase):

  def get_app(self):
    return create_tornado_app()

  def test_single_local_comment(self):
    with tempfile.TemporaryDirectory() as working_dir:
      test_env = setup_repos(working_dir)
      add_detached_comment("Adding a new local comment", 'test1.py',
                           test_env.dir1)
      file_path = os.path.join(test_env.dir1, 'test1.py')
      response = self.fetch('/detachedComments?file_path=' + file_path +
                            '&server_root=' + home,
                            method="GET")
      self.assertIn('Adding a new local comment', str(response.body))

  def test_multiple_local_comments(self):
    with tempfile.TemporaryDirectory() as working_dir:
      test_env = setup_repos(working_dir)
      add_detached_comment('Adding a first local comment', 'test1.py',
                           test_env.dir1)
      add_detached_comment('Adding a second local comment', 'test1.py',
                           test_env.dir1)
      add_detached_comment('Adding a third local comment', 'test1.py',
                           test_env.dir1)

      file_path = os.path.join(test_env.dir1, 'test1.py')
      response = self.fetch('/detachedComments?file_path=' + file_path +
                            '&server_root=' + home,
                            method="GET")
      data = json.loads(response.body)
      self.assertEqual(3, len(data))


class TestRemoteDetachedComments(tornado.testing.AsyncHTTPTestCase):

  def get_app(self):
    return create_tornado_app()

  def test_pull_from_remote(self):
    #Add comments in dir1, push to remote, pull in dir2
    with tempfile.TemporaryDirectory() as working_dir:
      test_env = setup_repos(working_dir)
      add_detached_comment("First comment", "test1.py", test_env.dir1)
      add_detached_comment("Second comment", "test1.py", test_env.dir1)
      appraise_push(test_env.dir1)
      file_path = os.path.join(test_env.dir2, 'test1.py')
      self.fetch('/remotePull?file_path=' + file_path + '&server_root=' + home,
                 method="POST",
                 body=json.dumps({}))
      response = self.fetch('/detachedComments?file_path=' + file_path +
                            '&server_root=' + home,
                            method="GET")
      data = json.loads(response.body)
      self.assertEqual(2, len(data))

  def test_add_comment(self):
    with tempfile.TemporaryDirectory() as working_dir:
      test_env = setup_repos(working_dir)
      file_path_dir_1 = os.path.join(test_env.dir1, 'test1.py')
      file_path_dir_2 = os.path.join(test_env.dir2, 'test1.py')
      response = self.fetch('/detachedComments?file_path=' + file_path_dir_2 +
                            '&server_root=' + home,
                            method="GET")
      data = json.loads(response.body)
      #No comments
      self.assertEqual(None, data)
      self.fetch('/addDetachedComment?file_path=' + file_path_dir_1 +
                 '&server_root=' + home,
                 method="POST",
                 body=json.dumps({"comment": "Test comment"}))
      response = self.fetch('/detachedComments?file_path=' + file_path_dir_1 +
                            '&server_root=' + home,
                            method="GET")
      #Comment stored locally in dir1
      self.assertIn("Test comment", str(response.body))
      self.fetch('/remotePull?file_path=' + file_path_dir_2 + '&server_root=' +
                 home,
                 method="POST",
                 body=json.dumps({}))
      response = self.fetch('/detachedComments?file_path=' + file_path_dir_2 +
                            '&server_root=' + home,
                            method="GET")
      #Comments can be fetched remotely in dir2
      self.assertIn('Test comment', str(response.body))
      self.fetch('/addDetachedComment?file_path=' + file_path_dir_1 +
                 '&server_root=' + home,
                 method="POST",
                 body=json.dumps({"comment": "Another test comment"}))
      self.fetch('/remotePull?file_path=' + file_path_dir_2 + '&server_root=' +
                 home,
                 method="POST",
                 body=json.dumps({}))
      response = self.fetch('/detachedComments?file_path=' + file_path_dir_2 +
                            '&server_root=' + home,
                            method="GET")
      data = json.loads(response.body)
      self.assertIn('Test comment', str(response.body))
      self.assertIn('Another test comment', str(response.body))
      self.assertEqual(2, len(data))


class TestLocalReviewComments(tornado.testing.AsyncHTTPTestCase):

  def get_app(self):
    return create_tornado_app()

  def test_single_local_comment(self):
    with tempfile.TemporaryDirectory() as working_dir:
      test_env = setup_repos(working_dir)
      commit_hash = create_code_review(test_env.dir1, 'test1')
      add_review_comment("First comment", "test1.py", commit_hash,
                         test_env.dir1)
      file_path = os.path.join(test_env.dir1, 'test1.py')
      response = self.fetch('/reviewComments?file_path=' + file_path +
                            '&server_root=' + home,
                            method="GET")
      data = json.loads(response.body)
      comments = data[0].get("comments")
      self.assertEqual(1, len(comments))

  def test_multiple_local_comments(self):
    with tempfile.TemporaryDirectory() as working_dir:
      test_env = setup_repos(working_dir)
      commit_hash = create_code_review(test_env.dir1, 'test1')
      add_review_comment("First comment", "test1.py", commit_hash,
                         test_env.dir1)
      add_review_comment("Second comment", "test1.py", commit_hash,
                         test_env.dir1)
      file_path = os.path.join(test_env.dir1, 'test1.py')
      response = self.fetch('/reviewComments?file_path=' + file_path +
                            '&server_root=' + home,
                            method="GET")
      data = json.loads(response.body)
      comments = data[0].get("comments")
      self.assertEqual(2, len(comments))


class TestRemoteReviewComments(tornado.testing.AsyncHTTPTestCase):

  def get_app(self):
    return create_tornado_app()

  def test_single_remote_comment(self):
    with tempfile.TemporaryDirectory() as working_dir:
      test_env = setup_repos(working_dir)
      commit_hash = create_code_review(test_env.dir1, 'test')
      add_review_comment("First comment", "test1.py", commit_hash,
                         test_env.dir1)
      appraise_push(test_env.dir1)
      file_path_dir1 = os.path.join(test_env.dir1, 'test1.py')
      file_path_dir2 = os.path.join(test_env.dir2, 'test1.py')
      self.fetch('/remotePull?file_path=' + file_path_dir2 + '&server_root=' +
                 home,
                 method="POST",
                 body=json.dumps({}))
      response = self.fetch('/reviewComments?file_path=' + file_path_dir2 +
                            '&server_root=' + home,
                            method="GET")
      data = json.loads(response.body)
      comments = data[0].get("comments")
      self.assertEqual(1, len(comments))

  def test_multiple_remote_reviews(self):
    with tempfile.TemporaryDirectory() as working_dir:
      test_env = setup_repos(working_dir)
      commit_hash1 = create_code_review(test_env.dir1, 'test1')
      add_review_comment("First comment", "test1.py", commit_hash1,
                         test_env.dir1)
      appraise_push(test_env.dir1)
      time.sleep(1)
      commit_hash2 = create_code_review(test_env.dir2, 'test2')
      add_review_comment("Second comment", "test1.py", commit_hash2,
                         test_env.dir2)
      file_path_dir2 = os.path.join(test_env.dir2, 'test1.py')
      self.fetch('/remotePull?file_path=' + file_path_dir2 + '&server_root=' +
                 home,
                 method="POST",
                 body=json.dumps({}))
      response = self.fetch('/reviewComments?file_path=' + file_path_dir2 +
                            '&server_root=' + home,
                            method="GET")
      data = json.loads(response.body)
      self.assertEqual(2, len(data))
      comments = data[0].get("comments")
      self.assertEqual(1, len(comments))
      comments = data[1].get("comments")
      self.assertEqual(1, len(comments))
      self.assertTrue(commit_hash1 == data[1].get("revision") or
                      commit_hash1 == data[0].get("revision"))
      self.assertTrue(commit_hash2 == data[1].get("revision") or
                      commit_hash2 == data[0].get("revision"))
      self.assertFalse(commit_hash2 == commit_hash1)

  def test_add_review_comment(self):
    with tempfile.TemporaryDirectory() as working_dir:
      test_env = setup_repos(working_dir)
      file_path_dir1 = os.path.join(test_env.dir1, 'test1.py')
      file_path_dir2 = os.path.join(test_env.dir2, 'test1.py')
      commit_hash1 = create_code_review(test_env.dir1, 'test1')
      self.fetch('/addReviewComment?file_path=' + file_path_dir1 +
                 '&server_root=' + home,
                 method="POST",
                 body=json.dumps({
                     "reviewHash": commit_hash1,
                     "comment": "Adding a new comment",
                 }))
      self.fetch('/remotePull?file_path=' + file_path_dir2 + '&server_root=' +
                 home,
                 method="POST",
                 body=json.dumps({}))
      response = self.fetch('/reviewComments?file_path=' + file_path_dir2 +
                            '&server_root=' + home,
                            method="GET")
      data = json.loads(response.body)
      self.assertEqual(1, len(data))
      comments = data[0].get("comments")
      self.assertEqual(1, len(comments))
      self.assertEqual(commit_hash1, data[0].get("revision"))
      self.assertEqual("Adding a new comment",
                       comments[0].get("comment").get("description"))


class TestNotInGitRepo(tornado.testing.AsyncHTTPTestCase):

  def get_app(self):
    return create_tornado_app()

  def test_pull_file_not_in_git(self):
    with tempfile.TemporaryDirectory() as working_dir:
      test_env = setup_repos(working_dir)
      self.assertRaises(
          Exception,
          self.fetch('/remotePull?file_path=' +
                     os.path.join(test_env.not_git_dir, 'test1.py') +
                     '&server_root=' + home,
                     method="POST",
                     body=json.dumps({})))

  def test_fetch_detached_file_not_in_git(self):
    with tempfile.TemporaryDirectory() as working_dir:
      test_env = setup_repos(working_dir)
      self.assertRaises(
          Exception,
          self.fetch('/detachedComments?file_path=' +
                     os.path.join(test_env.not_git_dir, 'test1.py') +
                     '&server_root=' + home,
                     method="GET"))

  def test_fetch_review_file_not_in_git(self):
    with tempfile.TemporaryDirectory() as working_dir:
      test_env = setup_repos(working_dir)
      self.assertRaises(
          Exception,
          self.fetch('/reviewComments?file_path=' +
                     os.path.join(test_env.not_git_dir, 'test1.py') +
                     '&server_root=' + home,
                     method="GET"))


class TestDetachedReplyComments(tornado.testing.AsyncHTTPTestCase):

  def get_app(self):
    return create_tornado_app()

  def test_comment_has_children(self):
    #Add comment in dir1, add reply to that comment in dir2, check that comment has children after pulling remote changes in dir1
    with tempfile.TemporaryDirectory() as working_dir:
      test_env = setup_repos(working_dir)
      file_path_dir_1 = os.path.join(test_env.dir1, 'test1.py')
      file_path_dir_2 = os.path.join(test_env.dir2, 'test1.py')
      self.fetch('/addDetachedComment?file_path=' + file_path_dir_1 +
                 '&server_root=' + home,
                 method="POST",
                 body=json.dumps({"comment": "Test comment"}))
      self.fetch('/remotePull?file_path=' + file_path_dir_2 + '&server_root=' +
                 home,
                 method="POST",
                 body=json.dumps({}))
      response = self.fetch('/detachedComments?file_path=' + file_path_dir_2 +
                            '&server_root=' + home,
                            method="GET")
      data = json.loads(response.body)
      parent_hash = data[0].get("hash")
      self.fetch('/addDetachedComment?file_path=' + file_path_dir_2 +
                 '&server_root=' + home,
                 method="POST",
                 body=json.dumps({
                     "comment": "Reply comment",
                     "parent": str(parent_hash)
                 }))
      self.fetch('/remotePull?file_path=' + file_path_dir_1 + '&server_root=' +
                 home,
                 method="POST",
                 body=json.dumps({}))
      response = self.fetch('/detachedComments?file_path=' + file_path_dir_1 +
                            '&server_root=' + home,
                            method="GET")
      data = json.loads(response.body)
      children = data[0].get("children")
      self.assertEqual(1, len(data))
      self.assertEqual(1, len(children))
      self.assertIn('Reply comment', str(children))

  def test_multiple_children(self):
    #Add comment with 2 replies in dir1, pull and check in dir2
    with tempfile.TemporaryDirectory() as working_dir:
      test_env = setup_repos(working_dir)
      file_path_dir_1 = os.path.join(test_env.dir1, 'test1.py')
      file_path_dir_2 = os.path.join(test_env.dir2, 'test1.py')
      self.fetch('/addDetachedComment?file_path=' + file_path_dir_1 +
                 '&server_root=' + home,
                 method="POST",
                 body=json.dumps({"comment": "Test comment"}))
      response = self.fetch('/detachedComments?file_path=' + file_path_dir_1 +
                            '&server_root=' + home,
                            method="GET")
      data = json.loads(response.body)
      parent_hash = data[0].get("hash")
      self.fetch('/addDetachedComment?file_path=' + file_path_dir_1 +
                 '&server_root=' + home,
                 method="POST",
                 body=json.dumps({
                     "comment": "First reply comment",
                     "parent": str(parent_hash)
                 }))
      self.fetch('/addDetachedComment?file_path=' + file_path_dir_1 +
                 '&server_root=' + home,
                 method="POST",
                 body=json.dumps({
                     "comment": "Second reply comment",
                     "parent": str(parent_hash)
                 }))
      self.fetch('/remotePull?file_path=' + file_path_dir_2 + '&server_root=' +
                 home,
                 method="POST",
                 body=json.dumps({}))
      response = self.fetch('/detachedComments?file_path=' + file_path_dir_2 +
                            '&server_root=' + home,
                            method="GET")
      data = json.loads(response.body)
      children = data[0].get("children")
      self.assertEqual(1, len(data))
      self.assertEqual(2, len(children))
      self.assertIn('First reply comment', str(children))
      self.assertIn('Second reply comment', str(children))

  def test_nested_replies(self):
    with tempfile.TemporaryDirectory() as working_dir:
      test_env = setup_repos(working_dir)
      file_path_dir_1 = os.path.join(test_env.dir1, 'test1.py')
      file_path_dir_2 = os.path.join(test_env.dir2, 'test1.py')
      self.fetch('/addDetachedComment?file_path=' + file_path_dir_1 +
                 '&server_root=' + home,
                 method="POST",
                 body=json.dumps({"comment": "Test comment"}))
      response = self.fetch('/detachedComments?file_path=' + file_path_dir_1 +
                            '&server_root=' + home,
                            method="GET")
      data = json.loads(response.body)
      parent_hash = data[0].get("hash")
      #Add reply comment
      self.fetch('/addDetachedComment?file_path=' + file_path_dir_1 +
                 '&server_root=' + home,
                 method="POST",
                 body=json.dumps({
                     "comment": "Reply comment",
                     "parent": str(parent_hash)
                 }))
      response = self.fetch('/detachedComments?file_path=' + file_path_dir_1 +
                            '&server_root=' + home,
                            method="GET")
      data = json.loads(response.body)
      children = data[0].get("children")
      parent_hash = children[0].get("hash")
      #Add reply to reply comment
      self.fetch('/addDetachedComment?file_path=' + file_path_dir_1 +
                 '&server_root=' + home,
                 method="POST",
                 body=json.dumps({
                     "comment": "Reply to reply comment",
                     "parent": str(parent_hash)
                 }))
      self.fetch('/remotePull?file_path=' + file_path_dir_2 + '&server_root=' +
                 home,
                 method="POST",
                 body=json.dumps({}))
      response = self.fetch('/detachedComments?file_path=' + file_path_dir_2 +
                            '&server_root=' + home,
                            method="GET")
      data = json.loads(response.body)
      children = data[0].get("children")
      self.assertEqual(1, len(data))
      self.assertEqual(1, len(children))
      nested_children = children[0].get("children")
      self.assertEqual(1, len(nested_children))
      self.assertIn('Reply to reply comment', str(nested_children))


if __name__ == '__main__':
  test_classes = [
      TestLocalDetachedComments, TestRemoteDetachedComments, TestNotInGitRepo,
      TestDetachedReplyComments, TestLocalReviewComments,
      TestRemoteReviewComments
  ]
  test_loader = unittest.TestLoader()
  suites = []
  for test_class in test_classes:
    suite = test_loader.loadTestsFromTestCase(test_class)
    suites.append(suite)

  test_suite = unittest.TestSuite(suites)
  unittest.TextTestRunner(verbosity=2).run(test_suite)
