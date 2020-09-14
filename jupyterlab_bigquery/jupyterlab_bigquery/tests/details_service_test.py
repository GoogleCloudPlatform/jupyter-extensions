# Lint as: python3
"""Tests for details panel handlers."""
import unittest
import datetime
from unittest.mock import Mock, MagicMock

from google.cloud.bigquery.enums import StandardSqlDataTypes, SqlTypeNames
from google.cloud.bigquery_v2.gapic.enums import Model
from google.protobuf.wrappers_pb2 import DoubleValue, BoolValue
from jupyterlab_bigquery.details_handler.service import BigQueryService


class TestDatasetDetails(unittest.TestCase):

  def testGetDatasetDetailsFull(self):
    client = Mock()
    dataset = Mock(project='project_id',
                   dataset_id='dataset_id',
                   description='description of dataset',
                   labels={
                       'label_0': 'value_0',
                       'label_1': 'value_1'
                   },
                   created=datetime.datetime(2020,
                                             7,
                                             14,
                                             13,
                                             23,
                                             45,
                                             67,
                                             tzinfo=None),
                   default_table_expiration_ms=17280000000,
                   location='US',
                   modified=datetime.datetime(2020,
                                              7,
                                              15,
                                              15,
                                              11,
                                              23,
                                              32,
                                              tzinfo=None),
                   self_link='https://bigquery.googleapis.com/bigquery' + \
            '/v2/projects/project_id/datasets/dataset_id')
    client.get_dataset = Mock(return_value=dataset)
    bigquery = BigQueryService(client)

    expected = {
        'details': {
            'id':
                'project_id.dataset_id',
            'name':
                'dataset_id',
            'description':
                'description of dataset',
            'labels': ['label_0: value_0', 'label_1: value_1'],
            'date_created':
                '2020-07-14T13:23:45.000067',
            'default_expiration':
                17280000000,
            'location':
                'US',
            'last_modified':
                '2020-07-15T15:11:23.000032',
            'project':
                'project_id',
            'link':
                'https://bigquery.googleapis.com/bigquery' + \
                    '/v2/projects/project_id/datasets/dataset_id'
        }
    }
    result = bigquery.get_dataset_details('some_dataset_id')
    self.assertEqual(expected, result)

  def testGetDatasetDetailsEmptyFields(self):
    client = Mock()
    dataset = Mock(project='project_id',
                   dataset_id='dataset_id',
                   description=None,
                   labels={},
                   created=datetime.datetime(2020,
                                             7,
                                             14,
                                             13,
                                             23,
                                             45,
                                             67,
                                             tzinfo=None),
                   default_table_expiration_ms=None,
                   location='US',
                   modified=datetime.datetime(2020,
                                              7,
                                              15,
                                              15,
                                              11,
                                              23,
                                              32,
                                              tzinfo=None),
                   self_link='https://bigquery.googleapis.com' + \
            '/bigquery/v2/projects/project_id/datasets/dataset_id')
    client.get_dataset = Mock(return_value=dataset)
    bigquery = BigQueryService(client)

    expected = {
        'details': {
            'id':
                'project_id.dataset_id',
            'name':
                'dataset_id',
            'description':
                None,
            'labels':
                None,
            'date_created':
                '2020-07-14T13:23:45.000067',
            'default_expiration':
                None,
            'location':
                'US',
            'last_modified':
                '2020-07-15T15:11:23.000032',
            'project':
                'project_id',
            'link':
                'https://bigquery.googleapis.com' + \
                    '/bigquery/v2/projects/project_id/datasets/dataset_id'
        }
    }

    result = bigquery.get_dataset_details('some_dataset_id')
    self.assertEqual(expected, result)


