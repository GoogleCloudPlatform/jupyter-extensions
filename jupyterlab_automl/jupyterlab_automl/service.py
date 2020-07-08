"""Services for AutoML extension that get reponses from the uCAIP API"""

import json
from enum import Enum

from google.cloud import aiplatform_v1alpha1
from google.protobuf import json_format
from googleapiclient.discovery import build
from gcp_jupyterlab_shared.handlers import AuthProvider

API_ENDPOINT = "us-central1-aiplatform.googleapis.com"
TABLES_METADATA_SCHEMA = "gs://google-cloud-aiplatform/schema/dataset/metadata/tables_1.0.0.yaml"


def parse_dataset_type(dataset):
  key = "aiplatform.googleapis.com/dataset_metadata_schema"
  for dt in DatasetType:
    if dt.value == dict(dataset.labels)[key]:
      return dt
  return DatasetType.OTHER


class DatasetType(Enum):
  OTHER = "OTHER"
  TABLE = "TABLE"
  IMAGE = "IMAGE"


class ManagementService:
  """Provides an authenicated Service Management Client"""

  _instance = None

  @classmethod
  def get(cls):
    if not cls._instance:
      cls._instance = ManagementService()
    return cls._instance

  def get_managed_services(self):
    consumer_id = "project:" + AuthProvider.get().project
    service = build("servicemanagement", "v1").services()
    request = service.list(consumerId=consumer_id)
    return request.execute()

  def get_project(self):
    return AuthProvider.get().project


class AutoMLService:
  """Provides an authenticated AutoML Client and project info"""

  _instance = None

  def __init__(self):
    client_options = {"api_endpoint": API_ENDPOINT}
    self._dataset_client = aiplatform_v1alpha1.DatasetServiceClient(
        client_options=client_options)
    self._model_client = aiplatform_v1alpha1.ModelServiceClient(
        client_options=client_options)
    self._pipeline_client = aiplatform_v1alpha1.PipelineServiceClient(
        client_options=client_options)
    self._parent = ("projects/" + AuthProvider.get().project +
                    "/locations/us-central1")
    self._time_format = "%B %d, %Y, %I:%M%p"

  @property
  def dataset_client(self):
    return self._dataset_client

  @property
  def model_client(self):
    return self._model_client

  @classmethod
  def get(cls):
    if not cls._instance:
      cls._instance = AutoMLService()
    return cls._instance

  def get_models(self):
    models = self._model_client.list_models(parent=self._parent).models
    return {
        "models": [{
            "id": model.name,
            "displayName": model.display_name,
            "pipelineId": model.training_pipeline,
            "createTime": model.create_time.strftime(self._time_format),
            "updateTime": model.update_time.strftime(self._time_format),
            "etag": model.etag,
        } for model in models]
    }

  def _get_feature_importance(self, model_explanation):
    features = model_explanation["meanAttributions"][0]["featureAttributions"].items()
    return [
        {
            "name": key,
            "Percentage": round(val * 100, 3),
        } for key, val in features
    ]

  def _get_confidence_metrics(self, confidence_metrics):
    labels = ["confidenceThreshold", "f1Score", "f1ScoreAt1", "precision",
              "precisionAt1", "recall", "recallAt1", "trueNegativeCount",
              "truePositiveCount", "falseNegativeCount", "falsePositiveCount",
              "falsePositiveRate", "falsePositiveRateAt1"]
    metrics = []
    for confidence_metric in confidence_metrics:
      metric = {}
      for label in labels:
        if label == "confidenceThreshold":
          temp = confidence_metric.get(label, 0.0)
          value = temp * 100
        else:
          value = confidence_metric.get(label, "NaN")
        metric[label] = value
      metrics.append(metric)
    return metrics

  def get_model_evaluation(self, model_id):
    optional_fields = ["auPrc", "auRoc", "logLoss"]
    evaluation = self._model_client.list_model_evaluations(parent=model_id).model_evaluations[0]
    create_time = evaluation.create_time.strftime(self._time_format)
    evaluation = json_format.MessageToDict(evaluation._pb)
    metrics = evaluation["metrics"]
    model_eval = {
        "confidenceMetrics": self._get_confidence_metrics(metrics["confidenceMetrics"]),
        "createTime": create_time,
    }
    if "modelExplanation" in evaluation:
      model_eval["featureImportance"] = self._get_feature_importance(evaluation["modelExplanation"])
    for field in optional_fields:
      model_eval[field] = metrics.get(field, None)
    return model_eval

  def _get_feature_transformations(self, response):
    transformations = []
    for column in response:
      for data_type in column.keys():
        transformations.append({
            "dataType": data_type.capitalize(),
            "columnName": column[data_type]["columnName"]
        })
    return transformations

  def get_pipeline(self, pipeline_id):
    pipeline = self._pipeline_client.get_training_pipeline(name=pipeline_id)
    optional_fields = ["targetColumn", "predictionType", "optimizationObjective", "budgetMilliNodeHours", "trainBudgetMilliNodeHours"]
    training_task_inputs = json_format.MessageToDict(
        pipeline._pb.training_task_inputs)
    training_pipeline = {
        "id": pipeline.name,
        "displayName": pipeline.display_name,
        "createTime": pipeline.create_time.strftime(self._time_format),
        "updateTime": pipeline.update_time.strftime(self._time_format),
        "elapsedTime": (pipeline.end_time - pipeline.start_time).seconds,
        "datasetId": pipeline.input_data_config.dataset_id,
    }
    if "transformations" in training_task_inputs:
      transformation_options = self._get_feature_transformations(
          training_task_inputs["transformations"])
      training_pipeline["transformationOptions"] = transformation_options
    for field in optional_fields:
      training_pipeline[field] = training_task_inputs.get(field, None)
    return training_pipeline

  def get_datasets(self):
    datasets = []
    for dataset in self._dataset_client.list_datasets(
        parent=self._parent).datasets:
      dataset_type = parse_dataset_type(dataset)
      if dataset_type != DatasetType.OTHER:
        datasets.append({
            "id": dataset.name,
            "displayName": dataset.display_name,
            "createTime": dataset.create_time.strftime(self._time_format),
            "updateTime": dataset.update_time.strftime(self._time_format),
            "datasetType": dataset_type.value,
            "etag": dataset.etag,
            "metadata": json_format.MessageToDict(dataset._pb.metadata),
        })
    return {"datasets": datasets}

  def get_table_specs(self, dataset_id):
    return []

  def create_dataset(self, display_name, gcs_uri=None, bigquery_uri=None):
    input_config = {}

    if not display_name:
      raise ValueError("Display name must not be empty")

    if gcs_uri:
      input_config["gcsSource"] = {"uri": [gcs_uri]}
    elif bigquery_uri:
      input_config["bigquerySource"] = {"uri": bigquery_uri}
    else:
      raise ValueError("Must provide either gcs uri or bigquery uri")

    ds = aiplatform_v1alpha1.Dataset(display_name=display_name,
                                     metadata_schema_uri=TABLES_METADATA_SCHEMA,
                                     metadata={"inputConfig": input_config})

    created = self._dataset_client.create_dataset(parent=self._parent,
                                                  dataset=ds).result()
    return created
