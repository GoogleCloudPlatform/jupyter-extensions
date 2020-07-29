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
    ex_path = recv['ex_path'] if recv['ex_path'] else None
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
  * returns executable path for sync
  """

  def inside_git_repo(self, path):
    return_code = subprocess.call(['git', 'rev-parse'], cwd=path)
    return return_code == 0

  def add_sync_command(self):
    cwd = os.getcwd()
    ex_path = 'jupyterlab_gitsync/jupyterlab_gitsync/git-sync-changes'
    return os.path.join(cwd, ex_path)

  @gen.coroutine
  def post(self, *args, **kwargs):
    recv = self.get_json_body()
    path = recv['path'] if recv['path'] else '.'

    try:
      self.inside_git_repo(path)
      msg = self.add_sync_command()
      self.finish({'message': msg})
    except Exception as e:
      self.finish({'error': str(e)})





