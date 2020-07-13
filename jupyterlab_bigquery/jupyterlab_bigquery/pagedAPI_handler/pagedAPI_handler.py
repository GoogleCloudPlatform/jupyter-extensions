from enum import Enum
from notebook.base.handlers import APIHandler, app_log
from logging import INFO, WARN
import json
from threading import Lock
from collections import deque, defaultdict
from abc import ABC, abstractmethod

START_STATE = 'start'
CONTINUE_STATE = 'continue'
CANCEL_STATE = 'cancel'

class PagedAPIHandler(APIHandler, ABC):
  '''
    Enables easy to use paged/batched API requests between front end and backend.
    User needs to implement query and cancel to provide a generator and the ability
    to cancel a job (if necessary).  Exceptions can be safely raised from these method,
    they will will be sent to front end.
  '''

  # job_id: deque[(generator, job_obj)], remove after done
  generator_pool = defaultdict(lambda: None)
  generator_lock = Lock()

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

      id = None
      error = None
      try:
        job, id = next(query_generator)
      except Exception as err:
        error = str(err)
        app_log.log(WARN, 'Failed started query: %s', error)
      
      if error is None:
        with PagedAPIHandler.generator_lock:
          PagedAPIHandler.generator_pool[id] = query_generator, job
          app_log.log(INFO, 'Successfully started query %s', id)

      self.finish({'id': json.dumps(id), 'error': json.dumps(error)})

  def _onContinue(self, load):
    id = load['id']
    query_generator = None

    with self.generator_lock:
        val = PagedAPIHandler.generator_pool[id]
        if val is not None:
          query_generator, _ = val

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
              del PagedAPIHandler.generator_pool[id]
          app_log.log(INFO, 'Successfully finished query %s', id)
        except Exception as err:
          finish = True
          error = str(err)
          with PagedAPIHandler.generator_lock:
              del PagedAPIHandler.generator_pool[id]
          app_log.log(WARN, 'Failed continue fetching for query %s: %s', id, error)
    
    self.finish({
        'finish': json.dumps(finish),
        'load': json.dumps(load),
        'error': json.dumps(error)
    })

  def _onCancel(self, load):
    id = load['id']
    error = 'job not found'

    with PagedAPIHandler.generator_lock:
      val = PagedAPIHandler.generator_pool[id]
      if val is not None:
        _, job = val
        self.cancel(job)
        del PagedAPIHandler.generator_pool[id]
        app_log.log(INFO, 'Successfully canceled query %s', id)
        error = None

    self.finish({'id': json.dumps(id), 'error': json.dumps(error)})

  @abstractmethod
  def query(self, request_body, page_size):
    '''
      User imeplemented generator.
      Follow this rules:
      1, first return is (job_object, id).  job_object is sent to cancel when canceling job.
          id is a unique identifier.  Safe to throw exception, will pass to front end
          https://googleapis.dev/python/bigquery/latest/_modules/google/cloud/bigquery/job.html
      2, following return are the results
    '''
    raise NotImplementedError
    
  def cancel(self, job):
    '''
      job is the job object in the first yield of query.
    '''
    pass
