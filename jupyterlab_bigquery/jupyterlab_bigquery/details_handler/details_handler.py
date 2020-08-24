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
from google.cloud.bigquery.enums import StandardSqlDataTypes, SqlTypeNames
from google.cloud.bigquery_v2.gapic.enums import Model
from google.protobuf.wrappers_pb2 import DoubleValue, BoolValue

from jupyterlab_bigquery.version import VERSION
from multiprocessing import Pool
from functools import partial


SCOPE = ("https://www.googleapis.com/auth/cloud-platform",)


def create_bigquery_client():
  return bigquery.Client()

def format_date(date):
  return date.isoformat().__str__()

def get_dataset_details(client, dataset_id):
  dataset = client.get_dataset(dataset_id)
  return {
      'details': {
          'id':
              "{}.{}".format(dataset.project, dataset.dataset_id),
          'name':
              dataset.dataset_id,
          'description':
              dataset.description,
          'labels': [
              "{}: {}".format(label, value)
              for label, value in dataset.labels.items()
          ] if dataset.labels else None,
          'date_created':
              format_date(dataset.created),
          'default_expiration':
              dataset.default_table_expiration_ms,
          'location':
              dataset.location,
          'last_modified':
              format_date(dataset.modified),
          'project':
              dataset.project,
          'link':
              dataset.self_link
      }
  }


def format_detail_field(formatted_schema, field, field_name):
  if field.field_type == 'RECORD':
    formatted_schema.append({
        'name': field_name + field.name,
        'type': 'RECORD',
        'description': field.description,
        'mode': field.mode
    })
    for sub_field in field.fields:
      format_detail_field(formatted_schema, sub_field,
                          field_name + field.name + '.')
  else:
    formatted_schema.append({
        'name': field_name + field.name,
        'type': field.field_type,
        'description': field.description,
        'mode': field.mode
    })


def format_detail_schema(schema):
  formatted_schema = []
  for field in schema:
    format_detail_field(formatted_schema, field, '')
  return formatted_schema


def get_table_details(client, table_id):
  table = client.get_table(table_id)
  return {
      'details': {
          'id':
              "{}.{}.{}".format(table.project, table.dataset_id,
                                table.table_id),
          'name':
              table.table_id,
          'description':
              table.description,
          'labels': [
              "{}: {}".format(label, value)
              for label, value in table.labels.items()
          ] if table.labels else None,
          'date_created':
              format_date(table.created),
          'expires':
              format_date(table.expires) if table.expires else None,
          'location':
              table.location,
          'last_modified':
              format_date(table.modified),
          'project':
              table.project,
          'dataset':
              table.dataset_id,
          'link':
              table.self_link,
          'num_rows':
              table.num_rows,
          'num_bytes':
              table.num_bytes,
          'schema':
              format_detail_schema(table.schema)
      }
  }


def format_preview_field(formatted_fields, field, field_name):
  if field.field_type == 'RECORD':
    if field.mode == 'REPEATED':
      formatted_fields.append(field.name)
    else:
      for record_entry in field.fields:
        format_preview_field(formatted_fields, record_entry,
                             field_name + field.name + ".")
  else:
    formatted_fields.append(field_name + field.name)


def format_preview_fields(schema):
  formatted_fields = []
  for field in schema:
    format_preview_field(formatted_fields, field, '')
  return formatted_fields


def format_preview_value(value):
  if value is None:
    return None
  elif isinstance(value, (DoubleValue, BoolValue)):
    return format_preview_value(value.value)
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
    return json.dumps(value.strftime('%Y-%m-%d %H:%M:%S.%f %Z'))[1:-1]
  else:
    return value.__str__()


def get_table_preview(client, table_id):
  table = client.get_table(table_id)
  rows = client.list_rows(table, max_results=100)
  fields = rows.schema

  return {
      'fields': format_preview_fields(fields),
      'rows': format_preview_rows(rows, fields)
  }


def get_view_details(client, view_id):
  view = client.get_table(view_id)

  return {
      'details': {
          'id':
              "{}.{}.{}".format(view.project, view.dataset_id, view.table_id),
          'query':
              view.view_query,
          'name':
              view.table_id,
          'description':
              view.description,
          'labels': [
              "{}: {}".format(label, value)
              for label, value in view.labels.items()
          ] if view.labels else None,
          'date_created':
              format_date(view.created),
          'last_modified':
              format_date(view.modified),
          'expires':
              format_date(view.expires) if view.expires else None,
          'project':
              view.project,
          'dataset':
              view.dataset_id,
          'link':
              view.self_link,
          'schema':
              format_detail_schema(view.schema),
          'legacy_sql': view.view_use_legacy_sql
      }
  }


def get_model_details(client, model_id):
  model = client.get_model(model_id)

  return {
      'details': {
          'id':
              "{}.{}.{}".format(model.project, model.dataset_id,
                                model.model_id),
          'name':
              model.model_id,
          'description':
              model.description,
          'labels': [
              "{}: {}".format(label, value)
              for label, value in model.labels.items()
          ] if model.labels else None,
          'date_created':
              format_date(model.created),
          'last_modified':
              format_date(model.modified),
          'expires':
              format_date(model.expires) if model.expires else None,
          'location':
              model.location,
          'model_type':
              Model.ModelType(model.model_type).name,
          'schema_labels': [
              {'name': label_col.name, 'type': SqlTypeNames[StandardSqlDataTypes(label_col.type.type_kind).name].name} for label_col in model.label_columns
          ],
          'feature_columns': [
              {'name': feat_col.name, 'type': SqlTypeNames[StandardSqlDataTypes(feat_col.type.type_kind).name].name} for feat_col in model.feature_columns
          ],
          'training_runs': [format_date(datetime.datetime.fromtimestamp(run.start_time.seconds)) for run in model.training_runs]
      }
  }

