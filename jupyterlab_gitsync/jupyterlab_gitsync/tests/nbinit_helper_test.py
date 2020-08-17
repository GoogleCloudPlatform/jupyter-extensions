import unittest
import subprocess
from jupyterlab_gitsync.nb_handlers import NotebookInitHandler

class TestNotebookInit(unittest.TestCase):
  
  def setUp(self):
    subprocess.call(['mkdir', 'test_files'], cwd='.')
    subprocess.call(['mkdir', 'test_files/.sync_cache'], cwd='.')
    file_path = 'test_files/init_cache_test.ipynb'

    file_contents = '{                            \n\
                       "cells": [                 \n\
                        {                         \n\
                         "cell_type": "code",     \n\
                         "execution_count": null, \n\
                         "metadata": {},          \n\
                         "outputs": [],           \n\
                         "source": []             \n\
                        }                         \n\
                       ],                         \n\
                       "metadata": {              \n\
                        "kernelspec": {           \n\
                         "display_name": "",      \n\
                         "name": ""               \n\
                        },                        \n\
                        "language_info": {        \n\
                         "name": ""               \n\
                        }                         \n\
                       },                         \n\
                       "nbformat": 4,             \n\
                       "nbformat_minor": 4        \n\
                      }'

    with open(file_path, 'w+') as file:
      file.write(file_contents)

  def tearDown(self): 
    subprocess.call(['rm', '-r', 'test_files'], cwd='.')

  def test_add_file_cache(self):
    path = 'test_files'
    file_path = 'test_files/init_cache_test.ipynb'

    fpath, dpath = NotebookInitHandler.add_file_cache(None, path, file_path)

    self.assertEqual(fpath, 'init_cache_test.ipynb')
    self.assertEqual(dpath, '.sync_cache/init_cache_test')

    file_exists = not subprocess.call(['ls', dpath], cwd=path)
    self.assertTrue(file_exists, msg="directory in '.sync_cache' containing cached files does not exist" )

  def test_init_cache_files(self):
    subprocess.call(['mkdir', 'test_files/.sync_cache/init_cache_test'], cwd='.')

    path = 'test_files'
    fpath = 'init_cache_test.ipynb'
    dpath = '.sync_cache/init_cache_test'

    NotebookInitHandler.init_cache_files(None, path, fpath, dpath)

    cache_file_list = subprocess.check_output(['ls', dpath], cwd=path)
    self.assertTrue(b'base.ipynb' in cache_file_list, msg="'base.ipynb' was not created")
    self.assertTrue(b'local.ipynb' in cache_file_list, msg="'local.ipynb' was not created")
    self.assertTrue(b'remote.ipynb' in cache_file_list, msg="'remote.ipynb' was not created")
    self.assertTrue(b'merged.ipynb' in cache_file_list, msg="'merged.ipynb' was not created")

    cache_file_path = 'test_files/.sync_cache/init_cache_test/'
    
    with open(cache_file_path+'base.ipynb', 'r') as b:
      base = b.read()
    with open(cache_file_path+'local.ipynb', 'r') as l:
      local = l.read()
    with open(cache_file_path+'remote.ipynb', 'r') as r:
      remote = r.read()
    with open(cache_file_path+'merged.ipynb', 'r') as m: 
      merged = m.read()
    
    self.assertEqual(base, local, msg="BASE and LOCAL are different")
    self.assertEqual(base, remote, msg="BASE and REMOTE are different")
    self.assertEqual(base, merged, msg="BASE and MERGED are different")

if __name__ == '__main__':
  unittest.main()

