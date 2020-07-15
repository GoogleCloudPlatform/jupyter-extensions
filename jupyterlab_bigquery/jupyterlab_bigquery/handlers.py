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

# import google.auth
# from google.auth.exceptions import GoogleAuthError
# from google.auth.transport.requests import Request

from jupyterlab_bigquery.version import VERSION

SCOPE = ("https://www.googleapis.com/auth/cloud-platform",)


def create_bigquery_client():
  return bigquery.Client()


def list_projects(client):
  project = client.project
  projects_list = [{
      'id': format(project),
      'name': format(project),
      'datasets': list_datasets(client, project),
  }]
  return {'projects': projects_list}


def list_datasets(client, project):
  datasets = list(client.list_datasets())

  datasetsList = []
  for dataset in datasets:
    dataset_id = dataset.dataset_id
    currDataset = client.get_dataset(dataset_id)

    datasetsList.append({
        'id': '{}.{}'.format(dataset.project, dataset.dataset_id),
        'name': dataset.dataset_id,
        'tables': list_tables(client, currDataset),
        'models': list_models(client, currDataset),
    })
  return datasetsList


def list_tables(client, dataset):
  tables = list(client.list_tables(dataset))

  return [{
      'id': '{}.{}'.format(table.dataset_id, table.table_id),
      'name': table.table_id
  } for table in tables]


def list_models(client, dataset):
  models = list(client.list_models(dataset))
  return [{
      'id': '{}.{}'.format(model.dataset_id, model.model_id),
      'name': model.model_id,
  } for model in models]


def get_dataset_details(client, dataset_id):
  dataset = client.get_dataset(dataset_id)
  return {
      'details': {
          'id': "{}.{}".format(dataset.project, dataset.dataset_id),
          'name': dataset.dataset_id,
          'description': dataset.description,
          'labels': ["\t{}: {}".format(label, value) for label, value in dataset.labels.items()] if dataset.labels else None,
          'date_created': json.dumps(dataset.created.strftime('%b %e, %G, %l:%M:%S %p'))[1:-1],
          'default_expiration': dataset.default_table_expiration_ms,
          'location': dataset.location,
          'last_modified': json.dumps(dataset.modified.strftime('%b %e, %G, %l:%M:%S %p'))[1:-1],
          'project': dataset.project,
          'link': dataset.self_link
      }
  }

def format_detail_schema(schema):
  formatted_schema = []
  for field in schema:
    formatted_schema.append({
        'name': field.name,
        'type': field.field_type,
        'description': field.description,
        'mode': field.mode
      })
    if field.field_type == 'RECORD':
      for record_entry in field.fields:
        formatted_schema.append({
          'name': "{}.{}".format(field.name, record_entry.name),
          'type': record_entry.field_type,
          'description': record_entry.description,
          'mode': record_entry.mode
        })
  return formatted_schema
    

def get_table_details(client, table_id):
  table = client.get_table(table_id)
  return {
      'details': {
          'id': "{}.{}.{}".format(table.project, table.dataset_id, table.table_id),
          'name': table.table_id,
          'description': table.description,
          'labels': ["\t{}: {}".format(label, value) for label, value in table.labels.items()] if table.labels else None,
          'date_created': json.dumps(table.created.strftime('%b %e, %G, %l:%M:%S %p'))[1:-1],
          'expires': json.dumps(table.expires.strftime('%b %e, %G, %l:%M:%S %p'))[1:-1] if table.expires else None,
          'location': table.location,
          'last_modified': json.dumps(table.modified.strftime('%b %e, %G, %l:%M:%S %p'))[1:-1],
          'project': table.project,
          'dataset': table.dataset_id,
          'link': table.self_link,
          'num_rows': table.num_rows,
          'num_bytes': table.num_bytes,
          'schema': format_detail_schema(table.schema)
      }
  }

def format_preview_fields(schema):
  formatted_fields = []
  for field in schema:
    if field.field_type == 'RECORD':
      for record_entry in field.fields:
        formatted_fields.append("{}.{}".format(field.name, record_entry.name))
    else:
      formatted_fields.append(field.name)

  return formatted_fields

def format_preview_row(row):
  formatted_row = []
  for value in row.values():
    if isinstance(value, bytes):
      formatted_row.append(base64.b64encode(value).__str__()[2:-1])

    elif isinstance(value, dict):
      for sub_value in value.values():
        formatted_row.append(sub_value)

    elif isinstance(value, float):
      if value == float('inf'):
        formatted_row.append('Infinity')
      elif value == float('-inf'):
        formatted_row.append('-Infinity')
      elif math.isnan(value):
        formatted_row.append('NaN')
      else:
        formatted_row.append(value.__str__())

    elif isinstance(value, datetime.datetime):
      formatted_row.append(json.dumps(value.strftime('%Y-%m-%d %H:%M:%S.%f %Z'))[1:-1])

    else:
      formatted_row.append(value.__str__())

  return formatted_row
  
def get_table_preview(client, table_id):
  table = client.get_table(table_id)
  rows = client.list_rows(table, max_results=100)
  return {
    'fields': format_preview_fields(rows.schema),
    'rows': [format_preview_row(row) for row in rows]
  }

class ListHandler(APIHandler):
  """Handles requests for Dummy List of Items."""
  bigquery_client = None

  @gen.coroutine
  def post(self, *args, **kwargs):
    try:
      self.bigquery_client = create_bigquery_client()
      self.finish(list_projects(self.bigquery_client))

    except Exception as e:
      app_log.exception(str(e))
      self.set_status(500, str(e))
      self.finish({
          'error': {
              'message': str(e)
          }
      })


class DatasetDetailsHandler(APIHandler):
  """Handles requests for dataset metadata."""
  bigquery_client = None

  @gen.coroutine
  def post(self, *args, **kwargs):
    try:
      self.bigquery_client = create_bigquery_client()
      post_body = self.get_json_body()

      self.finish(get_dataset_details(self.bigquery_client, post_body['datasetId']))

    except Exception as e:
      app_log.exception(str(e))
      self.set_status(500, str(e))
      self.finish({
          'error': {
              'message': str(e)
          }
      })


class TableDetailsHandler(APIHandler):
  """Handles requests for table metadata."""
  bigquery_client = None
  
  def post(self, *args, **kwargs):
    try:
      self.bigquery_client = create_bigquery_client()
      post_body = self.get_json_body()

      self.finish(get_table_details(self.bigquery_client, post_body['tableId']))

    except Exception as e:
      app_log.exception(str(e))
      self.set_status(500, str(e))
      self.finish({
          'error': {
              'message': str(e)
          }
      })

class TablePreviewHandler(APIHandler):
  """"Handles request for table preview."""
  bigquery_client = None

  @gen.coroutine
  def post(self, *args, **kwargs):
    try:
      self.bigquery_client = create_bigquery_client()
      post_body = self.get_json_body()

      self.finish(get_table_preview(self.bigquery_client, post_body['tableId']))

    except Exception as e:
      app_log.exception(str(e))
      self.set_status(500, str(e))
      self.finish({
          'error': {
              'message': str(e)
          }
      })
