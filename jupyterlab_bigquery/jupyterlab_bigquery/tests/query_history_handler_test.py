# Lint as: python3
"""Tests for details panel handlers."""
import unittest
import datetime
from unittest.mock import Mock, MagicMock, patch

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

    with patch('jupyterlab_bigquery.query_history_handler'+\
            '.query_history_handler.datetime.datetime') as fake_datetime:
      timestamp = 1

      gcp_jobs = [mock_job]

      mock_client = Mock()
      mock_client.list_jobs = MagicMock(return_value=gcp_jobs)

      wanted = {
          'jobs': {
              'dummy_job': {
                  'query': 'SELECT * FROM *',
                  'id': 'dummy_job',
                  'created': '2020-07-14T13:23:45.000067',
                  'errored': True,
              }
          },
          'jobIds': ['dummy_job'],
          'lastFetchTime': timestamp
      }

      fake_utc = MagicMock()
      fake_utc.timestamp.return_value = timestamp
      fake_datetime.utcnow.return_value = fake_utc

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
                                            46,
                                            67,
                                            tzinfo=None),
                    estimated_bytes_processed=1,
                    priority='INTERACTIVE',
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
        'created': '2020-07-14T13:23:45.000067',
        'started': '2020-07-14T13:23:45.000067',
        'ended': '2020-07-14T13:23:46.000067',
        'duration': 1,
        'bytesProcessed': 1,
        'priority': 'INTERACTIVE',
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

  def testGetJobDetailsErrors(self):
    mock_table = Mock(id='dummy_table')
    mock_table_ref = Mock(id='dummy_table')

    mock_job = Mock(
        query='SELECT * FROMs `cxjia-sandbox.babynames.names_1987` LIMITs 200',
        user_email='dummy_email',
        location='US',
        created=datetime.datetime(2020, 7, 14, 13, 23, 45, 67, tzinfo=None),
        started=datetime.datetime(2020, 7, 14, 13, 23, 45, 67, tzinfo=None),
        ended=datetime.datetime(2020, 7, 14, 13, 23, 45, 67, tzinfo=None),
        estimated_bytes_processed=0.0,
        priority='INTERACTIVE',
        destination=mock_table_ref,
        use_legacy_sql=False,
        state='Done',
        errors=[{
            'reason':
                'invalidQuery',
            'location':
                'query',
            'message':
                'Syntax error: Expected end of input but\
                     got identifier "FROMs" at [1:10]'
        }],
        error_result={
            'reason':
                'invalidQuery',
            'location':
                'query',
            'message':
                'Syntax error: Expected end of input but\
                     got identifier "FROMs" at [1:10]'
        },
        cache_hit=None,
        project=None)

    mock_client = Mock()
    mock_client.get_table = MagicMock(return_value=mock_table)
    mock_client.get_job = MagicMock(return_value=mock_job)

    wanted = {
        'query':
            'SELECT * FROMs `cxjia-sandbox.babynames.names_1987` LIMITs 200',
        'id':
            'dummy_job',
        'user':
            'dummy_email',
        'location':
            'US',
        'created':
            '2020-07-14T13:23:45.000067',
        'started':
            '2020-07-14T13:23:45.000067',
        'ended':
            '2020-07-14T13:23:45.000067',
        'duration':
            0.0,
        'bytesProcessed':
            0.0,
        'priority':
            'INTERACTIVE',
        'destination':
            'dummy_table',
        'useLegacySql':
            False,
        'state':
            'Done',
        'errors': [{
            'reason':
                'invalidQuery',
            'location':
                'query',
            'message':
                'Syntax error: Expected end of input but\
                     got identifier "FROMs" at [1:10]'
        }],
        'errorResult': {
            'reason':
                'invalidQuery',
            'location':
                'query',
            'message':
                'Syntax error: Expected end of input but\
                     got identifier "FROMs" at [1:10]'
        },
        'from_cache':
            None,
        'project':
            None,
    }

    got = get_job_details(mock_client, 'dummy_job')
    self.assertEqual(wanted, got)


if __name__ == '__main__':
  unittest.main()