class TestTableDetails(unittest.TestCase):

  def testGetTableDetailsFull(self):
    client = Mock()

    schema_field_0 = Mock(field_type='STRING',
                          description='this field is a string',
                          mode='NULLABLE')
    schema_field_0.name = 'field_name_0'

    schema_field_1 = Mock(field_type='INTEGER',
                          description='this field is an integer',
                          mode='NULLABLE')
    schema_field_1.name = 'field_name_1'

    table = Mock(project='project_id',
                 dataset_id='dataset_id',
                 table_id='table_id',
                 description='description of table',
                 labels={
                     'label_0': 'value_0',
                     'label_1': 'value_1'
                 },
                 created=datetime.datetime(2020,
                                           7,
                                           14,
                                           13,
                                           23,
                                           45,
                                           67,
                                           tzinfo=None),
                 expires=datetime.datetime(2021,
                                           7,
                                           14,
                                           13,
                                           23,
                                           45,
                                           67,
                                           tzinfo=None),
                 location='US',
                 modified=datetime.datetime(2020,
                                            7,
                                            15,
                                            15,
                                            11,
                                            23,
                                            32,
                                            tzinfo=None),
                 self_link='https://bigquery.googleapis.com/bigquery' + \
            '/v2/projects/project_id/datasets/dataset_id',
                 num_rows=123456,
                 num_bytes=2000000,
                 schema=[schema_field_0, schema_field_1])
    client.get_table = Mock(return_value=table)
    bigquery = BigQueryService(client)

    expected = {
        'details': {
            'id':
                'project_id.dataset_id.table_id',
            'name':
                'table_id',
            'description':
                'description of table',
            'labels': ['label_0: value_0', 'label_1: value_1'],
            'date_created':
                '2020-07-14T13:23:45.000067',
            'expires':
                '2021-07-14T13:23:45.000067',
            'location':
                'US',
            'last_modified':
                '2020-07-15T15:11:23.000032',
            'project':
                'project_id',
            'dataset':
                'dataset_id',
            'link':
                'https://bigquery.googleapis.com/' + \
                    'bigquery/v2/projects/project_id/datasets/dataset_id',
            'num_rows':
                123456,
            'num_bytes':
                2000000,
            'schema': [{
                'name': 'field_name_0',
                'type': 'STRING',
                'description': 'this field is a string',
                'mode': 'NULLABLE'
            }, {
                'name': 'field_name_1',
                'type': 'INTEGER',
                'description': 'this field is an integer',
                'mode': 'NULLABLE'
            }]
        }
    }

    result = bigquery.get_table_details('some_table_id')
    self.assertEqual(expected, result)

  def testGetTableDetailsEmptyFields(self):
    client = Mock()

    table = Mock(project='project_id',
                 dataset_id='dataset_id',
                 table_id='table_id',
                 description=None,
                 labels={},
                 created=datetime.datetime(2020,
                                           7,
                                           14,
                                           13,
                                           23,
                                           45,
                                           67,
                                           tzinfo=None),
                 expires=None,
                 location='US',
                 modified=datetime.datetime(2020,
                                            7,
                                            15,
                                            15,
                                            11,
                                            23,
                                            32,
                                            tzinfo=None),
                 self_link='https://bigquery.googleapis.com/' + \
            'bigquery/v2/projects/project_id/datasets/dataset_id',
                 num_rows=0,
                 num_bytes=0,
                 schema=[])
    client.get_table = Mock(return_value=table)
    bigquery = BigQueryService(client)

    expected = {
        'details': {
            'id':
                'project_id.dataset_id.table_id',
            'name':
                'table_id',
            'description':
                None,
            'labels':
                None,
            'date_created':
                '2020-07-14T13:23:45.000067',
            'expires':
                None,
            'location':
                'US',
            'last_modified':
                '2020-07-15T15:11:23.000032',
            'project':
                'project_id',
            'dataset':
                'dataset_id',
            'link':
                'https://bigquery.googleapis.com/' + \
                    'bigquery/v2/projects/project_id/datasets/dataset_id',
            'num_rows':
                0,
            'num_bytes':
                0,
            'schema': []
        }
    }

    result = bigquery.get_table_details('some_table_id')
    self.assertEqual(expected, result)

  def testGetTableDetailsNestedSchema(self):
    client = Mock()

    schema_field_0 = Mock(field_type='STRING',
                          description='this field is a string and a child',
                          mode='NULLABLE')
    schema_field_0.name = 'child'

    schema_field_1 = Mock(field_type='RECORD',
                          description='this field is a record',
                          mode='NULLABLE',
                          fields=[schema_field_0])
    schema_field_1.name = 'record'

    table = Mock(project='project_id',
                 dataset_id='dataset_id',
                 table_id='table_id',
                 description='description of table',
                 labels={
                     'label_0': 'value_0',
                     'label_1': 'value_1'
                 },
                 created=datetime.datetime(2020,
                                           7,
                                           14,
                                           13,
                                           23,
                                           45,
                                           67,
                                           tzinfo=None),
                 expires=datetime.datetime(2021,
                                           7,
                                           14,
                                           13,
                                           23,
                                           45,
                                           67,
                                           tzinfo=None),
                 location='US',
                 modified=datetime.datetime(2020,
                                            7,
                                            15,
                                            15,
                                            11,
                                            23,
                                            32,
                                            tzinfo=None),
                 self_link='https://bigquery.googleapis.com/bigquery' + \
                    '/v2/projects/project_id/datasets/dataset_id',
                 num_rows=123456,
                 num_bytes=2000000,
                 schema=[schema_field_1])
    client.get_table = Mock(return_value=table)
    bigquery = BigQueryService(client)

    expected = {
        'details': {
            'id':
                'project_id.dataset_id.table_id',
            'name':
                'table_id',
            'description':
                'description of table',
            'labels': ['label_0: value_0', 'label_1: value_1'],
            'date_created':
                '2020-07-14T13:23:45.000067',
            'expires':
                '2021-07-14T13:23:45.000067',
            'location':
                'US',
            'last_modified':
                '2020-07-15T15:11:23.000032',
            'project':
                'project_id',
            'dataset':
                'dataset_id',
            'link':
                'https://bigquery.googleapis.com/bigquery' + \
                    '/v2/projects/project_id/datasets/dataset_id',
            'num_rows':
                123456,
            'num_bytes':
                2000000,
            'schema': [{
                'name': 'record',
                'type': 'RECORD',
                'description': 'this field is a record',
                'mode': 'NULLABLE'
            }, {
                'name': 'record.child',
                'type': 'STRING',
                'description': 'this field is a string and a child',
                'mode': 'NULLABLE'
            }]
        }
    }

    result = bigquery.get_table_details('some_table_id')
    self.assertEqual(expected, result)


