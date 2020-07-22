import unittest
from unittest.mock import Mock, MagicMock, patch
from jupyterlab_bigquery.pagedAPI_handler.pagedAPI_handler\
  import PagedAPIHandler, START_STATE, CONTINUE_STATE, CANCEL_STATE, CLEAR_GENERATORS_MAX_IDILE_SEC
from jupyterlab_bigquery.pagedAPI_handler.pagedQuery_handler import PagedQueryHandler
import json
from notebook.base.handlers import app_log
from google.cloud import bigquery
from logging import INFO, WARN
import time


def multiple_return_helper(return_values):

  def inner():
    return return_values.pop(0)

  return inner


class TestPagedQueryHandler(unittest.TestCase):

  @patch("jupyterlab_bigquery.pagedAPI_handler.PagedAPIHandler.__init__")
  @patch.object(bigquery, 'Client')
  def setUp(self, fake_bigquery_client, fake_super):
    self.client_mock = MagicMock()
    fake_bigquery_client.return_value = self.client_mock

    self.dummy_query_handler = PagedQueryHandler(None, None)

  def tearDown(self):
    self.dummy_query_handler.generator_pool.clear()

  def test_ctor_client(self):
    self.assertEqual(self.dummy_query_handler.client, self.client_mock)

  @patch(
      'jupyterlab_bigquery.pagedAPI_handler.'+\
      'pagedQuery_handler.PagedQueryHandler.client.query'
  )
  @patch.object(bigquery, 'QueryJobConfig')
  def test_query_dry(self, fake_job_config, fake_client_query):
    query = MagicMock()
    jobConfig = MagicMock()
    dryRunOnly = True
    page_size = 2000
    job_id = 1231

    request_body = {
        'query': query,
        'jobConfig': jobConfig,
        'dryRunOnly': dryRunOnly
    }

    dry_run_job = MagicMock()
    dry_run_job.job_id = job_id

    dry_run_job_config_mock = MagicMock()

    fake_client_query.return_value = dry_run_job
    fake_job_config.return_value = dry_run_job_config_mock

    gen = self.dummy_query_handler.query(request_body, page_size)

    actual_dry_run_job, actual_job_id = next(gen)

    fake_job_config.assert_called_with(dry_run=True, use_query_cache=False)
    fake_client_query.assert_called_with(query,
                                         job_config=dry_run_job_config_mock)
    self.assertEqual(actual_dry_run_job, dry_run_job)
    self.assertEqual(actual_job_id, job_id)

    with self.assertRaises(StopIteration):
      next(gen)


  @patch(
      'jupyterlab_bigquery.pagedAPI_handler.'+\
      'pagedQuery_handler.PagedQueryHandler.client.query'
  )
  @patch.object(bigquery, 'QueryJobConfig')
  def test_query_dry_general_err(self, fake_job_config, fake_client_query):
    query = MagicMock()
    jobConfig = MagicMock()
    dryRunOnly = True
    page_size = 2000
    job_id = 1231

    request_body = {
        'query': query,
        'jobConfig': jobConfig,
        'dryRunOnly': dryRunOnly
    }

    dry_run_job = MagicMock()
    dry_run_job.job_id = job_id

    dry_run_job_config_mock = MagicMock()

    fake_client_query.side_effect = Exception()
    fake_job_config.return_value = dry_run_job_config_mock

    gen = self.dummy_query_handler.query(request_body, page_size)

    with self.assertRaises(Exception):
      next(gen)

  @patch(
      'jupyterlab_bigquery.pagedAPI_handler.'+\
      'pagedQuery_handler.PagedQueryHandler.client.query'
  )
  @patch.object(bigquery, 'QueryJobConfig')
  def test_query_dry_erres_err(self, fake_job_config, fake_client_query):
    query = MagicMock()
    jobConfig = MagicMock()
    dryRunOnly = True
    page_size = 2000
    job_id = 1231
    dummy_err_msg = 'dummy_err_msg'

    request_body = {
        'query': query,
        'jobConfig': jobConfig,
        'dryRunOnly': dryRunOnly
    }

    dry_run_job = MagicMock()
    dry_run_job.job_id = job_id

    dry_run_job_config_mock = MagicMock()

    class DummyException(Exception):
      errors = [{'message': dummy_err_msg}]

    err = DummyException()

    fake_client_query.side_effect = err
    fake_job_config.return_value = dry_run_job_config_mock

    gen = self.dummy_query_handler.query(request_body, page_size)

    try:
      next(gen)
      self.fail()
    except Exception as inst:
      self.assertEqual(str(inst), dummy_err_msg)

  @patch.object(json, 'dumps')
  @patch('jupyterlab_bigquery.handlers.format_preview_fields')
  @patch('jupyterlab_bigquery.handlers.format_preview_row')
  @patch(
      'jupyterlab_bigquery.pagedAPI_handler.'+\
      'pagedQuery_handler.PagedQueryHandler.client.query'
  )
  @patch.object(bigquery, 'QueryJobConfig')
  def test_normal_query(self, fake_job_config, fake_client_query,
                        fake_format_preview_fields, fake_format_preview_row,
                        fake_json_dumps):
    query = MagicMock()
    jobConfig = MagicMock()
    dryRunOnly = False
    page_size = 2000
    job_id = 1231

    gen_len = 4

    request_body = {
        'query': query,
        'jobConfig': jobConfig,
        'dryRunOnly': dryRunOnly
    }

    run_job = MagicMock()
    run_job.job_id = job_id
    run_job.error_result = None

    run_job_config_mock = MagicMock()

    fake_client_query.return_value = run_job
    fake_job_config.return_value = run_job_config_mock

    gen = self.dummy_query_handler.query(request_body, page_size)

    actual_dry_run_job, actual_job_id = next(gen)

    self.assertEqual(actual_dry_run_job, run_job)
    self.assertEqual(actual_job_id, job_id)

    fake_en = MagicMock()
    result_mock = MagicMock()

    fake_en.pages = [MagicMock()] * gen_len
    run_job.result = result_mock
    result_mock.return_value = fake_en

    for _ in range(gen_len):
      res = next(gen)

      self.assertIn('content', res)
      self.assertIn('labels', res)
      self.assertIn('bytesProcessed', res)

    with self.assertRaises(StopIteration):
      next(gen)

  @patch.object(json, 'dumps')
  @patch('jupyterlab_bigquery.handlers.format_preview_fields')
  @patch('jupyterlab_bigquery.handlers.format_preview_row')
  @patch(
      'jupyterlab_bigquery.pagedAPI_handler.'+\
      'pagedQuery_handler.PagedQueryHandler.client.query'
  )
  @patch.object(bigquery, 'QueryJobConfig')
  def test_err_query(self, fake_job_config, fake_client_query,
                     fake_format_preview_fields, fake_format_preview_row,
                     fake_json_dumps):
    query = MagicMock()
    jobConfig = MagicMock()
    dryRunOnly = False
    page_size = 2000
    job_id = 1231
    dummy_err_msg = 'dummy_err_msg'

    request_body = {
        'query': query,
        'jobConfig': jobConfig,
        'dryRunOnly': dryRunOnly
    }

    run_job = MagicMock()
    run_job.job_id = job_id
    run_job.error_result = dummy_err_msg

    run_job_config_mock = MagicMock()

    fake_client_query.return_value = run_job
    fake_job_config.return_value = run_job_config_mock

    gen = self.dummy_query_handler.query(request_body, page_size)

    try:
      next(gen)
      self.fail()
    except Exception as inst:
      self.assertEqual(str(inst), dummy_err_msg)

    def text_cancel(self):
      job_mock = MagicMock()

      self.dummy_query_handler.cancel(job_mock)

      job_mock.assert_called()
