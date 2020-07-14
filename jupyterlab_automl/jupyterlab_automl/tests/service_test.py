"""Testing services for AutoML extension"""

import unittest
from unittest.mock import Mock, MagicMock
from google.cloud.aiplatform_v1alpha1.types import Dataset, ListDatasetsResponse, Model, ListModelsResponse, TrainingPipeline
from jupyterlab_automl import service


class TestAutoMLExtension(unittest.TestCase):
  """Testing the AutoML extension services"""

  def testListDatasets(self):
    time1 = {"seconds": 0}
    time2 = {"seconds": 60}
    label1 = {"aiplatform.googleapis.com/dataset_metadata_schema": "TABLE"}
    label2 = {"aiplatform.googleapis.com/dataset_metadata_schema": "IMAGE"}
    metadata = {"somepath": {"to the gcp": {"location": "path"}}}
    gcp_datasets = ListDatasetsResponse(datasets=[
        Dataset(
            display_name="dummy_dataset1",
            name="dummy_dataset1",
            create_time=time1,
            update_time=time2,
            labels=label1,
            etag="ETAG1234",
            metadata="",
        ),
        Dataset(
            display_name="dummy_dataset2",
            name="dummy_dataset2",
            create_time=time2,
            update_time=time1,
            labels=label2,
            etag="1234ETAG",
            metadata=metadata,
        ),
    ])

    mock_client = Mock()
    mock_client.list_datasets = MagicMock(return_value=gcp_datasets)
    automl = service.AutoMLService.get()
    automl._dataset_client = mock_client

    wanted = [
        {
            "id": "dummy_dataset1",
            "displayName": "dummy_dataset1",
            "createTime": 0.0,
            "updateTime": 60000.0,
            "datasetType": "TABLE",
            "etag": "ETAG1234",
            "metadata": "",
        },
        {
            "id": "dummy_dataset2",
            "displayName": "dummy_dataset2",
            "createTime": 60000.0,
            "updateTime": 0.0,
            "datasetType": "IMAGE",
            "etag": "1234ETAG",
            "metadata": metadata,
        },
    ]
    got = automl.get_datasets()
    self.assertEqual(wanted, got)

  def testListModels(self):
    time1 = {"seconds": 0}
    time2 = {"seconds": 60}
    gcp_models = ListModelsResponse(models=[
        Model(
            display_name="dummy_model1",
            name="dummy_model1",
            create_time=time1,
            update_time=time2,
            training_pipeline="pipeline1",
            etag="ETAG1234",
        ),
        Model(
            display_name="dummy_model2",
            name="dummy_model2",
            create_time=time2,
            update_time=time1,
            training_pipeline="pipeline2",
            etag="1234ETAG",
        ),
    ])

    mock_client = Mock()
    mock_client.list_models = MagicMock(return_value=gcp_models)
    automl = service.AutoMLService.get()
    automl._model_client = mock_client

    wanted = [
        {
            "id": "dummy_model1",
            "displayName": "dummy_model1",
            "pipelineId": "pipeline1",
            "createTime": 0.0,
            "updateTime": 60000.0,
            "etag": "ETAG1234",
            "modelType": "OTHER",
        },
        {
            "id": "dummy_model2",
            "displayName": "dummy_model2",
            "pipelineId": "pipeline2",
            "createTime": 60000.0,
            "updateTime": 0.0,
            "etag": "1234ETAG",
            "modelType": "OTHER",
        },
    ]
    got = automl.get_models()
    self.assertEqual(wanted, got)

  def testCreateDatasetThrows(self):
    automl = service.AutoMLService.get()
    automl._dataset_client = Mock()
    with self.assertRaises(ValueError):
      automl.create_dataset("", gcs_uri="gs://test/test")

    with self.assertRaises(ValueError):
      automl.create_dataset("test_name")

  def testGetPipeline(self):
    time1 = {"seconds": 0}
    time2 = {"seconds": 60}
    transformations = [{
        "numeric": {
            "columnName": "Column1",
        }
    }, {
        "categorical": {
            "columnName": "Column2",
        }
    }]
    training_task_inputs = {
        "optimizationObjective": "minimize_loss",
        "predictionType": "classification",
        "targetColumn": "Column2",
        "trainBudgetMilliNodeHours": "1000",
        "transformations": transformations,
    }
    input_data_config = {"dataset_id": "dummy_dataset_id"}
    gcp_pipeline = TrainingPipeline(
        display_name="dummy_pipeline1",
        name="dummy_pipeline1_id",
        create_time=time1,
        update_time=time2,
        start_time=time1,
        end_time=time2,
        input_data_config=input_data_config,
        training_task_inputs=training_task_inputs,
    )

    mock_client = Mock()
    mock_client.get_training_pipeline = MagicMock(return_value=gcp_pipeline)
    automl = service.AutoMLService.get()
    automl._pipeline_client = mock_client

    transformation_options = [{
        "dataType": "Numeric",
        "columnName": "Column1",
    }, {
        "dataType": "Categorical",
        "columnName": "Column2",
    }]

    wanted = {
        "id": "dummy_pipeline1_id",
        "displayName": "dummy_pipeline1",
        "createTime": 0.0,
        "updateTime": 60000.0,
        "elapsedTime": 60,
        "trainBudgetMilliNodeHours": "1000",
        "budgetMilliNodeHours": None,
        "datasetId": "dummy_dataset_id",
        "targetColumn": "Column2",
        "transformationOptions": transformation_options,
        "predictionType": "classification",
        "optimizationObjective": "minimize_loss",
    }
    got = automl.get_pipeline('pipeline_id')
    self.assertEqual(wanted, got)

if __name__ == "__main__":
  unittest.main()
