import unittest
from unittest.mock import Mock, MagicMock, patch

from jupyterlab_automl import service

from google.cloud.automl_v1beta1.types import (
    Dataset,
    Timestamp,
    Model,
    DataType,
    TableSpec,
    ColumnSpec,
    TablesDatasetMetadata,
    ImageClassificationDatasetMetadata,
    DataStats,
)


class TestAutoMLExtension(unittest.TestCase):
    def testListDatasets(self):
        metadata = ImageClassificationDatasetMetadata(classification_type=1)
        time = Timestamp(seconds=0, nanos=0)
        gcp_datasets = [
            Dataset(
                display_name="dummy_dataset1",
                name="ICN_dummy_dataset1",
                create_time=time,
                example_count=9999,
                description="dummy_description",
                image_classification_dataset_metadata=metadata,
            ),
        ]

        mock_client = Mock()
        mock_parent = Mock()
        mock_client.list_datasets = MagicMock(return_value=gcp_datasets)
        automl = service.AutoMLService.get()
        automl._client = mock_client
        automl._parent = mock_parent

        wanted = {
            "datasets": [
                {
                    "id": "ICN_dummy_dataset1",
                    "displayName": "dummy_dataset1",
                    "description": "dummy_description",
                    "createTime": 0,
                    "exampleCount": 9999,
                    "metadata": {"classification_type": 1,},
                    "datasetType": "ICN",
                },
            ]
        }
        got = automl.get_datasets()
        self.assertEqual(wanted, got)

    def testListModels(self):
        time = Timestamp(seconds=0, nanos=0)
        gcp_models = [
            Model(
                display_name="dummy_model1",
                name="dummy_model1",
                update_time=time,
                dataset_id="dummy_dataset1",
                deployment_state=2,
            ),
            Model(
                display_name="dummy_model2",
                name="dummy_model2",
                update_time=time,
                dataset_id="dummy_dataset2",
                deployment_state=1,
            ),
        ]

        mock_client = Mock()
        mock_parent = Mock()
        mock_client.list_models = MagicMock(return_value=gcp_models)
        automl = service.AutoMLService.get()
        automl._client = mock_client
        automl._parent = mock_parent

        wanted = {
            "models": [
                {
                    "id": "dummy_model1",
                    "displayName": "dummy_model1",
                    "updateTime": 0,
                    "datasetId": "dummy_dataset1",
                    "deploymentState": 2,
                    "metadata": "",
                },
                {
                    "id": "dummy_model2",
                    "displayName": "dummy_model2",
                    "updateTime": 0,
                    "datasetId": "dummy_dataset2",
                    "deploymentState": 1,
                    "metadata": "",
                },
            ]
        }

        got = automl.get_models()
        self.assertEqual(wanted, got)

    def testListTableSpecs1(self):
        dummy_type_1 = DataType(type_code=3, nullable=True)
        buckets = [{"min": 2, "max": 4, "count": 6,}, {"min": 4, "max": 6, "count": 8,}]
        stats_64 = {
            "mean": 10.11111,
            "standard_deviation": 2.2111111,
            "histogram_buckets": buckets,
        }
        dummy_stat_1 = DataStats(
            distinct_value_count=2,
            valid_value_count=3,
            null_value_count=0,
            float64_stats=stats_64,
        )
        gcp_column_specs = [
            ColumnSpec(
                name="dummy_column1",
                data_type=dummy_type_1,
                display_name="column1",
                data_stats=dummy_stat_1,
            ),
        ]
        gcp_table_specs = [
            TableSpec(
                name="dummy_table1", row_count=3, valid_row_count=4, column_count=2,
            ),
        ]

        mock_client = Mock()
        mock_client.list_table_specs = MagicMock(return_value=gcp_table_specs)
        mock_client.list_column_specs = MagicMock(return_value=gcp_column_specs)
        automl = service.AutoMLService.get()
        automl._client = mock_client

        wanted_chart_info = [
            {"name": "[2, 4]", "Number of Instances": 6},
            {"name": "[4, 6]", "Number of Instances": 8},
        ]

        wanted_column = (
            [
                {
                    "id": "dummy_column1",
                    "dataType": "Numeric",
                    "displayName": "column1",
                    "distinctValueCount": 2,
                    "invalidValueCount": 0,
                    "nullValueCount": "0 (0%)",
                    "nullable": True,
                    "detailPanel": [wanted_chart_info, 10.11, 2.21],
                },
            ],
            [{"name": "Numeric", "Number of Instances": 1}],
        )

        wanted_table = {
            "tableSpecs": [
                {
                    "id": "dummy_table1",
                    "rowCount": 3,
                    "validRowCount": 4,
                    "columnCount": 2,
                    "columnSpecs": wanted_column[0],
                    "chartSummary": wanted_column[1],
                },
            ]
        }

        got_column = automl.get_column_specs(gcp_table_specs[0])
        self.assertEqual(wanted_column, got_column)
        got_table = automl.get_table_specs("datasetId")
        self.assertEqual(wanted_table, got_table)

    def testListTableSpecs2(self):
        dummy_type_2 = DataType(type_code=10)
        top_category_stats = [
            {"value": "Test1", "count": 2},
            {"value": "Test2", "count": 1},
        ]
        category_stats = {"top_category_stats": top_category_stats}
        dummy_stat_2 = DataStats(
            distinct_value_count=1,
            valid_value_count=2,
            null_value_count=1,
            category_stats=category_stats,
        )
        gcp_column_specs = [
            ColumnSpec(
                name="dummy_column2",
                data_type=dummy_type_2,
                display_name="column2",
                data_stats=dummy_stat_2,
            ),
        ]
        gcp_table_specs = [
            TableSpec(
                name="dummy_table1", row_count=4, valid_row_count=4, column_count=2,
            ),
        ]

        mock_client = Mock()
        mock_client.list_table_specs = MagicMock(return_value=gcp_table_specs)
        mock_client.list_column_specs = MagicMock(return_value=gcp_column_specs)
        automl = service.AutoMLService.get()
        automl._client = mock_client

        chart_info = [
            {"name": "Test1", "Number of Instances": 2},
            {"name": "Test2", "Number of Instances": 1},
        ]

        wanted_column = (
            [
                {
                    "id": "dummy_column2",
                    "dataType": "Categorical",
                    "displayName": "column2",
                    "distinctValueCount": 1,
                    "invalidValueCount": 2,
                    "nullValueCount": "1 (25%)",
                    "nullable": False,
                    "detailPanel": [chart_info, "Test1 (66.667%)"],
                },
            ],
            [{"name": "Categorical", "Number of Instances": 1},],
        )

        wanted_table = {
            "tableSpecs": [
                {
                    "id": "dummy_table1",
                    "rowCount": 4,
                    "validRowCount": 4,
                    "columnCount": 2,
                    "columnSpecs": wanted_column[0],
                    "chartSummary": wanted_column[1],
                },
            ]
        }

        got_column = automl.get_column_specs(gcp_table_specs[0])
        self.assertEqual(wanted_column, got_column)
        got_table = automl.get_table_specs("datasetId")
        self.assertEqual(wanted_table, got_table)


if __name__ == "__main__":
    unittest.main()
