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

from __future__ import print_function
from setuptools import setup, find_packages, Command
from setuptools.command.sdist import sdist
from setuptools.command.build_py import build_py
from setuptools.command.egg_info import egg_info
from subprocess import check_call
import glob
import json
import os
import shutil
import sys
from os.path import join as pjoin

here = os.path.dirname(os.path.abspath(__file__))
is_repo = os.path.exists(pjoin(here, '.git'))
tar_path = pjoin(here, 'jupyterlab_gcpscheduler*.tgz')
package_json = os.path.join(here, 'package.json')
requirements = os.path.join(here, 'requirements.txt')
npm_path = os.pathsep.join([
    pjoin(here, 'node_modules', '.bin'),
    os.environ.get('PATH', os.defpath),
])

from distutils import log
log.info('Starting setup.py')
log.info('$PATH=%s' % os.environ['PATH'])

LONG_DESCRIPTION = 'Google Cloud Platform Notebooks Scheduler Extension'


def ts_prerelease(command, strict=False):
  """decorator for building minified TS/CSS prior to another command"""

  class DecoratedCommand(command):

    def run(self):
      tsdeps = self.distribution.get_command_obj('tsdeps')
      if not is_repo and all(os.path.exists(t) for t in tsdeps.targets):
        # sdist, nothing to do
        command.run(self)
        return

      try:
        self.distribution.run_command('tsdeps')
      except Exception as e:
        missing = [t for t in tsdeps.targets if not os.path.exists(t)]
        if strict or missing:
          log.error('Rebuilding TS and CSS failed')
          if missing:
            log.error('Missing files: %s' % missing)
          raise e
        else:
          log.warn('Rebuilding TS and CSS failed (not a problem)')
          log.warn(str(e))
      command.run(self)
      update_package_data(self.distribution)

  return DecoratedCommand


def update_package_data(distribution):
  """update package_data to catch changes during setup"""
  build_py = distribution.get_command_obj('build_py')
  # re-init build_py options which load package_data
  build_py.finalize_options()


def get_data_files():
  """Get the data files for the package."""
  return [
      ('', [
          os.path.relpath(package_json, '.'),
          os.path.relpath(requirements, '.'),
      ]),
      ('share/jupyter/lab/extensions',
       [os.path.relpath(f, '.') for f in glob.glob(tar_path)]),
      ('etc/jupyter/jupyter_notebook_config.d', [
          'jupyter-config/jupyter_notebook_config.d/jupyterlab_gcpscheduler.json'
      ])
  ]


class NPM(Command):
  description = 'Installs package.json dependencies using npm'
  user_options = []
  node_modules = pjoin(here, 'node_modules')
  targets = []

  def initialize_options(self):
    pass

  def finalize_options(self):
    pass

  def has_npm(self):
    try:
      check_call(['npm', '--version'])
      return True
    except Exception:
      return False

  def should_run_npm_install(self):
    node_modules_exists = os.path.exists(self.node_modules)
    return self.has_npm() and not node_modules_exists

  def should_run_npm_pack(self):
    return self.has_npm()

  def run(self):
    has_npm = self.has_npm()
    if not has_npm:
      log.error(
          "`npm` unavailable. If you're running this command using sudo, make sure `npm` is available to sudo"
      )

    env = os.environ.copy()
    env['PATH'] = npm_path

    if self.should_run_npm_install():
      log.info(
          'Installing build dependencies with npm. This may take a while...')
      check_call(['npm', 'install'],
                 cwd=here,
                 stdout=sys.stdout,
                 stderr=sys.stderr)
      os.utime(self.node_modules, None)

    if self.should_run_npm_pack():
      log.info('Packing jupyterlab_gcpscheduler into archive')
      check_call(['npm', 'pack'],
                 cwd=here,
                 stdout=sys.stdout,
                 stderr=sys.stderr)

    files = glob.glob(tar_path)
    self.targets.append(tar_path if not files else files[0])

    for t in self.targets:
      if not os.path.exists(t):
        msg = 'Missing file: %s' % t
        if not has_npm:
          msg += ('\nnpm is required to build a development version of '
                  'jupyterlab_gcp_scheduler')
        raise ValueError(msg)

    self.distribution.data_files = get_data_files()

    # update package data in case this created new files
    update_package_data(self.distribution)


version = ''
with open(package_json) as f:
  version = json.load(f)['version']

requires = []
with open(requirements) as f:
  for l in f:
    if not l.startswith('#'):
      requires.append(l.strip())

setup_args = {
    'name':
        'jupyterlab_gcpscheduler',
    'version':
        version,
    'description':
        'GCP Notebooks Scheduler Extension',
    'long_description':
        LONG_DESCRIPTION,
    'license':
        'Apache',
    'include_package_data':
        True,
    'data_files':
        get_data_files(),
    'install_requires':
        requires,
    'packages':
        find_packages(),
    'zip_safe':
        False,
    'cmdclass': {
        'build_py': ts_prerelease(build_py),
        'egg_info': ts_prerelease(egg_info),
        'sdist': ts_prerelease(sdist, strict=True),
        'tsdeps': NPM,
    },
    'author':
        'AI Platform Notebooks Frontend Team',
    'author_email':
        'cloud-ai-frontend-notebooks@google.com',
    'url':
        'https://cloud.google.com/ai-platform-notebooks/',
    'keywords': [
        'ipython',
        'jupyter',
        'gcp',
        'google cloud',
    ],
    'classifiers': [
        'Intended Audience :: Developers',
        'Intended Audience :: Science/Research',
        'Intended Audience :: System Administrators',
        'Programming Language :: Python :: 3',
    ],
}

setup(**setup_args)