def get_training_run_details(client, model_id, run_index):
  model = client.get_model(model_id)
  options = model.training_runs[run_index].training_options

  details = {}

  if model.training_runs[run_index].results:
    details['actual_iterations'] = len(model.training_runs[run_index].results)

  for field in options.ListFields():
    field_name = field[0].name
    value = field[1]
    if field_name == 'data_split_method':
      details[field_name] = Model.DataSplitMethod(value).name
    elif field_name == 'distance_type':
      details[field_name] = Model.DistanceType(value).name
    elif field_name == 'learn_rate_strategy':
      details[field_name] = Model.LearnRateStrategy(value).name
    elif field_name == 'loss_type':
      details[field_name] = Model.LossType(value).name
    elif field_name == 'optimization_strategy':
      details[field_name] = Model.OptimizationStrategy(value).name
    elif field_name == 'kmeans_initialization_method':
      details[field_name] = Model.KmeansEnums.KmeansInitializationMethod(value).name
    else:
      details[field_name] = format_preview_value(value)

  return {
    'details': details
  }

def format_preview_rows(rows, fields):
  formatted_rows = []
  for row in rows:
    formatted_row = []
    for i in range(len(fields)):
      check_repeated(row[i], fields[i], formatted_row)
    formatted_rows.append(formatted_row)
  return formatted_rows


def parallel_format_preview_rows(rows, fields, num_threads=6, pool=None):
  m_parallel_format_row = partial(parallel_format_row, fields=fields)
  if pool is None:
    with Pool(num_threads) as pool:
      formatted_rows = pool.map(m_parallel_format_row, [dict(row) for row in rows])
  else:
    formatted_rows = pool.map(m_parallel_format_row, [dict(row) for row in rows])
  return formatted_rows

def parallel_format_row(row, fields):
  formatted_row = []
    
  for field in fields:
    name = field.name
    check_repeated(row[name], field, formatted_row)
  return formatted_row

def check_repeated(value, field, formatted_row):
  if field.mode == 'REPEATED':
    formatted_row.append(json.dumps(value, default=format_preview_value))
  else:
    handle_records(value, field, formatted_row)


def handle_records(value, field, formatted_row):
  if field.field_type == 'RECORD':
    if value is None:
      for sub_field in field.fields:
        handle_records(None, sub_field, formatted_row)
    else:
      for sub_field in field.fields:
        if value[sub_field.name]:
          check_repeated(value[sub_field.name], sub_field, formatted_row)
        else:
          handle_records(None, sub_field, formatted_row)
  else:
    formatted_row.append(format_preview_value(value))


class DatasetDetailsHandler(APIHandler):
  """Handles requests for dataset metadata."""
  bigquery_client = None

  @gen.coroutine
  def post(self, *args, **kwargs):
    try:
      self.bigquery_client = create_bigquery_client()
      post_body = self.get_json_body()

      self.finish(
          get_dataset_details(self.bigquery_client, post_body['datasetId']))

    except Exception as e:
      app_log.exception(str(e))
      self.set_status(500, str(e))
      self.finish({'error': {'message': str(e)}})


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
      self.finish({'error': {'message': str(e)}})


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
      self.finish({'error': {'message': str(e)}})


class ViewDetailsHandler(APIHandler):
  """Handles requests for view details."""
  bigquery_client = None

  @gen.coroutine
  def post(self, *args, **kwargs):
    try:
      self.bigquery_client = create_bigquery_client()
      post_body = self.get_json_body()

      self.finish(get_view_details(self.bigquery_client, post_body['viewId']))

    except Exception as e:
      app_log.exception(str(e))
      self.set_status(500, str(e))
      self.finish({'error': {'message': str(e)}})


class ModelDetailsHandler(APIHandler):
  """Handles requests for model metadata."""
  bigquery_client = None

  @gen.coroutine
  def post(self, *args, **kwargs):
    try:
      self.bigquery_client = create_bigquery_client()
      post_body = self.get_json_body()

      self.finish(get_model_details(self.bigquery_client, post_body['modelId']))

    except Exception as e:
      app_log.exception(str(e))
      self.set_status(500, str(e))
      self.finish({'error': {'message': str(e)}})

class TrainingRunDetailsHandler(APIHandler):
  """Handles requests for details on a specific model training run."""
  bigquery_client = None

  @gen.coroutine
  def post(self, *args, **kwargs):
    try:
      self.bigquery_client = create_bigquery_client()
      post_body = self.get_json_body()

      self.finish(get_training_run_details(self.bigquery_client, post_body['modelId'], int(post_body['runIndex'])))

    except Exception as e:
      app_log.exception(str(e))
      self.set_status(500, str(e))
      self.finish({'error': {'message': str(e)}})
