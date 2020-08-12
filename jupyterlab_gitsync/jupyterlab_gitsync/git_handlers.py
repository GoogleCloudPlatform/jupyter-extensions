import base64
import json
import re
import tornado.gen as gen
import os
import subprocess

from collections import namedtuple
from notebook.base.handlers import APIHandler, app_log

from jupyterlab_gitsync.version import VERSION 

class SyncHandler(APIHandler):

  """
  Implements all synchronization operations
  * uses git-sync-changes bash script
  """

  @gen.coroutine
  def post(self, *args, **kwargs):
    recv = self.get_json_body()
    path = recv['path'] if recv['path'] else '.'
    ex_path = recv['ex_path'] if recv['ex_path'] else ['git', 'sync-changes']
    options = recv['options'] if recv['options'] else []

    try:
      return_code = subprocess.call([ex_path]+options, cwd=path)
      if return_code == 0:
        self.finish({'success': True})
      else:
        self.finish({'conflict': True})
    except Exception as e:
      self.finish({'error': str(e)})


class SetupHandler(APIHandler):

  """
  Sets up environment for extension to run
  * verify that working path is a git repo
  * sets up `.sync_cache` folder if none exists
  * returns executable path for sync
  """

  def inside_git_repo(self, path):
    return_code = subprocess.call(['git', 'rev-parse'], cwd=path)
    return return_code == 0

  def add_cache_folder(self, path):
    file_exists = not subprocess.call(['ls', '.sync_cache'], cwd=path)
    if not file_exists:
      subprocess.call(['mkdir', '.sync_cache'], cwd=path)

  def get_sync_path(self):
    cwd = os.getcwd()
    ex_path = 'jupyterlab_gitsync/jupyterlab_gitsync/git-sync-changes/git-sync-changes'
    return os.path.join(cwd, ex_path)

  @gen.coroutine
  def post(self, *args, **kwargs):
    recv = self.get_json_body()
    path = recv['path'] if recv['path'] else '.'

    try:
      if self.inside_git_repo(path):
        self.add_cache_folder(path)
        ex_path = self.get_sync_path()
        self.finish({'ex_path': ex_path})
      else:
        self.finish({'error': 'Given path is not a git repository.'})
    except Exception as e:
      self.finish({'error': str(e)})





