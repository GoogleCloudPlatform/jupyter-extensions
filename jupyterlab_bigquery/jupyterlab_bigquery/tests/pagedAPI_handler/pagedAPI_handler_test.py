import unittest
from unittest.mock import Mock, MagicMock, patch
from jupyterlab_bigquery.pagedAPI_handler.pagedAPI_handler import PagedAPIHandler, START_STATE, CONTINUE_STATE, CANCEL_STATE
from tornado import httputil
from tornado.web import Application
import json
from notebook.base.handlers import app_log
from logging import INFO, WARN

PATH = '/gcp/v1/bigquery'


class DummyPageAPI(PagedAPIHandler):

  def query(self, request_body, page_size):
    return request_body, page_size


class TestPagedAPI_handler(unittest.TestCase):

  @patch("jupyterlab_bigquery.pagedAPI_handler.PagedAPIHandler.__init__",
         autospec=True,
         return_value=None)
  def setUp(self, fake_super):
    self.dummy_pagedAPI = DummyPageAPI(None, None)

  def prep_test_post(self, load):
    get_json_body_mock = MagicMock()
    self.dummy_pagedAPI.get_json_body = get_json_body_mock
    get_json_body_mock.return_value = load

    on_start_mock = MagicMock()
    on_continue_mock = MagicMock()
    on_cancel_mock = MagicMock()
    self.dummy_pagedAPI._onStart = on_start_mock
    self.dummy_pagedAPI._onContinue = on_continue_mock
    self.dummy_pagedAPI._onCancel = on_cancel_mock

    return on_start_mock, on_continue_mock, on_cancel_mock

  def test_post_start(self):
    # start
    fake_load = "fake_load"
    load = {'intention': START_STATE, 'load': fake_load}
    on_start_mock, on_continue_mock, on_cancel_mock = self.prep_test_post(load)
    on_start_mock.assert_called_once_with(fake_load)
    on_continue_mock.assert_not_called()
    on_cancel_mock.assert_not_called()

  # def test_post_continue(self):
  #   # start
  #   fake_load = "fake_load"
  #   load = {'intention': CONTINUE_STATE, 'load': fake_load}
  #   on_start_mock, on_continue_mock, on_cancel_mock = self.prep_test_post(load)
  #   on_start_mock.assert_not_called()
  #   on_continue_mock.assert_called_once_with(fake_load)
  #   on_cancel_mock.assert_not_called()

  # def test_post_cancel(self):
  #   # start
  #   fake_load = "fake_load"
  #   load = {'intention': CANCEL_STATE, 'load': fake_load}
  #   on_start_mock, on_continue_mock, on_cancel_mock = self.prep_test_post(load)
  #   on_start_mock.assert_not_called()
  #   on_continue_mock.assert_not_called()
  #   on_cancel_mock.assert_called_once_with(fake_load)

  # def test_post_none(self):
  #   # None
  #   load = {'intention': 'HAHAHA', 'load': ''}
  #   on_start_mock, on_continue_mock, on_cancel_mock = self.prep_test_post(load)
  #   self.dummy_pagedAPI.post()
  #   on_start_mock.assert_not_called()
  #   on_continue_mock.assert_not_called()
  #   on_cancel_mock.assert_not_called()

  @patch.object(app_log, 'log')
  def test_start(self, fake_app_log):
    query_mock = MagicMock()
    finish_mock = MagicMock()
    self.dummy_pagedAPI.query = query_mock
    self.dummy_pagedAPI.finish = finish_mock

    def reset_mocks():
      query_mock.reset_mock()
      finish_mock.reset_mock()

    load = {'requestBody': 'requestBody', 'pageSize': 10}

    # test normal
    job = 'job'
    job_id = 'job_id'

    def normal_gen():
      yield job, job_id

    query_mock.return_value = normal_gen()
    self.dummy_pagedAPI._onStart(load)
    query_mock.assert_called_once_with(load['requestBody'], load['pageSize'])
    arg = finish_mock.call_args[0][0]
    self.assertEqual(arg['id'], json.dumps(job_id))
    self.assertEqual(arg['error'], json.dumps(None))
    args = fake_app_log.call_args[0]
    self.assertEqual(args[0], INFO)
    self.assertEqual(args[2], job_id)
    reset_mocks()

    # test error
    err = Exception()

    def err_gen():
      raise err
      yield None

    query_mock.return_value = err_gen()
    self.dummy_pagedAPI._onStart(load)
    arg = finish_mock.call_args[0][0]
    self.assertEqual(arg['id'], json.dumps(None))
    self.assertEqual(arg['error'], json.dumps(str(err)))
    args = fake_app_log.call_args[0]
    self.assertEqual(args[0], WARN)
    self.assertEqual(args[2], str(err))