class TestTablePreview(unittest.TestCase):

  def testNestedTable(self):
    # ensures records schema names are properly displayed and items
    # within records are properly separated
    client = Mock()

    schema_field_0 = Mock(field_type='STRING', mode='NULLABLE')
    schema_field_0.name = 'field_name_0'

    schema_subfield = Mock(field_type='INTEGER', mode='NULLABLE')
    schema_subfield.name = 'subfield'

    schema_subfield_2 = Mock(field_type='DATETIME', mode='NULLABLE')
    schema_subfield_2.name = 'other_subfield'

    schema_field_1 = Mock(field_type='RECORD',
                          mode='NULLABLE',
                          fields=[schema_subfield, schema_subfield_2])
    schema_field_1.name = 'field_name_1'

    rows = MagicMock(schema=[schema_field_0, schema_field_1])
    row_0 = [
        'hello', {
            'subfield':
                1,
            'other_subfield':
                datetime.datetime(2020, 7, 14, 13, 23, 45, 67, tzinfo=None)
        }
    ]
    row_1 = ['goodbye', {'subfield': 2, 'other_subfield': None}]
    row_2 = [None, None]
    rows.__iter__.return_value = [row_0, row_1, row_2]

    client.list_rows = MagicMock(return_value=rows)
    bigquery = BigQueryService(client)

    expected = {
        'fields': [
            'field_name_0', 'field_name_1.subfield',
            'field_name_1.other_subfield'
        ],
        'rows': [['hello', 1, '2020-07-14 13:23:45.000067 '],
                 ['goodbye', 2, None], [None, None, None]]
    }

    result = bigquery.get_table_preview('some_table_id')
    self.assertEqual(expected, result)

  def testEmptyTable(self):
    # same as nested table, but ensures
    #  that when all entries are None the header
    # still displays properly.

    client = Mock()

    schema_field_0 = Mock(field_type='STRING', mode='NULLABLE')
    schema_field_0.name = 'field_name_0'

    schema_subfield = Mock(field_type='INTEGER', mode='NULLABLE')
    schema_subfield.name = 'subfield'

    schema_subfield_2 = Mock(field_type='DATETIME', mode='NULLABLE')
    schema_subfield_2.name = 'other_subfield'

    schema_field_1 = Mock(field_type='RECORD',
                          mode='NULLABLE',
                          fields=[schema_subfield, schema_subfield_2])
    schema_field_1.name = 'field_name_1'

    rows = MagicMock(schema=[schema_field_0, schema_field_1])
    row_0 = [None, None]
    rows.__iter__.return_value = [row_0]

    client.list_rows = MagicMock(return_value=rows)
    bigquery = BigQueryService(client)

    expected = {
        'fields': [
            'field_name_0', 'field_name_1.subfield',
            'field_name_1.other_subfield'
        ],
        'rows': [[None, None, None]]
    }

    result = bigquery.get_table_preview('some_table_id')
    self.assertEqual(expected, result)

  def testRepeatedTable(self):
    # ensures that repeated fields are returned as strings, and that
    # repeated record field name headers are not expanded
    client = Mock()

    schema_field_0 = Mock(field_type='STRING',
                          description='this field is a repeated string',
                          mode='REPEATED')
    schema_field_0.name = 'field_name_0'

    schema_subfield = Mock(field_type='INTEGER',
                           description='this field is an integer',
                           mode='NULLABLE')
    schema_subfield.name = 'subfield'

    schema_field_1 = Mock(field_type='RECORD',
                          description='this field is a repeated record',
                          mode='REPEATED',
                          fields=[schema_subfield])
    schema_field_1.name = 'field_name_1'

    rows = MagicMock(schema=[schema_field_0, schema_field_1])
    row_0 = [['hello', 'hi'], [{'subfield': 1}]]
    row_1 = [['goodbye', 'bye'], [{'subfield': 2}, {'subfield': 3}]]
    row_2 = [[], []]
    row_3 = [[], [{'subfield': None}]]
    rows.__iter__.return_value = [row_0, row_1, row_2, row_3]

    client.list_rows = MagicMock(return_value=rows)
    bigquery = BigQueryService(client)

    expected = {
        'fields': ['field_name_0', 'field_name_1'],
        'rows': [['["hello", "hi"]', '[{"subfield": 1}]'],
                 ['["goodbye", "bye"]', '[{"subfield": 2}, {"subfield": 3}]'],
                 ['[]', '[]'], ['[]', '[{"subfield": null}]']]
    }

    result = bigquery.get_table_preview('some_table_id')
    self.assertEqual(expected, result)


