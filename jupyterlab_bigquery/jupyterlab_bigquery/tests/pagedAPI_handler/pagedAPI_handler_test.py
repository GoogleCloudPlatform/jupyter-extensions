import unittest
from unittest.mock import Mock, MagicMock, patch
from jupyterlab_bigquery.pagedAPI_handler.pagedAPI_handler\
  import PagedAPIHandler, START_STATE, CONTINUE_STATE, CANCEL_STATE, CLEAR_GENERATORS_MAX_IDILE_SEC
import json
from notebook.base.handlers import app_log
from logging import INFO, WARN
import time


class DummyPageAPI(PagedAPIHandler):

  def query(self, request_body, page_size):
    pass


class TestPagedHandlerPost(unittest.TestCase):

  @patch("jupyterlab_bigquery.pagedAPI_handler.PagedAPIHandler.__init__",
         autospec=True,
         return_value=None)
  def setUp(self, fake_super):
    self.dummy_pagedAPI = DummyPageAPI(None, None)

    self.get_json_body_mock = MagicMock()
    self.dummy_pagedAPI.get_json_body = self.get_json_body_mock

    self.on_start_mock = MagicMock()
    self.on_continue_mock = MagicMock()
    self.on_cancel_mock = MagicMock()
    self.dummy_pagedAPI._onStart = self.on_start_mock
    self.dummy_pagedAPI._onContinue = self.on_continue_mock
    self.dummy_pagedAPI._onCancel = self.on_cancel_mock

  def tearDown(self):
    PagedAPIHandler.generator_pool.clear()

  def test_post_start(self):
    # start
    fake_load = "fake_load"
    load = {'intention': START_STATE, 'load': fake_load}
    self.get_json_body_mock.return_value = load
    self.dummy_pagedAPI.post()
    self.on_start_mock.assert_called_once_with(fake_load)
    self.on_continue_mock.assert_not_called()
    self.on_cancel_mock.assert_not_called()

  def test_post_continue(self):
    # start
    fake_load = "fake_load"
    load = {'intention': CONTINUE_STATE, 'load': fake_load}
    self.get_json_body_mock.return_value = load
    self.dummy_pagedAPI.post()
    self.on_start_mock.assert_not_called()
    self.on_continue_mock.assert_called_once_with(fake_load)
    self.on_cancel_mock.assert_not_called()

  def test_post_cancel(self):
    # start
    fake_load = "fake_load"
    load = {'intention': CANCEL_STATE, 'load': fake_load}
    self.get_json_body_mock.return_value = load
    self.dummy_pagedAPI.post()
    self.on_start_mock.assert_not_called()
    self.on_continue_mock.assert_not_called()
    self.on_cancel_mock.assert_called_once_with(fake_load)

  def test_post_none(self):
    # None
    load = {'intention': 'HAHAHA', 'load': ''}
    self.get_json_body_mock.return_value = load
    self.dummy_pagedAPI.post()
    self.on_start_mock.assert_not_called()
    self.on_continue_mock.assert_not_called()
    self.on_cancel_mock.assert_not_called()


class TestPagedHandlerOnStart(unittest.TestCase):

  @patch("jupyterlab_bigquery.pagedAPI_handler.PagedAPIHandler.__init__",
         autospec=True,
         return_value=None)
  def setUp(self, fake_super):
    self.dummy_pagedAPI = DummyPageAPI(None, None)

    self.query_mock = MagicMock()
    self.finish_mock = MagicMock()
    self.dummy_pagedAPI.query = self.query_mock
    self.dummy_pagedAPI.finish = self.finish_mock

  def tearDown(self):
    PagedAPIHandler.generator_pool.clear()

  @patch.object(app_log, 'log')
  def test_start_normal(self, fake_app_log):

    load = {'requestBody': 'requestBody', 'pageSize': 10}

    # test normal
    job = 'job'
    job_id = 'fake_job_id'

    def normal_gen():
      yield job, job_id

    self.query_mock.return_value = normal_gen()
    self.dummy_pagedAPI._onStart(load)
    self.query_mock.assert_called_once_with(load['requestBody'],
                                            load['pageSize'])
    arg = self.finish_mock.call_args[0][0]
    self.assertEqual(arg['id'], json.dumps(job_id))
    self.assertEqual(arg['error'], json.dumps(None))
    args = fake_app_log.call_args[0]
    self.assertEqual(args[0], INFO)
    self.assertEqual(args[2], job_id)

  @patch.object(app_log, 'log')
  def test_start_error(self, fake_app_log):

    load = {'requestBody': 'requestBody', 'pageSize': 10}

    # test error
    err = Exception()

    def err_gen():
      raise err
      yield None

    self.query_mock.return_value = err_gen()
    self.dummy_pagedAPI._onStart(load)
    arg = self.finish_mock.call_args[0][0]
    self.assertEqual(arg['id'], json.dumps(None))
    self.assertEqual(arg['error'], json.dumps(str(err)))
    args = fake_app_log.call_args[0]
    self.assertEqual(args[0], WARN)
    self.assertEqual(args[2], str(err))


