import unittest
import subprocess
from jupyterlab_gitsync.nb_handlers import NotebookMergeHandler

base_contents = '\
  {                                                           \n\
    "cells": [                                                \n\
    {                                                         \n\
     "cell_type": "code",                                     \n\
     "execution_count": null,                                 \n\
     "metadata": {},                                          \n\
     "outputs": [],                                           \n\
     "source": [                                              \n\
      "# This is our base cell\\n",                           \n\
      "# Other cells should be written around this cell\\n",  \n\
      "# We can test merge with additions to base cells\\n",  \n\
      "# and adding cells entirely."                          \n\
     ]                                                        \n\
    },                                                        \n\
    {                                                         \n\
     "cell_type": "code",                                     \n\
     "execution_count": null,                                 \n\
     "metadata": {},                                          \n\
     "outputs": [],                                           \n\
     "source": [                                              \n\
      "print(\\"Hello, this is a cell from the base version of the file.\\")" \n\
     ]                                                        \n\
    }                                                         \n\
   ],                                                         \n\
   "metadata": {                                              \n\
    "kernelspec": {                                           \n\
     "display_name": "",                                      \n\
     "name": ""                                               \n\
    },                                                        \n\
    "language_info": {                                        \n\
     "name": ""                                               \n\
    }                                                         \n\
   },                                                         \n\
   "nbformat": 4,                                             \n\
   "nbformat_minor": 4                                        \n\
  }'

remote_contents = '\
  {                                                           \n\
   "cells": [                                                 \n\
    {                                                         \n\
     "cell_type": "code",                                     \n\
     "execution_count": null,                                 \n\
     "metadata": {},                                          \n\
     "outputs": [],                                           \n\
     "source": [                                              \n\
      "# This is our base cell\\n",                           \n\
      "# Other cells should be written around this cell\\n",  \n\
      "# We can test merge with additions to base cells\\n",  \n\
      "# and adding cells entirely.\\n",                      \n\
      "\\n",                                                  \n\
      "# This is a comment from a REMOTE change"              \n\
     ]                                                        \n\
    },                                                        \n\
    {                                                         \n\
     "cell_type": "code",                                     \n\
     "execution_count": null,                                 \n\
     "metadata": {},                                          \n\
     "outputs": [],                                           \n\
     "source": [                                              \n\
      "print(\\"Hello, this is a cell from the base version of the file.\\")" \n\
     ]                                                        \n\
    },                                                        \n\
    {                                                         \n\
     "cell_type": "code",                                     \n\
     "execution_count": null,                                 \n\
     "metadata": {},                                          \n\
     "outputs": [],                                           \n\
     "source": [                                              \n\
      "print(\\"This is a change from the REMOTE repository.\\")" \n\
     ]                                                        \n\
    }                                                         \n\
   ],                                                         \n\
   "metadata": {                                              \n\
    "kernelspec": {                                           \n\
     "display_name": "",                                      \n\
     "name": ""                                               \n\
    },                                                        \n\
    "language_info": {                                        \n\
     "name": ""                                               \n\
    }                                                         \n\
   },                                                         \n\
   "nbformat": 4,                                             \n\
   "nbformat_minor": 4                                        \n\
  }'
 
local_contents = '{"metadata":{"kernelspec":{"display_name":"","name":""},\
  "language_info":{"name":""}},"nbformat_minor":4,"nbformat":4,"cells":\
  [{"cell_type":"code","source":"# This is a change from our LOCAL changes\\n\
  \\n# This is our base cell\\n# Other cells should be written around this cell\
  \\n# We can test merge with additions to base cells\\n# and adding cells entirely.",\
  "metadata":{"trusted":true},"execution_count":null,"outputs":[]},{"cell_type":"code",\
  "source":"print(\\"This is a cell from our LOCAL changes\\")","metadata":{"trusted":true},\
  "execution_count":null,"outputs":[]},{"cell_type":"code","source":"print(\\"Hello, this\
  is a cell from the base version of the file.\\")","metadata":{"trusted":true},\
  "execution_count":null,"outputs":[]}]}'

