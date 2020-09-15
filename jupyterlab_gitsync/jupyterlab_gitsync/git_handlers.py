import json
import tornado.gen as gen
import os
import subprocess

from notebook.base.handlers import APIHandler

class BranchHandler(APIHandler):
  """ 
  Allows users to switch to an existing branch
  or create and switch to a new branch
  """
  def create_branch(self, path, branch):
    assert subprocess.call(['git', 'branch', branch], cwd=path) == 0, "Branch {} could not be created. Please check that the branch name does not exist.".format(branch)

  def change_branch(self, path, branch):
    assert subprocess.call(['git', 'checkout', branch], cwd=path) == 0, "Could not switch to branch {}. Please commit or stash your changes and try again. ".format(branch)

  @gen.coroutine
  def post(self, *args, **kwargs):
    recv = self.get_json_body()
    path = recv['path'] if recv['path'] else '.'
    branch = recv['branch']
    create = recv['create']

    try: 
      if (create):
        self.create_branch(path, branch)
      self.change_branch(path, branch)
      self.finish({'success': True})
    except Exception as e:
      self.finish({'error': str(e)})

class SyncHandler(APIHandler):

  """
  Implements all synchronization operations
  * uses git-sync-changes bash script
  """
  def get_current_branch(self, path):
    res = subprocess.run(['git', 'branch'], cwd=path, capture_output=True)
    branches = [x.strip().decode("utf-8") for x in res.stdout.split(b'\n') if (x.strip())]
    for i in range(len(branches)):
      if (branches[i][0] == '*'):
        curr_index=i
        branches[i] = branches[i][2:]
    return branches[curr_index]

  def sync_repo(self, path, options):
    res = subprocess.run(['git', 'sync-changes']+options, cwd=path, capture_output=True)
    assert res.returncode == 0, "SyncError: " + res.stderr.decode("utf-8")

  @gen.coroutine
  def post(self, *args, **kwargs):
    recv = self.get_json_body()
    path = recv['path']
    curr_branch = self.get_current_branch(path)
    options = ['origin', 'jp-shared/'+curr_branch] if recv['collab'] else [] 

    try:
      self.sync_repo(path, options)
      self.finish({'success': True, 'curr_branch': curr_branch})
    except Exception as e:
      self.finish({'error': str(e)})


class SetupHandler(APIHandler):

  """
  Sets up environment for extension to run
  * verify that working path is a git repo
  * sets up `.sync_cache` folder if none exists
  * returns executable path for sync
  """

  def get_repo_path(self, path):
    res = subprocess.run(['git', 'rev-parse', '--show-toplevel'], cwd=path, capture_output=True)
    assert res.returncode == 0, "SetupError: " + res.stderr.decode("utf=8")
    repo_path = res.stdout.decode("utf-8").strip()
    return repo_path

  def get_current_branch(self, path):
    res = subprocess.run(['git', 'branch'], cwd=path, capture_output=True)
    branches = [x.strip().decode("utf-8") for x in res.stdout.split(b'\n') if (x.strip())]
    for i in range(len(branches)):
      if (branches[i][0] == '*'):
        curr_index=i
        branches[i] = branches[i][2:]
    return branches[curr_index], branches

  @gen.coroutine
  def post(self, *args, **kwargs):
    recv = self.get_json_body()
    path = recv['path'] if recv['path'] else '.'

    try:
      repo_path = self.get_repo_path(path)
      curr_branch, branches = self.get_current_branch(path)
      self.finish({'repo_path': repo_path, 'curr_branch': curr_branch, 'branches': branches})
    except Exception as e:
      self.finish({'error': str(e)})