class TestViewDetails(unittest.TestCase):
  # identidal to testGetTableDetailsFull except
  # for additional query and legacy sql properties
  # and removal of location property
  def testGetViewDetailsFull(self):
    client = Mock()

    schema_field_0 = Mock(field_type='STRING',
                          description='this field is a string',
                          mode='NULLABLE')
    schema_field_0.name = 'field_name_0'

    schema_field_1 = Mock(field_type='INTEGER',
                          description='this field is an integer',
                          mode='NULLABLE')
    schema_field_1.name = 'field_name_1'

    table = Mock(
        project='project_id',
        dataset_id='dataset_id',
        table_id='view_id',
        description='description of view',
        labels={
            'label_0': 'value_0',
            'label_1': 'value_1'
        },
        created=datetime.datetime(2020, 7, 14, 13, 23, 45, 67, tzinfo=None),
        expires=datetime.datetime(2021, 7, 14, 13, 23, 45, 67, tzinfo=None),
        modified=datetime.datetime(2020, 7, 15, 15, 11, 23, 32, tzinfo=None),
        self_link='https://bigquery.googleapis.com/bigquery/v2/' + \
            'projects/project_id/datasets/dataset_id/view_id',
        schema=[schema_field_0, schema_field_1],
        view_query='SELECT * FROM `project_id.dataset_id.table_id LIMIT 200',
        view_use_legacy_sql=False)
    client.get_table = Mock(return_value=table)
    bigquery = BigQueryService(client)

    expected = {
        'details': {
            'id':
                'project_id.dataset_id.view_id',
            'name':
                'view_id',
            'description':
                'description of view',
            'labels': ['label_0: value_0', 'label_1: value_1'],
            'date_created':
                '2020-07-14T13:23:45.000067',
            'expires':
                '2021-07-14T13:23:45.000067',
            'last_modified':
                '2020-07-15T15:11:23.000032',
            'project':
                'project_id',
            'dataset':
                'dataset_id',
            'link':
                'https://bigquery.googleapis.com/bigquery' + \
                    '/v2/projects/project_id/datasets/dataset_id/view_id',
            'schema': [{
                'name': 'field_name_0',
                'type': 'STRING',
                'description': 'this field is a string',
                'mode': 'NULLABLE'
            }, {
                'name': 'field_name_1',
                'type': 'INTEGER',
                'description': 'this field is an integer',
                'mode': 'NULLABLE'
            }],
            'query':
                'SELECT * FROM `project_id.dataset_id.table_id LIMIT 200',
            'legacy_sql':
                False
        }
    }

    result = bigquery.get_view_details('some_view_id')
    self.assertEqual(expected, result)


