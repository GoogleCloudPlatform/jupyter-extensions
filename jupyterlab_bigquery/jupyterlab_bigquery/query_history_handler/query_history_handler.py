# Lint as: python3
"""Request handler classes for the extensions."""

import base64
import json
import re
import tornado.gen as gen
import os
import math

import json
import datetime

from collections import namedtuple
from notebook.base.handlers import APIHandler, app_log
from google.cloud import bigquery

from jupyterlab_bigquery.version import VERSION

SCOPE = ("https://www.googleapis.com/auth/cloud-platform",)

def create_bigquery_client():
  return bigquery.Client()

def format_value(value):
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
    return json.dumps(value.strftime('%b %e, %G, %l:%M:%S %p'))[1:-1]
  else:
    return value.__str__()

def get_table(client, tableRef):
  try:
    table_id = client.get_table(tableRef).id
    return table_id
  except:
    return 'Expired temporary table'

def list_jobs(client, project):
  jobs = list(client.list_jobs(project))

  jobs_list = {}
  job_ids = {}
  for job in jobs:
    if job.job_type != 'query':
      continue
    jobs_list[job.job_id] = {
        'query': job.query,
        'id': job.job_id,
        'created': format_value(job.created),
        'time': json.dumps(job.created.strftime('%l:%M %p'))[1:-1],
        'errored': True if job.errors else False
    }
    curr_date = json.dumps(job.created.strftime('%-m/%-d/%y'))[1:-1]
    if curr_date in job_ids:
      job_ids[curr_date].append(job.job_id)
    else:
      job_ids[curr_date] = [job.job_id]

  return {'jobs': jobs_list, 'jobIds': job_ids}

def get_job_details(client, job_id):
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
  """Handles requests for view details."""
  bigquery_client = None

  @gen.coroutine
  def post(self, *args, **kwargs):
    try:
      self.bigquery_client = create_bigquery_client()
      post_body = self.get_json_body()

      self.finish(list_jobs(self.bigquery_client, post_body['projectId']))

    except Exception as e:
      app_log.exception(str(e))
      self.set_status(500, str(e))
      self.finish({'error': {'message': str(e)}})

class GetQueryDetailsHandler(APIHandler):
  """Handles requests for table metadata."""
  bigquery_client = None

  @gen.coroutine
  def post(self, *args, **kwargs):
    try:
      self.bigquery_client = create_bigquery_client()
      post_body = self.get_json_body()

      self.finish(get_job_details(self.bigquery_client, post_body['jobId']))

    except Exception as e:
      app_log.exception(str(e))
      self.set_status(500, str(e))
      self.finish({'error': {'message': str(e)}})