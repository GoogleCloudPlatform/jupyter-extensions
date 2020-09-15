# Lint as: python3
"""Request handler classes for the extensions."""

import base64
import math
import datetime
from notebook.base.handlers import APIHandler, app_log
from google.cloud import bigquery
from google.api_core.client_info import ClientInfo
import tornado.gen as gen
from jupyterlab_bigquery.version import VERSION

SCOPE = ("https://www.googleapis.com/auth/cloud-platform",)


def create_bigquery_client():
  return bigquery.Client(client_info=ClientInfo(
      user_agent='jupyterlab_gcpextension/jupyterlab_bigquery-{}'.format(
          VERSION)))


def format_value(value):
  '''Formats non-string values so they can be properly displayed.'''
  if value is None:
    return None
  elif isinstance(value, bytes):
    return base64.b64encode(value).__str__()[2:-1]
  elif isinstance(value, float):
    if value == float('inf'):
      return 'Infinity'
    elif value == float('-inf'):
      return '-Infinity'
    elif math.isnan(value):
      return 'NaN'
    else:
      return value
  elif isinstance(value, datetime.datetime):
    return value.isoformat().__str__()
  else:
    return value.__str__()


def get_table(client, tableRef):
  '''Gets a table ID from a particular table ref.'''
  try:
    table_id = client.get_table(tableRef).id
    return table_id
  except:
    return 'Expired temporary table'


def list_jobs(client, project, lastFetchTime=None):
  '''Returns all jobs that have type 'query' in chronological order.'''
  if lastFetchTime is None:
    jobs = list(client.list_jobs(project))
  else:
    min_creation_time = datetime.datetime.fromtimestamp(lastFetchTime)
    jobs = list(client.list_jobs(project, min_creation_time=min_creation_time))

  jobs_list = {}
  job_ids = []
  for job in jobs:
    if job.job_type != 'query':
      continue
    jobs_list[job.job_id] = {
        'query': job.query,
        'id': job.job_id,
        'created': job.created.isoformat().__str__(),
        'errored': bool(job.errors)
    }
    job_ids.append(job.job_id)

  cur_time = datetime.datetime.utcnow().timestamp()
  return {'jobs': jobs_list, 'jobIds': job_ids, 'lastFetchTime': cur_time}


def get_job_details(client, job_id):
  '''Returns details about a specific job.'''
  job = client.get_job(job_id)

  job_details = {
      'query': job.query,
      'id': job_id,
      'user': job.user_email,
      'location': job.location,
      'created': format_value(job.created),
      'started': format_value(job.started),
      'ended': format_value(job.ended),
      'duration': (job.ended - job.started).total_seconds(),
      'bytesProcessed': job.estimated_bytes_processed,
      'priority': job.priority,
      'destination': get_table(client, job.destination),
      'useLegacySql': job.use_legacy_sql,
      'state': job.state,
      'errors': job.errors,
      'errorResult': job.error_result,
      'from_cache': job.cache_hit,
      'project': job.project,
  }

  return job_details


class QueryHistoryHandler(APIHandler):
  """Handles requests for query history."""
  bigquery_client = None

  def __init__(self, application, request, **kwargs):
    super().__init__(application, request, **kwargs)

    if QueryHistoryHandler.bigquery_client is None:
      QueryHistoryHandler.bigquery_client = bigquery.Client(
          client_info=ClientInfo(
              user_agent='jupyterlab_gcpextension/jupyterlab_bigquery-{}'.
              format(VERSION)))

  @gen.coroutine
  def post(self, *args, **kwargs):
    try:
      post_body = self.get_json_body()

      if 'lastFetchTime' in post_body:
        self.finish(
            list_jobs(QueryHistoryHandler.bigquery_client,
                      post_body['projectId'], post_body['lastFetchTime']))
      else:
        self.finish(
            list_jobs(QueryHistoryHandler.bigquery_client,
                      post_body['projectId']))

    except Exception as e:
      app_log.exception(str(e))
      self.set_status(500, str(e))
      self.finish({'error': {'message': str(e)}})


class GetQueryDetailsHandler(APIHandler):
  """Handles requests for details of a specific past query."""
  bigquery_client = None

  def __init__(self, application, request, **kwargs):
    super().__init__(application, request, **kwargs)

    if GetQueryDetailsHandler.bigquery_client is None:
      GetQueryDetailsHandler.bigquery_client = bigquery.Client(
          client_info=ClientInfo(
              user_agent='jupyterlab_gcpextension/jupyterlab_bigquery-{}'.
              format(VERSION)))

  @gen.coroutine
  def post(self, *args, **kwargs):
    try:
      post_body = self.get_json_body()

      self.finish(
          get_job_details(GetQueryDetailsHandler.bigquery_client,
                          post_body['jobId']))

    except Exception as e:
      app_log.exception(str(e))
      self.set_status(500, str(e))
      self.finish({'error': {'message': str(e)}})