class TestPagedHandlerContinue(unittest.TestCase):

  @patch("jupyterlab_bigquery.pagedAPI_handler.PagedAPIHandler.__init__",
         autospec=True,
         return_value=None)
  def setUp(self, fake_super):
    self.dummy_pagedAPI = DummyPageAPI(None, None)
    self.finish_mock = MagicMock()
    self.dummy_pagedAPI.finish = self.finish_mock

  def tearDown(self):
    PagedAPIHandler.generator_pool.clear()

  @patch.object(time, 'time', return_value=1)
  @patch.object(app_log, 'log')
  def test_normal(self, fake_app_log, fake_time):
    job_id = 'fake_job_id'
    time1 = 0
    res = 'res'
    job_obj = Mock()

    def normal_gen():
      yield res

    gen = normal_gen()

    self.dummy_pagedAPI.generator_pool[job_id] = gen, job_obj, time1
    self.dummy_pagedAPI._onContinue({'id': job_id})

    # test time update
    updated_gen, updated_job_obj, updated_time\
      = self.dummy_pagedAPI.generator_pool[job_id]
    self.assertEqual(updated_gen, gen)
    self.assertEqual(updated_job_obj, job_obj)
    self.assertLess(time1, updated_time)
    self.assertEqual(1, updated_time)

    # test app log
    fake_app_log.assert_not_called()

    # test finish
    finish_args = self.finish_mock.call_args[0][0]
    self.assertEqual(finish_args['finish'], json.dumps(False))
    self.assertEqual(finish_args['load'], json.dumps(res))
    self.assertEqual(finish_args['error'], json.dumps(None))

  @patch.object(app_log, 'log')
  def test_exception(self, fake_app_log):
    job_id = 'fake_job_id'
    time1 = 0
    res = 'res'
    job_obj = Mock()
    err = Exception()

    def err_gen():
      raise err
      yield res

    gen = err_gen()

    self.dummy_pagedAPI.generator_pool[job_id] = gen, job_obj, time1
    self.dummy_pagedAPI._onContinue({'id': job_id})

    # test app log
    log_args = fake_app_log.call_args[0]
    self.assertEqual(log_args[0], WARN)
    self.assertEqual(log_args[2], str(job_id))
    self.assertEqual(log_args[3], str(err))

    # test finish
    finish_args = self.finish_mock.call_args[0][0]
    self.assertEqual(finish_args['finish'], json.dumps(True))
    self.assertEqual(finish_args['load'], json.dumps([]))
    self.assertEqual(finish_args['error'], json.dumps(str(err)))

  @patch.object(app_log, 'log')
  def test_last(self, fake_app_log):
    job_id = 'fake_job_id'
    time1 = 0
    job_obj = Mock()

    def normal_gen():
      yield None

    gen = normal_gen()
    next(gen)

    self.dummy_pagedAPI.generator_pool[job_id] = gen, job_obj, time1
    self.dummy_pagedAPI._onContinue({'id': job_id})

    # test deleted job
    val = self.dummy_pagedAPI.generator_pool[job_id]
    self.assertIsNone(val)

    # test app log
    log_args = fake_app_log.call_args[0]
    self.assertEqual(log_args[0], INFO)
    self.assertEqual(log_args[2], str(job_id))

    # test finish
    finish_args = self.finish_mock.call_args[0][0]
    self.assertEqual(finish_args['finish'], json.dumps(True))
    self.assertEqual(finish_args['load'], json.dumps([]))
    self.assertEqual(finish_args['error'], json.dumps(None))

  @patch.object(app_log, 'log')
  def test_already_ended(self, fake_app_log):
    job_id = 'fake_job_id'
    time1 = 0
    job_obj = Mock()

    def normal_gen():
      yield None

    gen = normal_gen()
    next(gen)

    self.dummy_pagedAPI.generator_pool[job_id] = gen, job_obj, time1
    self.dummy_pagedAPI._onContinue({'id': job_id})
    fake_app_log.reset_mock()
    self.dummy_pagedAPI._onContinue({'id': job_id})

    # test deleted job
    val = self.dummy_pagedAPI.generator_pool[job_id]
    self.assertIsNone(val)

    # test app log
    fake_app_log.assert_not_called()

    # test finish
    finish_args = self.finish_mock.call_args[0][0]
    self.assertEqual(finish_args['finish'], json.dumps(True))
    self.assertEqual(finish_args['load'], json.dumps([]))
    self.assertEqual(finish_args['error'], json.dumps(None))


