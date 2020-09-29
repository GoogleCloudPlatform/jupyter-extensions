import unittest
import datetime
from unittest.mock import Mock, MagicMock, patch

from jupyterlab_gcsfilebrowser import handlers

from google.cloud import storage  # used for connecting to GCS
from google.cloud.storage import Blob, Bucket

import pprint

pp = pprint.PrettyPrinter(indent=2)


class TestGCSDirectory(unittest.TestCase):

  def testGetPathContentsRoot(self):
    requests = ['/', '']
    gcs_buckets = [
        Bucket(client=Mock(), name='dummy_bucket1'),
        Bucket(client=Mock(), name='dummy_bucket2'),
    ]

    storage_client = Mock()
    storage_client.list_buckets = MagicMock(return_value=gcs_buckets)

    wanted = {
        'type':
            'directory',
        'content': [
            {
                'name': 'dummy_bucket1/',
                'path': 'dummy_bucket1/',
                'type': 'directory',
                'last_modified': '',
            },
            {
                'name': 'dummy_bucket2/',
                'path': 'dummy_bucket2/',
                'type': 'directory',
                'last_modified': '',
            },
        ]
    }

    for req in requests:
      got = handlers.getPathContents(req, storage_client)
      self.assertEqual(wanted, got)

  def testGetPathContentsRootEmpty(self):
    requests = ['/', '']
    gcs_buckets = []

    storage_client = Mock()
    storage_client.list_buckets = MagicMock(return_value=gcs_buckets)

    wanted = {'type': 'directory', 'content': []}

    for req in requests:
      got = handlers.getPathContents(req, storage_client)
      self.assertEqual(wanted, got)

  def testGetPathContentsDir(self):
    requests = ['dummy_bucket1/', 'dummy_bucket1']

    dummy_bucket1 = Bucket(client=Mock(), name='dummy_bucket1')

    gcs_buckets = [
        dummy_bucket1,
    ]
    gcs_blobs = [
        Blob(name='dummy_file', bucket=dummy_bucket1),
        Blob(name='dummy_dir/', bucket=dummy_bucket1),
    ]

    storage_client = Mock()
    storage_client.list_buckets = MagicMock(return_value=gcs_buckets)
    storage_client.list_blobs = MagicMock(return_value=gcs_blobs)

    wanted = {
        'type':
            'directory',
        'content': [
            {
                'name': 'dummy_file',
                'path': 'dummy_bucket1/dummy_file',
                'type': 'file',
                'last_modified': '',
            },
            {
                'name': 'dummy_dir/',
                'path': 'dummy_bucket1/dummy_dir/',
                'type': 'directory',
                'last_modified': '',
            },
        ]
    }

    for req in requests:
      got = handlers.getPathContents(req, storage_client)
      self.assertDictEqual(wanted, got)

  def testGetPathContentsDirEmpty(self):
    requests = ['dummy_bucket1/', 'dummy_bucket1']

    dummy_bucket1 = Bucket(client=Mock(), name='dummy_bucket1')

    gcs_buckets = [
        dummy_bucket1,
    ]
    gcs_blobs = []

    storage_client = Mock()
    storage_client.list_buckets = MagicMock(return_value=gcs_buckets)
    storage_client.list_blobs = MagicMock(return_value=gcs_blobs)

    wanted = {'type': 'directory', 'content': []}

    for req in requests:
      got = handlers.getPathContents(req, storage_client)
      self.assertDictEqual(wanted, got)

  def testGetPathContentsSubDir(self):
    requests = ['dummy_bucket1/subdir/', 'dummy_bucket1/subdir']

    dummy_bucket1 = Bucket(client=Mock(), name='dummy_bucket1')

    gcs_buckets = [
        dummy_bucket1,
    ]
    gcs_blobs = [
        Blob(name='subdir/dummy_file', bucket=dummy_bucket1),
        Blob(name='subdir/dummy_dir/', bucket=dummy_bucket1),
    ]

    storage_client = Mock()
    storage_client.list_buckets = MagicMock(return_value=gcs_buckets)
    storage_client.list_blobs = MagicMock(return_value=gcs_blobs)

    wanted = {
        'type':
            'directory',
        'content': [
            {
                'name': 'dummy_file',
                'path': 'dummy_bucket1/subdir/dummy_file',
                'type': 'file',
                'last_modified': '',
            },
            {
                'name': 'dummy_dir/',
                'path': 'dummy_bucket1/subdir/dummy_dir/',
                'type': 'directory',
                'last_modified': '',
            },
        ]
    }

    for req in requests:
      got = handlers.getPathContents(req, storage_client)
      self.assertEqual(wanted['content'], got['content'])

    with self.assertRaises(handlers.FileNotFound):
      req = 'dummy_bucket1/sub'
      handlers.getPathContents(req, storage_client)

  def testGetPathContentsSubDirEmpty(self):
    requests = ['dummy_bucket1/subdir/', 'dummy_bucket1/subdir']

    dummy_bucket1 = Bucket(client=Mock(), name='dummy_bucket1')

    gcs_buckets = [
        dummy_bucket1,
    ]
    gcs_blobs = [
        Blob(name='subdir/', bucket=dummy_bucket1),
    ]

    storage_client = Mock()
    storage_client.list_buckets = MagicMock(return_value=gcs_buckets)
    storage_client.list_blobs = MagicMock(return_value=gcs_blobs)

    wanted = {'type': 'directory', 'content': []}

    for req in requests:
      got = handlers.getPathContents(req, storage_client)
      self.assertEqual(wanted['content'], got['content'])


if __name__ == '__main__':
  unittest.main()