def make_setup():
  subprocess.call(['mkdir', 'test_files'], cwd='.')
  subprocess.call(['mkdir', 'test_files/.sync_cache'], cwd='.')
  subprocess.call(['mkdir', 'test_files/.sync_cache/init_cache_test'], cwd='.')

def remove_setup():
  subprocess.call(['rm', '-r', 'test_files'], cwd='.')

class TestNotebookInit(unittest.TestCase):

  def test_update_base(self):
    make_setup()
    base_og_path = 'test_files/.sync_cache/init_cache_test/merged.ipynb'
    with open(base_og_path, 'w') as b:
      b.write(base_contents)

    path = 'test_files'
    dpath = '.sync_cache/init_cache_test'

    updated_base = NotebookMergeHandler.update_base(None, path, dpath)

    self.assertEqual(updated_base, None, msg="update_base exited with non-zero exit code")

    with open('test_files/.sync_cache/init_cache_test/base.ipynb') as b:
      base_ud_contents = b.read()

    self.assertEqual(base_ud_contents, base_contents, msg='merged.ipynb did not successfully copy into base.ipynb')
    remove_setup()

  def test_update_local(self):
    make_setup()

    path = 'test_files'
    dpath = '.sync_cache/init_cache_test'

    NotebookMergeHandler.update_local(None, path, dpath, local_contents)

    with open('test_files/.sync_cache/init_cache_test/local.ipynb') as l:
      local_ud_contents = l.read()

    self.assertEqual(local_ud_contents, local_contents, msg='input text did not successfully copy into local.ipynb')
    remove_setup()

  def test_update_remote(self):
    make_setup()
    remote_og_path = 'test_files/init_cache_test.ipynb'
    with open(remote_og_path, 'w') as r:
      r.write(remote_contents)

    path = 'test_files'
    fpath = 'init_cache_test.ipynb'
    dpath = '.sync_cache/init_cache_test'

    updated_remote = NotebookMergeHandler.update_remote(None, path, fpath, dpath)

    self.assertEqual(updated_remote, None, msg="update_remote exited with non-zero exit code")

    with open('test_files/.sync_cache/init_cache_test/remote.ipynb') as r:
      remote_ud_contents = r.read()

    self.assertEqual(remote_ud_contents, remote_contents, msg='remote file did not successfully copy into remote.ipynb')
    remove_setup()

  def test_merge_notebooks(self):
    make_setup()
    with open('test_files/.sync_cache/init_cache_test/base.ipynb', 'w') as b:
      b.write(base_contents)
    with open('test_files/.sync_cache/init_cache_test/local.ipynb', 'w') as l:
      l.write(local_contents)
    with open('test_files/.sync_cache/init_cache_test/remote.ipynb', 'w') as r:
      r.write(remote_contents)

    path = 'test_files'
    dpath = '.sync_cache/init_cache_test'

    NotebookMergeHandler.merge_notebooks(None, path, dpath)

    merged_exists = b'merged.ipynb' in subprocess.check_output(['ls', dpath], cwd=path)
    self.assertTrue(merged_exists, msg='nbmerge failed to create new merged file')

    with open('test_files/.sync_cache/init_cache_test/merged.ipynb') as m:
      merged_ud_contents = m.read()

    local_changes = "# This is a change from our LOCAL changes"
    remote_changes = "# This is a comment from a REMOTE change"

    self.assertTrue(local_changes in merged_ud_contents, msg='local changes are not in merged.ipynb')
    self.assertTrue(remote_changes in merged_ud_contents, msg='remote changes are not in merged.ipynb')
    remove_setup()

  def test_update_disk_file(self):
    make_setup()
    with open('test_files/.sync_cache/init_cache_test/merged.ipynb', 'w') as m:
      m.write(base_contents)

    path = 'test_files'
    fpath = 'init_cache_test.ipynb'
    dpath = '.sync_cache/init_cache_test'

    updated_disk_file = NotebookMergeHandler.update_disk_file(None, path, fpath, dpath)

    self.assertEqual(updated_disk_file, None, msg="update_remote exited with non-zero exit code")

    with open('test_files/init_cache_test.ipynb') as og:
      original = og.read()

    self.assertEqual(original, base_contents, msg='remote file did not successfully copy into remote.ipynb')
    remove_setup()

if __name__ == '__main__':
  unittest.main()
