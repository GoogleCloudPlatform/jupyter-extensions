# Lint as: python3
"""Tests for details panel handlers."""
import unittest
import datetime
from unittest.mock import Mock, MagicMock, patch

from google.cloud.bigquery.job import QueryJob
from jupyterlab_bigquery.query_history_handler.query_history_handler import get_table, list_jobs, get_job_details


class TestQueryHistory(unittest.TestCase):

  def testGetTable(self):
    mock_table = Mock()
    mock_table.id = 'dummy_table'

    mock_table_ref = Mock()
    mock_table_ref.id = 'dummy_table'

    mock_client = Mock()
    mock_client.get_table = MagicMock(return_value=mock_table)

    wanted = 'dummy_table'

    got = get_table(mock_client, mock_table_ref)
    self.assertEqual(wanted, got)

  def testListJobs(self):
    mock_job = Mock(job_type='query',
                    query='SELECT * FROM *',
                    job_id='dummy_job',
                    created=datetime.datetime(2020,
                                              7,
                                              14,
                                              13,
                                              23,
                                              45,
                                              67,
                                              tzinfo=None),
                    errors='error')

    gcp_jobs = [mock_job]

    mock_client = Mock()
    mock_client.list_jobs = MagicMock(return_value=gcp_jobs)

    wanted = {
        'jobs': {
            'dummy_job': {
                'query': 'SELECT * FROM *',
                'id': 'dummy_job',
                'created': 'Jul 14, 2020,  1:23:45 PM',
                'time': ' 1:23 PM',
                'errored': True,
            }
        },
        'jobIds': {
            '7/14/20': ['dummy_job']
        },
    }

    got = list_jobs(mock_client, 'dummy_dataset1')
    self.assertEqual(wanted, got)

  def testGetJobDetails(self):
    mock_table = Mock(id='dummy_table')
    mock_table_ref = Mock(id='dummy_table')

    mock_job = Mock(query='SELECT * FROM *',
                    user_email='dummy_email',
                    location='US',
                    created=datetime.datetime(2020,
                                              7,
                                              14,
                                              13,
                                              23,
                                              45,
                                              67,
                                              tzinfo=None),
                    started=datetime.datetime(2020,
                                              7,
                                              14,
                                              13,
                                              23,
                                              45,
                                              67,
                                              tzinfo=None),
                    ended=datetime.datetime(2020,
                                            7,
                                            14,
                                            13,
                                            23,
                                            45,
                                            67,
                                            tzinfo=None),
                    estimated_bytes_processed=1,
                    priority=1,
                    destination=mock_table_ref,
                    use_legacy_sql=False,
                    state='Done',
                    errors=None,
                    error_result=None,
                    cache_hit=None,
                    project=None)

    mock_client = Mock()
    mock_client.get_table = MagicMock(return_value=mock_table)
    mock_client.get_job = MagicMock(return_value=mock_job)

    wanted = {
        'query': 'SELECT * FROM *',
        'id': 'dummy_job',
        'user': 'dummy_email',
        'location': 'US',
        'created': 'Jul 14, 2020,  1:23:45 PM',
        'started': 'Jul 14, 2020,  1:23:45 PM',
        'ended': 'Jul 14, 2020,  1:23:45 PM',
        'duration': 0.0,
        'bytesProcessed': 1,
        'priority': 1,
        'destination': 'dummy_table',
        'useLegacySql': False,
        'state': 'Done',
        'errors': None,
        'errorResult': None,
        'from_cache': None,
        'project': None,
    }

    got = get_job_details(mock_client, 'dummy_job')
    self.assertEqual(wanted, got)


if __name__ == '__main__':
  unittest.main()
