"""Testing services for AutoML extension"""

import unittest
from unittest.mock import Mock, MagicMock
from google.cloud.aiplatform_v1alpha1.types import Dataset, ListDatasetsResponse, Model, ListModelsResponse
from jupyterlab_automl import service


class TestAutoMLExtension(unittest.TestCase):
  """Testing the AutoML extension services"""

  def testListDatasets(self):
    time1 = {"seconds": 0, "nanos": 0}
    time2 = {"seconds": 1, "nanos": 1000000000}
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

    wanted = {
        "datasets": [
            {
                "id": "dummy_dataset1",
                "displayName": "dummy_dataset1",
                "createTime": "01/01/1970, 00:00:00",
                "updateTime": "01/01/1970, 00:00:02",
                "datasetType": "TABLE",
                "etag": "ETAG1234",
                "metadata": "",
            },
            {
                "id": "dummy_dataset2",
                "displayName": "dummy_dataset2",
                "createTime": "01/01/1970, 00:00:02",
                "updateTime": "01/01/1970, 00:00:00",
                "datasetType": "IMAGE",
                "etag": "1234ETAG",
                "metadata": metadata,
            },
        ]
    }
    got = automl.get_datasets()
    self.assertEqual(wanted, got)

  def testListModels(self):
    time1 = {"seconds": 0, "nanos": 0}
    time2 = {"seconds": 1, "nanos": 1000000000}
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

    wanted = {
        "models": [
            {
                "id": "dummy_model1",
                "displayName": "dummy_model1",
                "pipelineId": "pipeline1",
                "createTime": "01/01/1970, 00:00:00",
                "updateTime": "01/01/1970, 00:00:02",
                "etag": "ETAG1234",
            },
            {
                "id": "dummy_model2",
                "displayName": "dummy_model2",
                "pipelineId": "pipeline2",
                "createTime": "01/01/1970, 00:00:02",
                "updateTime": "01/01/1970, 00:00:00",
                "etag": "1234ETAG",
            },
        ]
    }
    got = automl.get_models()
    self.assertEqual(wanted, got)

  def testCreateDatasetThrows(self):
    automl = service.AutoMLService.get()
    automl._dataset_client = Mock()
    with self.assertRaises(ValueError):
      automl.create_dataset("", gcs_uri="gs://test/test")

    with self.assertRaises(ValueError):
      automl.create_dataset("test_name")


if __name__ == "__main__":
  unittest.main()
