# Lint as: python3
"""Request handler classes for the extensions."""

from google.cloud import bigquery

SCOPE = ("https://www.googleapis.com/auth/cloud-platform",)


class BigQueryService:
  """Provides an authenticated BigQuery Client and project info"""

  _instance = None

  def __init__(self, client=bigquery.Client()):
    self._client = client

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
    datasets = list(self._client.list_datasets())

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
      table_full_id = '{}.{}.{}'.format(table.project, table.dataset_id, table.table_id)
      tables_list[table_full_id] = {
        'id': table_full_id,
        'name': table.table_id,
        'datasetId': dataset_id,
      }
      table_ids.append(table_full_id)

    return {'tables': tables_list, 'tableIds': table_ids}

  def list_models(self, dataset_id):
    dataset = self._client.get_dataset(dataset_id)
    models = list(self._client.list_models(dataset))

    models_list = {}
    model_ids = []
    for model in models:
      model_full_id = '{}.{}.{}'.format(model.project, model.dataset_id, model.model_id)
      models_list[model_full_id] = {
        'id': model_full_id,
        'name': model.model_id,
        'datasetId': dataset_id,
      }
      model_ids.append(model_full_id)

    return {'models': models_list, 'modelIds': model_ids}
