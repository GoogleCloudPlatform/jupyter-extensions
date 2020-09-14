import time
from logging import INFO, WARN
import json
from threading import Lock, Timer
from collections import defaultdict
from abc import ABC, abstractmethod
from notebook.base.handlers import APIHandler, app_log

START_STATE = 'start'
CONTINUE_STATE = 'continue'
CANCEL_STATE = 'cancel'

CLEAR_GENERATORS_INTERVAL_SEC = 10
CLEAR_GENERATORS_MAX_IDILE_SEC = 1200


class PagedAPIHandler(APIHandler, ABC):
  '''
    Enables easy to use paged/batched API requests between front end
    and backend.  User needs to implement query and cancel to provide
    a generator and the ability to cancel a job (if necessary).
    Exceptions can be safely raised from these method,
    they will will be sent to front end.
  '''

  # job_id: (generator, job_obj, last_touch), remove after done
  generator_pool = defaultdict(lambda: None)
  generator_lock = Lock()

  def __init__(self, application, request, **kwargs):
    super().__init__(application, request, **kwargs)

    # clear generators periodically
    Timer(CLEAR_GENERATORS_INTERVAL_SEC, self.clear_generators)

  def clear_generators(self):
    with PagedAPIHandler.generator_lock:
      job_ids_to_delete = []

      for job_id, (generator, job_obj,
                   last_touch) in PagedAPIHandler.generator_pool.items():
        idle_time = time.time() - last_touch
        if idle_time >= CLEAR_GENERATORS_MAX_IDILE_SEC:
          self.cancel(job_obj)
          job_ids_to_delete.append(job_id)
          del generator
          app_log.log(INFO, 'Deleted {} due to long idle time {}', job_id,
                      idle_time)

      for job_id in job_ids_to_delete:
        del PagedAPIHandler.generator_pool[job_id]

  def post(self, *args, **kwargs):
    '''
      Entry point for API. Handles start, continue, and cancel.
    '''
    post_body = self.get_json_body()

    intention = post_body['intention']
    load = post_body['load']

    if intention == START_STATE:
      self._onStart(load)
    elif intention == CONTINUE_STATE:
      self._onContinue(load)
    elif intention == CANCEL_STATE:
      self._onCancel(load)

  def _onStart(self, load):
    request_body = load['requestBody']
    page_size = load['pageSize']
    query_generator = self.query(request_body, page_size)

    job_id = None
    error = None
    try:
      val = next(query_generator)
      job, job_id = val
    except Exception as err:
      error = str(err)
      app_log.log(WARN, 'Failed started query: %s', error)

    if error is None:
      with PagedAPIHandler.generator_lock:
        PagedAPIHandler.generator_pool[
            job_id] = query_generator, job, time.time()
        app_log.log(INFO, 'Successfully started query %s', job_id)

    self.finish({'id': job_id, 'error': error})

  def _onContinue(self, load):
    job_id = load['id']
    query_generator = None

    with self.generator_lock:
      val = PagedAPIHandler.generator_pool[job_id]
      if val is not None:
        query_generator, job_obj, _ = val
        PagedAPIHandler.generator_pool[job_id]\
          = query_generator, job_obj, time.time()

    finish = False
    load = []
    error = None
    if query_generator is None:
      finish = True
    else:
      try:
        load = next(query_generator)
      except StopIteration:
        finish = True
        with PagedAPIHandler.generator_lock:
          del PagedAPIHandler.generator_pool[job_id]
        app_log.log(INFO, 'Successfully finished query %s', job_id)
      except Exception as err:
        finish = True
        error = str(err)
        with PagedAPIHandler.generator_lock:
          del PagedAPIHandler.generator_pool[job_id]
        app_log.log(WARN, 'Failed continue fetching for query %s: %s', job_id,
                    error)

    self.finish({
        'finish': finish,
        'load': load,
        'error': error,
    })

  def _onCancel(self, load):
    job_id = load['id']
    error = 'job not found'

    with PagedAPIHandler.generator_lock:
      val = PagedAPIHandler.generator_pool[job_id]
      if val is not None:
        _, job, _ = val
        self.cancel(job)
        del PagedAPIHandler.generator_pool[job_id]
        app_log.log(INFO, 'Successfully canceled query %s', job_id)
        error = None

    self.finish({'id': job_id, 'error': error})

  @abstractmethod
  def query(self, request_body, page_size):
    '''
      User imeplemented generator.
      Follow this rules:
      1, first return is (job_object, id).  job_object is sent to
          cancel when canceling job. id is a unique identifier.
          Safe to throw exception, will pass to front end
          https://googleapis.dev/python/bigquery/latest/_modules/google/cloud/bigquery/job.html
      2, following return are the results
    '''
    raise NotImplementedError

  def cancel(self, job):
    '''
      job is the job object in the first yield of query.
    '''
    pass
