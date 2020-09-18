import unittest
from unittest.mock import MagicMock, patch
import json
from google.cloud import bigquery
import google.cloud.bigquery.dbapi._helpers
from jupyterlab_bigquery.pagedAPI_handler.pagedQuery_handler import PagedQueryHandler


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
    self.assertIsNotNone(self.dummy_query_handler.client)

  @patch.object(json, 'dumps')
  @patch(
      'jupyterlab_bigquery.pagedAPI_handler.'+\
      'pagedQuery_handler.PagedQueryHandler.client.query'
  )
  @patch.object(bigquery, 'QueryJobConfig')
  def test_query_dry(self, fake_job_config, fake_client_query, json_dumps):
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

    self.assertEqual(dry_run_job_config_mock.dry_run, True)
    self.assertEqual(dry_run_job_config_mock.use_query_cache, False)
    fake_client_query.assert_called_with(query,
                                         job_config=dry_run_job_config_mock)
    self.assertEqual(actual_dry_run_job.job_id, job_id)
    self.assertEqual(actual_job_id, job_id)

    next(gen)
    json_dumps.assert_called()
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

    with self.assertRaisesRegex(Exception, dummy_err_msg):
      next(gen)

  @patch.object(json, 'dumps')
  @patch('jupyterlab_bigquery.details_handler.service.format_preview_fields')
  @patch('jupyterlab_bigquery.details_handler.service.format_preview_rows')
  @patch(
      'jupyterlab_bigquery.pagedAPI_handler.'+\
      'pagedQuery_handler.PagedQueryHandler.client.query'
  )
  @patch.object(bigquery, 'QueryJobConfig')
  def test_normal_query(self, fake_job_config, fake_client_query,
                        fake_format_preview_fields, fake_format_preview_rows,
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

    self.assertEqual(actual_dry_run_job.job_id, job_id)
    self.assertEqual(actual_job_id, job_id)

    fake_en = MagicMock()
    result_mock = MagicMock()

    fake_en.pages = [MagicMock()] * gen_len
    for page in fake_en.pages:
      page.num_items = 1
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
  @patch('jupyterlab_bigquery.details_handler.service.format_preview_fields')
  @patch('jupyterlab_bigquery.details_handler.service.format_preview_rows')
  @patch(
      'jupyterlab_bigquery.pagedAPI_handler.'+\
      'pagedQuery_handler.PagedQueryHandler.client.query'
  )
  @patch.object(bigquery, 'QueryJobConfig')
  def test_err_query(self, fake_job_config, fake_client_query,
                     fake_format_preview_fields, fake_format_preview_rows,
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

    with self.assertRaisesRegex(Exception, dummy_err_msg):
      next(gen)

  def text_cancel(self):
    job_mock = MagicMock()

    self.dummy_query_handler.cancel(job_mock)

    job_mock.assert_called()


class TestPagedQueryHandlerFlags(unittest.TestCase):

  @patch("jupyterlab_bigquery.pagedAPI_handler.PagedAPIHandler.__init__")
  @patch.object(bigquery, 'Client')
  def setUp(self, fake_bigquery_client, fake_super):
    self.client_mock = MagicMock()
    fake_bigquery_client.return_value = self.client_mock

    self.dummy_query_handler = PagedQueryHandler(None, None)

  def flag_test_helper(self, fake_job_config, fake_client_query, jobConfig):
    query = MagicMock()
    dryRunOnly = False
    page_size = 2000
    job_id = 1231

    request_body = {
        'query': query,
        'jobConfig': jobConfig,
        'dryRunOnly': dryRunOnly
    }

    run_job = MagicMock()
    run_job.error_result = None
    fake_client_query.return_value = run_job

    gen = self.dummy_query_handler.query(request_body, page_size)

    next(gen)

    dry_run_config = fake_job_config.call_args[1:][0]
    fake_en = MagicMock()
    result_mock = MagicMock()

    fake_en.pages = [MagicMock()]
    for page in fake_en.pages:
      page.num_items = 1
    run_job.result = result_mock
    result_mock.return_value = fake_en

    next(gen)

    full_run_config = fake_job_config.call_args[1:][0]

    return dry_run_config, full_run_config

  @patch.object(json, 'dumps')
  @patch('jupyterlab_bigquery.details_handler.service.format_preview_fields')
  @patch('jupyterlab_bigquery.details_handler.service.format_preview_rows')
  @patch(
      'jupyterlab_bigquery.pagedAPI_handler.'+\
      'pagedQuery_handler.PagedQueryHandler.client.query'
  )
  @patch.object(bigquery, 'QueryJobConfig')
  def test_maximum_bytes_billed(self, fake_job_config, fake_client_query,
                                fake_format_preview_fields,
                                fake_format_preview_rows, fake_json_dumps):
    flag = 'maximum_bytes_billed'
    jobConfig = {flag: 0}

    dry_run_config, full_run_config =\
      self.flag_test_helper(fake_job_config, fake_client_query, jobConfig)

    self.assertEqual(0, dry_run_config[flag], full_run_config[flag])

    jobConfig = {flag: 1222}

    dry_run_config, full_run_config =\
      self.flag_test_helper(fake_job_config, fake_client_query, jobConfig)

    self.assertEqual(1222, dry_run_config[flag], full_run_config[flag])

    jobConfig = {flag: None}

    dry_run_config, full_run_config =\
      self.flag_test_helper(fake_job_config, fake_client_query, jobConfig)

    self.assertNotIn(flag, dry_run_config)
    self.assertNotIn(flag, full_run_config)

  @patch.object(json, 'dumps')
  @patch('jupyterlab_bigquery.details_handler.service.format_preview_fields')
  @patch('jupyterlab_bigquery.details_handler.service.format_preview_rows')
  @patch(
      'jupyterlab_bigquery.pagedAPI_handler.'+\
      'pagedQuery_handler.PagedQueryHandler.client.query'
  )
  @patch.object(bigquery, 'QueryJobConfig')
  def test_legacy_sql(self, fake_job_config, fake_client_query,
                      fake_format_preview_fields, fake_format_preview_rows,
                      fake_json_dumps):
    flag = 'use_legacy_sql'

    jobConfig = {flag: True}
    dry_run_config, full_run_config =\
      self.flag_test_helper(fake_job_config, fake_client_query, jobConfig)

    self.assertEqual(True, dry_run_config[flag], full_run_config[flag])

    jobConfig = {flag: False}
    dry_run_config, full_run_config =\
      self.flag_test_helper(fake_job_config, fake_client_query, jobConfig)

    self.assertEqual(False, dry_run_config[flag], full_run_config[flag])

    jobConfig = {flag: 'bad'}

    with self.assertRaisesRegex(
        ValueError,
        'use_legacy_sql shoud be boolean, instead received {}'.format('bad')):
      dry_run_config, full_run_config =\
        self.flag_test_helper(fake_job_config, fake_client_query, jobConfig)

    jobConfig = {}

    dry_run_config, full_run_config =\
      self.flag_test_helper(fake_job_config, fake_client_query, jobConfig)

    self.assertNotIn(flag, dry_run_config)
    self.assertNotIn(flag, full_run_config)

  @patch.object(json, 'dumps')
  @patch('jupyterlab_bigquery.details_handler.service.format_preview_fields')
  @patch('jupyterlab_bigquery.details_handler.service.format_preview_rows')
  @patch(
      'jupyterlab_bigquery.pagedAPI_handler.'+\
      'pagedQuery_handler.PagedQueryHandler.client.query'
  )
  @patch.object(bigquery, 'QueryJobConfig')
  def test_project(self, fake_job_config, fake_client_query,
                   fake_format_preview_fields, fake_format_preview_rows,
                   fake_json_dumps):
    flag = 'project'

    jobConfig = {flag: 'test_proj'}
    dry_run_config, full_run_config =\
      self.flag_test_helper(fake_job_config, fake_client_query, jobConfig)

    self.assertEqual('test_proj', dry_run_config[flag], full_run_config[flag])

    jobConfig = {}

    dry_run_config, full_run_config =\
      self.flag_test_helper(fake_job_config, fake_client_query, jobConfig)

    self.assertNotIn(flag, dry_run_config)
    self.assertNotIn(flag, full_run_config)

  @patch.object(google.cloud.bigquery.dbapi._helpers, 'to_query_parameters')
  @patch.object(json, 'dumps')
  @patch('jupyterlab_bigquery.details_handler.service.format_preview_fields')
  @patch('jupyterlab_bigquery.details_handler.service.format_preview_rows')
  @patch(
      'jupyterlab_bigquery.pagedAPI_handler.'+\
      'pagedQuery_handler.PagedQueryHandler.client.query'
  )
  @patch.object(bigquery, 'QueryJobConfig')
  def test_params(self, fake_job_config, fake_client_query,
                  fake_format_preview_fields, fake_format_preview_rows,
                  fake_json_dumps, fake_to_query_parameters):
    flag = 'params'
    processed_flag = 'query_parameters'

    load = {'a': 12, 'b': 'b'}
    jobConfig = {flag: load}
    dry_run_config, full_run_config =\
      self.flag_test_helper(fake_job_config, fake_client_query, jobConfig)

    fake_to_query_parameters.assert_called_with(load)
    self.assertIn(processed_flag, dry_run_config)
    self.assertIn(processed_flag, full_run_config)
