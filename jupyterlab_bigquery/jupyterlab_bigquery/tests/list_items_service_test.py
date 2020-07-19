"""Services for listing BigQuery data"""
import unittest
from unittest.mock import Mock, MagicMock

from google.cloud.bigquery.dataset import DatasetListItem
from google.cloud.bigquery.table import TableListItem
from jupyterlab_bigquery.list_items_handler.service import BigQueryService


class TestListTree(unittest.TestCase):

  def testListProjects(self):
    gcp_project = 'dummy_project1'

    mock_client = Mock()
    mock_client.project = gcp_project
    bigquery = BigQueryService(mock_client)

    wanted = {
      'projects': {
        'dummy_project1': {
          'id': 'dummy_project1',
          'name': 'dummy_project1',
        }
      },
      'projectIds': ['dummy_project1']
    }

    got = bigquery.list_projects()
    self.assertEqual(wanted, got)

  def testListDatasets(self):
    gcp_datasets = [
          DatasetListItem({
            'dataset_id': "dummy_dataset1",
            'friendly_name': None,
            'full_dataset_id': None,
            'labels': None,
            'project': 'dummy_project1',
            'reference': None,
            'access_entries': None,
            'datasetReference': {
              'projectId': 'dummy_project1',
              'datasetId': 'dummy_dataset1',
            }
          })
    ]

    mock_client = Mock()
    mock_client.list_datasets = MagicMock(return_value=gcp_datasets)
    bigquery = BigQueryService(mock_client)

    wanted = {
      'datasets': {
        'dummy_project1.dummy_dataset1': {
          'id': 'dummy_project1.dummy_dataset1',
          'name': 'dummy_dataset1',
          'projectId': 'dummy_project1',
        }
      },
      'datasetIds': ['dummy_project1.dummy_dataset1']
    }

    got = bigquery.list_datasets('dummy_project1')
    self.assertEqual(wanted, got)

  def testListTables(self):
    gcp_tables = [
          TableListItem({
            'clustering_fields': None,
            'created': None,
            'dataset_id': 'dummy_dataset1',
            'expires': None,
            'friendly_name': None,
            'full_table_id': None,
            'labels': None,
            'partition_expiration': None,
            'partitioning_type': None,
            'project': 'dummy_project1',
            'reference': None,
            'table_id': 'dummy_table1',
            'table_type': 'TABLE',
            'time_partitioning': None,
            'view_use_legacy_sql': None,
            'tableReference': {
              'projectId': 'dummy_project1',
              'datasetId': 'dummy_dataset1',
              'tableId': 'dummy_table1',
            }
          })
    ]

    mock_client = Mock()
    mock_client.list_tables = MagicMock(return_value=gcp_tables)
    bigquery = BigQueryService(mock_client)

    wanted = {
      'tables': {
        'dummy_project1.dummy_dataset1.dummy_table1': {
          'id': 'dummy_project1.dummy_dataset1.dummy_table1',
          'name': 'dummy_table1',
          'datasetId': 'dummy_dataset1',
        }
      },
      'tableIds': ['dummy_project1.dummy_dataset1.dummy_table1']
    }

    got = bigquery.list_tables('dummy_dataset1')
    self.assertEqual(wanted, got)

  def testListModels(self):
    mock_model1 = Mock()
    mock_model1.project = 'dummy_project1'
    mock_model1.dataset_id = 'dummy_dataset1'
    mock_model1.model_id = 'dummy_model1'
    mock_model1.path = None
    gcp_models = [mock_model1]

    mock_client = Mock()
    mock_client.list_models = MagicMock(return_value=gcp_models)
    bigquery = BigQueryService(mock_client)

    wanted = {
      'models': {
        'dummy_project1.dummy_dataset1.dummy_model1': {
          'id': 'dummy_project1.dummy_dataset1.dummy_model1',
          'name': 'dummy_model1',
          'datasetId': 'dummy_dataset1',
        }
      },
      'modelIds': ['dummy_project1.dummy_dataset1.dummy_model1']
    }

    got = bigquery.list_models('dummy_dataset1')
    self.assertEqual(wanted, got)

if __name__ == '__main__':
  unittest.main()
