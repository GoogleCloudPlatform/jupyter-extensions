import base64
import json
import re
import tornado.gen as gen
import os
import subprocess

from collections import namedtuple
from notebook.base.handlers import APIHandler, app_log

from jupyterlab_gitsync.version import VERSION 

class NotebookInitHandler(APIHandler):

  """
  Initializes cached directory for file
  * creates dir in '.sync_cache' to hold file caches
  """
  def add_file_cache(self, path, file_path):
    fpath = file_path[file_path.startswith(path) and len(path)+1:]
    dname = fpath.replace('/', ':').replace('.ipynb','')

    dpath = '.sync_cache/'+dname
    file_exists = not subprocess.call(['ls', dpath], cwd=path)
    if not file_exists:
      subprocess.call(['mkdir', dpath], cwd=path)

    # TO DO (ashleyswang): consider case that dname is
    # another file in repository
    return fpath, dpath

  def init_cache_files(self, path, fpath, dpath):
    """
    Initialize cached folder to start sync process
    @params
      * path  : git repository path relative to server
      * fpath : file path relative to path
      * dpath : cache dir path for file relative to path
    """
    assert subprocess.call(['cp', fpath, dpath+'/base.ipynb'], cwd=path) == 0, 'init base.ipynb failed'
    assert subprocess.call(['cp', fpath, dpath+'/local.ipynb'], cwd=path) == 0, 'init local.ipynb failed'
    assert subprocess.call(['cp', fpath, dpath+'/remote.ipynb'], cwd=path) == 0, 'init remote.ipynb failed'
    assert subprocess.call(['cp', fpath, dpath+'/merged.ipynb'], cwd=path) == 0, 'init merged.ipynb failed'

  @gen.coroutine
  def post(self, *arg, **kwargs):
    recv = self.get_json_body()
    path = recv['path']
    file_path = recv['file_path']

    try:
      fpath, dpath = self.add_file_cache(path, file_path)
      self.init_cache_files(path, fpath, dpath)
      self.finish({'success': True, 'fpath': fpath, 'dpath': dpath})
    except Exception as e:
      self.finish({'error': str(e)})

class NotebookMergeHandler(APIHandler):

  """
  Merges .ipynb files together
  * updates cached files in '.sync_cache' folder
  * uses nbmerge to merge files
  * notify caller of conflicts
  * if merge successful: update disk version to merged version
  """
  def update_base(self, path, dpath):
    assert subprocess.call(['cp', dpath+'/merged.ipynb', dpath+'/base.ipynb'], cwd=path) == 0, 'update base.ipynb failed'

  def update_local(self, path, dpath, text):
    file_path = path+'/'+dpath+'/local.ipynb'
    file = open(file_path, 'w+')
    file.write(text)
    file.close()

  def update_remote(self, path, fpath, dpath):
    assert subprocess.call(['cp', fpath, dpath+'/remote.ipynb'], cwd=path) == 0, 'update remote.ipynb failed'

  def update_cache_files(self, path, fpath, dpath, text):
    self.update_base(path, dpath)
    self.update_local(path, dpath, text)
    self.update_remote(path, fpath, dpath)

  def merge_notebooks(self, path, dpath):
    dpath_abs = path+'/'+dpath
    res = subprocess.check_output('nbmerge base.ipynb local.ipynb remote.ipynb > merged.ipynb', 
      cwd=dpath_abs, shell=True)
    print(res)
    if (res == b''):
      return True
    elif (res == b'[W nbmergeapp:57] Conflicts occured during merge operation.'):
      return False
    else:
      raise Exception('Nbmerge was unable to process files. Make sure files are .ipynb files.')

  def update_disk_file(self, path, fpath, dpath):
    assert subprocess.call(['cp', dpath+'/merged.ipynb', fpath], cwd=path) == 0, 'update {} failed'.format(fpath)

  @gen.coroutine
  def post(self, *args, **kwargs):
    recv = self.get_json_body()
    path = recv['path']
    fpath = recv['fpath']
    dpath = recv['dpath']
    text = recv['text']

    try:
      self.update_cache_files(path, fpath, dpath, text)
      merged = self.merge_notebooks(path, dpath)
      if (merged): 
        self.update_disk_file(path, fpath, dpath)
        self.finish({'success': True})
      else:
        self.finish({'conflict': True})
    except Exception as e:
      self.finish({'error': str(e)})

class NotebookResolveHandler(APIHandler):

  """ 
  Updates original .ipynb with user input file
  """

  def update_disk_file(self, path, fpath, dpath, origin):
    copy_file_path = dpath+'/'+origin+'.ipynb'
    assert subprocess.call(['cp', copy_file_path, fpath], cwd=path) == 0, 'update {} after conflict failed'.format(fpath)

  @gen.coroutine
  def post(self, *args, **kwargs):
    recv = self.get_json_body()
    path = recv['path']
    fpath = recv['fpath']
    dpath = recv['dpath']
    origin = recv['origin']

    try:
      self.update_disk_file(path, fpath, dpath, origin)
      self.finish({'success': True})
    except Exception as e:
      self.finish({'error': str(e)})


