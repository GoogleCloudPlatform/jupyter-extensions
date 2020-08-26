# Lint as: python3
"""Request handler classes for the extensions."""

import re
from google.cloud import bigquery
from google.cloud.datacatalog import DataCatalogClient, types

SCOPE = ("https://www.googleapis.com/auth/cloud-platform",)


class BigQueryService:
  """Provides an authenticated BigQuery Client and project info"""

  _instance = None

  def __init__(self,
               client=bigquery.Client(),
               datacatalog_client=DataCatalogClient()):
    self._client = client
    self._datacatalog_client = datacatalog_client

  @property
  def client(self):
    return self._client

  @classmethod
  def get(cls):
    if not cls._instance:
      cls._instance = BigQueryService()
    return cls._instance

  def list_projects(self):
    project = self._client.project
    projects_list = {
        format(project): {
            'id': format(project),
            'name': format(project),
        }
    }
    project_ids = [format(project)]
    return {'projects': projects_list, 'projectIds': project_ids}

  def list_datasets(self, project):
    datasets = list(self._client.list_datasets(project))

    datasets_list = {}
    dataset_ids = []
    for dataset in datasets:
      dataset_full_id = '{}.{}'.format(dataset.project, dataset.dataset_id)
      datasets_list[dataset_full_id] = {
          'id': dataset_full_id,
          'name': dataset.dataset_id,
          'projectId': format(dataset.project),
      }
      dataset_ids.append(dataset_full_id)

    return {'datasets': datasets_list, 'datasetIds': dataset_ids}

  def list_tables(self, dataset_id):
    dataset = self._client.get_dataset(dataset_id)
    tables = list(self._client.list_tables(dataset))

    tables_list = {}
    table_ids = []
    for table in tables:
      table_full_id = '{}.{}.{}'.format(table.project, table.dataset_id,
                                        table.table_id)
      tables_list[table_full_id] = {
          'id': table_full_id,
          'name': table.table_id,
          'datasetId': dataset_id,
          'type': table.table_type,
          'partitioned': bool(table.partitioning_type),
      }
      table_ids.append(table_full_id)

    return {'tables': tables_list, 'tableIds': table_ids}

  def list_models(self, dataset_id):
    dataset = self._client.get_dataset(dataset_id)
    models = list(self._client.list_models(dataset))

    models_list = {}
    model_ids = []
    for model in models:
      model_full_id = '{}.{}.{}'.format(model.project, model.dataset_id,
                                        model.model_id)
      models_list[model_full_id] = {
          'id': model_full_id,
          'name': model.model_id,
          'datasetId': dataset_id,
          'type': 'MODEL'
      }
      model_ids.append(model_full_id)

    return {'models': models_list, 'modelIds': model_ids}

  def search_projects(self, search_key, project_id):
    scope = types.SearchCatalogRequest.Scope()
    scope.include_project_ids.append(project_id)
    results = self._datacatalog_client.search_catalog(
        scope=scope,
        query='name:{} projectid:{}'.format(search_key, project_id))

    fetched_results = []
    for result in results:
      resource = result.linked_resource
      result_type = format(result.search_result_subtype)
      if result_type == 'entry.dataset':
        res = re.search('datasets/(.*)', resource)
        dataset = res.group(1)
        fetched_results.append({
            'type': 'dataset',
            'parent': project_id,
            'name': dataset,
            'id': '{}.{}'.format(project_id, dataset)
        })
      elif result_type == 'entry.table':
        res = re.search('datasets/(.*)/tables/(.*)', resource)
        dataset = res.group(1)
        table = res.group(2)
        fetched_results.append({
            'type': 'table',
            'parent': dataset,
            'name': table,
            'id': '{}.{}.{}'.format(project_id, dataset, table)
        })
      elif result_type == 'entry.table.view':
        res = re.search('datasets/(.*)/tables/(.*)', resource)
        dataset = res.group(1)
        view = res.group(2)
        fetched_results.append({
            'type': 'view',
            'parent': dataset,
            'name': view,
            'id': '{}.{}.{}'.format(project_id, dataset, view)
        })
      elif result_type == 'entry.model':
        res = re.search('datasets/(.*)/models/(.*)', resource)
        dataset = res.group(1)
        model = res.group(2)
        fetched_results.append({
            'type': 'model',
            'parent': dataset,
            'name': model,
            'id': '{}.{}.{}'.format(project_id, dataset, model)
        })

    return {'results': fetched_results}

  def create_custom_client(self, project_id):
    return bigquery.Client(project=project_id)

  def get_project(self, custom_client):
    project = custom_client.project
    formatted_project = {
        'id': format(project),
        'name': format(project),
    }
    return formatted_project