class TestModelDetails(unittest.TestCase):

  def testGetModelDetailsFull(self):
    client = Mock()

    label_col_0 = Mock()
    label_col_0.name = 'schema_label_0'
    label_col_0.type = Mock(type_kind=7)
    label_col_1 = Mock()
    label_col_1.name = 'schema_label_1'
    label_col_1.type = Mock(type_kind=9)

    feature_col_0 = Mock()
    feature_col_0.name = 'feature_col_0'
    feature_col_0.type = Mock(type_kind=8)

    model = Mock(project='project_id',
                 dataset_id='dataset_id',
                 model_id='model_id',
                 description='description of model',
                 labels={
                     'label_0': 'value_0',
                     'label_1': 'value_1'
                 },
                 created=datetime.datetime(2020,
                                           7,
                                           14,
                                           13,
                                           23,
                                           45,
                                           67,
                                           tzinfo=None),
                 expires=datetime.datetime(2021,
                                           7,
                                           14,
                                           13,
                                           23,
                                           45,
                                           67,
                                           tzinfo=None),
                 location='US',
                 modified=datetime.datetime(2020,
                                            7,
                                            15,
                                            15,
                                            11,
                                            23,
                                            32,
                                            tzinfo=None),
                 model_type=0,
                 label_columns=[label_col_0, label_col_1],
                 feature_columns=[feature_col_0],
                 training_runs=[
                     Mock(start_time=Mock(seconds=1234567)),
                     Mock(start_time=Mock(seconds=1234789))
                 ])
    client.get_model = Mock(return_value=model)
    bigquery = BigQueryService(client)

    expected = {
        'details': {
            'id': 'project_id.dataset_id.model_id',
            'name': 'model_id',
            'description': 'description of model',
            'labels': ['label_0: value_0', 'label_1: value_1'],
            'date_created': '2020-07-14T13:23:45.000067',
            'last_modified': '2020-07-15T15:11:23.000032',
            'expires': '2021-07-14T13:23:45.000067',
            'location': 'US',
            'model_type': Model.ModelType(0).name,
            'schema_labels': [{
                'name': 'schema_label_0',
                'type': SqlTypeNames[StandardSqlDataTypes(7).name].name
            }, {
                'name': 'schema_label_1',
                'type': SqlTypeNames[StandardSqlDataTypes(9).name].name
            }],
            'feature_columns': [{
                'name': 'feature_col_0',
                'type': SqlTypeNames[StandardSqlDataTypes(8).name].name
            }],
            'training_runs': ['1970-01-15T06:56:07+00:00', '1970-01-15T06:59:49+00:00']
        }
    }

    result = bigquery.get_model_details('some_model_id')

    self.assertEqual(expected, result)

  def testGetModelDetailsEmptyFields(self):
    client = Mock()

    model = Mock(project='project_id',
                 dataset_id='dataset_id',
                 model_id='model_id',
                 description=None,
                 labels={},
                 created=datetime.datetime(2020,
                                           7,
                                           14,
                                           13,
                                           23,
                                           45,
                                           67,
                                           tzinfo=None),
                 expires=datetime.datetime(2021,
                                           7,
                                           14,
                                           13,
                                           23,
                                           45,
                                           67,
                                           tzinfo=None),
                 location='US',
                 modified=datetime.datetime(2020,
                                            7,
                                            15,
                                            15,
                                            11,
                                            23,
                                            32,
                                            tzinfo=None),
                 model_type=0,
                 label_columns=[],
                 feature_columns=[],
                 training_runs=[Mock(start_time=Mock(seconds=1234567))])
    client.get_model = Mock(return_value=model)
    bigquery = BigQueryService(client)

    expected = {
        'details': {
            'id': 'project_id.dataset_id.model_id',
            'name': 'model_id',
            'description': None,
            'labels': None,
            'date_created': '2020-07-14T13:23:45.000067',
            'expires': '2021-07-14T13:23:45.000067',
            'location': 'US',
            'last_modified': '2020-07-15T15:11:23.000032',
            'model_type': Model.ModelType(0).name,
            'schema_labels': [],
            'feature_columns': [],
            'training_runs': ['1970-01-15T06:56:07+00:00']
        }
    }

    result = bigquery.get_model_details('some_model_id')
    self.assertEqual(expected, result)

  def testGetTrainingRunDetails(self):
    client = Mock()

    options = [['data_split_column', 'column_name_1'],
               ['data_split_eval_fraction', 0.3], ['data_split_method', 1],
               ['distance_type', 1], ['early_stop',
                                      BoolValue(value=False)],
               ['initial_learn_rate', 0.1],
               ['input_label_columns', ['column1', 'column2']],
               ['kmeans_initialization_column', 'column_name_2'],
               ['kmeans_initialization_method', 1],
               ['l1_regularization',
                DoubleValue(value=0.5)],
               ['l2_regularization',
                DoubleValue(value=0.6)], ['label_class_weights', [0.2, 0.3]],
               ['learn_rate', 0.7], ['learn_rate_strategy', 1],
               ['loss_type', 1], ['max_iterations', 20],
               ['min_relative_progress',
                DoubleValue(value=0.4)], ['model_uri', 'model.uri.string'],
               ['num_clusters', 7], ['optimization_strategy', 1],
               ['warm_start', BoolValue(value=True)]]

    mocked_options = []
    for option in options:
      option_mock = Mock()
      option_mock.name = option[0]
      mocked_options.append([option_mock, option[1]])

    training_options = Mock()
    training_options.ListFields = Mock(return_value=mocked_options)

    training_run = Mock(training_options=training_options,
                        results=['result', 'result', 'result'])

    model = Mock(training_runs=[training_run])

    client.get_model = Mock(return_value=model)
    bigquery = BigQueryService(client)

    expected = {
        'details': {
            'actual_iterations':
                3,
            'data_split_column':
                'column_name_1',
            'data_split_eval_fraction':
                0.3,
            'data_split_method':
                Model.DataSplitMethod(1).name,
            'distance_type':
                Model.DistanceType(1).name,
            'early_stop':
                'False',
            'initial_learn_rate':
                0.1,
            'input_label_columns':
                "['column1', 'column2']",
            'kmeans_initialization_column':
                'column_name_2',
            'kmeans_initialization_method':
                Model.KmeansEnums.KmeansInitializationMethod(1).name,
            'l1_regularization':
                0.5,
            'l2_regularization':
                0.6,
            'label_class_weights':
                '[0.2, 0.3]',
            'learn_rate':
                0.7,
            'learn_rate_strategy':
                Model.LearnRateStrategy(1).name,
            'loss_type':
                Model.LossType(1).name,
            'max_iterations':
                20,
            'min_relative_progress':
                0.4,
            'model_uri':
                'model.uri.string',
            'num_clusters':
                7,
            'optimization_strategy':
                Model.OptimizationStrategy(1).name,
            'warm_start':
                'True'
        }
    }

    result = bigquery.get_training_run_details('some_model_id', 0)
    self.assertEqual(expected, result)


if __name__ == '__main__':
  unittest.main()