class TestPagedHandlerContinueCancel(unittest.TestCase):

  @patch("jupyterlab_bigquery.pagedAPI_handler.PagedAPIHandler.__init__",
         autospec=True,
         return_value=None)
  def setUp(self, fake_super):
    self.dummy_pagedAPI = DummyPageAPI(None, None)
    self.finish_mock = MagicMock()
    self.dummy_pagedAPI.finish = self.finish_mock
    self.cancel_mock = MagicMock()
    self.dummy_pagedAPI.cancel = self.cancel_mock

  def tearDown(self):
    PagedAPIHandler.generator_pool.clear()

  @patch.object(app_log, 'log')
  def test_first_cancel(self, fake_app_log):
    job_id = 'fake_job_id'
    time1 = 0
    job_obj = Mock()

    def normal_gen():
      yield None

    gen = normal_gen()

    self.dummy_pagedAPI.generator_pool[job_id] = gen, job_obj, time1
    self.dummy_pagedAPI._onCancel({'id': job_id})

    # test deleted job
    val = self.dummy_pagedAPI.generator_pool[job_id]
    self.assertIsNone(val)

    # test app log
    log_args = fake_app_log.call_args[0]
    self.assertEqual(log_args[0], INFO)
    self.assertEqual(log_args[2], str(job_id))

    # test finish
    finish_args = self.finish_mock.call_args[0][0]
    self.assertEqual(finish_args['id'], json.dumps(job_id))
    self.assertEqual(finish_args['error'], json.dumps(None))

    # ensure cancel called
    self.cancel_mock.assert_called_with(job_obj)

  @patch.object(app_log, 'log')
  def test_already_cancel(self, fake_app_log):
    job_id = 'fake_job_id'

    self.dummy_pagedAPI._onCancel({'id': job_id})

    # test deleted job
    val = self.dummy_pagedAPI.generator_pool[job_id]
    self.assertIsNone(val)

    # test app log
    fake_app_log.assert_not_called()

    # test finish
    finish_args = self.finish_mock.call_args[0][0]
    self.assertEqual(finish_args['id'], json.dumps(job_id))
    self.assertEqual(finish_args['error'], json.dumps('job not found'))

    # ensure cancel not called
    self.cancel_mock.assert_not_called()


class TestPagedHandlerClearGenerators(unittest.TestCase):

  @patch("jupyterlab_bigquery.pagedAPI_handler.PagedAPIHandler.__init__",
         autospec=True,
         return_value=None)
  def setUp(self, fake_super):
    self.dummy_pagedAPI = DummyPageAPI(None, None)
    self.cancel_mock = MagicMock()
    self.dummy_pagedAPI.cancel = self.cancel_mock

  def tearDown(self):
    PagedAPIHandler.generator_pool.clear()

  @patch.object(time, 'time', return_value=CLEAR_GENERATORS_MAX_IDILE_SEC - 1)
  @patch.object(app_log, 'log')
  def test_not_delete_generators(self, fake_app_log, fake_time):
    job_id = 'fake_job_id'
    time1 = 0
    job_obj = Mock()

    def normal_gen():
      yield None

    gen = normal_gen()

    self.dummy_pagedAPI.generator_pool[job_id] = gen, job_obj, time1
    self.dummy_pagedAPI.clear_generators()

    # check generator not cleared
    val = self.dummy_pagedAPI.generator_pool[job_id]
    self.assertIsNotNone(val)

    # check log
    fake_app_log.assert_not_called()

    # ensure cancel not called
    self.cancel_mock.assert_not_called()

  @patch.object(time, 'time', return_value=CLEAR_GENERATORS_MAX_IDILE_SEC + 1)
  @patch.object(app_log, 'log')
  def test_delete_generators(self, fake_app_log, fake_time):
    job_id = 'fake_job_id'
    time1 = 0
    job_obj = Mock()

    def normal_gen():
      yield None

    gen = normal_gen()

    self.dummy_pagedAPI.generator_pool[job_id] = gen, job_obj, time1
    self.dummy_pagedAPI.clear_generators()

    # check generator cleared
    val = self.dummy_pagedAPI.generator_pool[job_id]
    self.assertIsNone(val)

    # check log
    log_args = fake_app_log.call_args[0]

    # ensure cancel called
    self.cancel_mock.assert_called_with(job_obj)
