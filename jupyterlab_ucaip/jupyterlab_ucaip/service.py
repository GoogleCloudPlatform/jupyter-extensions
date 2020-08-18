"""Services for uCAIP extension that get reponses from the uCAIP API"""

import base64
import glob
import hashlib
import time
import uuid
import os
import pandas as pd
from enum import Enum
import re
from google.cloud import aiplatform_v1alpha1, bigquery, exceptions, storage
from google.protobuf.struct_pb2 import Value
from google.protobuf import json_format
from googleapiclient.discovery import build
from gcp_jupyterlab_shared.handlers import AuthProvider

from jupyterlab_ucaip.types import ModelFramework, ModelType, DatasetType

# TODO: Add ability to programatically set region
API_ENDPOINT = "us-central1-aiplatform.googleapis.com"
PREDICTION_ENDPOINT = "us-central1-prediction-aiplatform.googleapis.com"
TABLES_METADATA_SCHEMA = "gs://google-cloud-aiplatform/schema/dataset/metadata/tables_1.0.0.yaml"


def get_milli_time(dt):
  return dt.timestamp() * 1000


def parse_dataset_type(dataset):
  key = "aiplatform.googleapis.com/dataset_metadata_schema"
  for dt in DatasetType:
    if dt.value == dict(dataset.labels)[key]:
      return dt
  return DatasetType.OTHER


def parse_model_type(model):
  for mt in ModelType:
    if mt.value.lower() in model.metadata_schema_uri:
      return mt.value
  return ModelType.OTHER.value


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


class UCAIPService:
  """Provides an authenticated uCAIP Client and project info"""

  _instance = None

  def __init__(self):
    client_options = {"api_endpoint": API_ENDPOINT}
    self._dataset_client = aiplatform_v1alpha1.DatasetServiceClient(
        client_options=client_options)
    self._model_client = aiplatform_v1alpha1.ModelServiceClient(
        client_options=client_options)
    self._pipeline_client = aiplatform_v1alpha1.PipelineServiceClient(
        client_options=client_options)
    self._bigquery_client = bigquery.Client()
    self._endpoint_client = aiplatform_v1alpha1.EndpointServiceClient(
        client_options=client_options)
    self._prediction_client = aiplatform_v1alpha1.PredictionServiceClient(
        client_options={"api_endpoint": PREDICTION_ENDPOINT})
    self._gcs_client = storage.Client()
    self._project = AuthProvider.get().project
    self._parent = "projects/{}/locations/us-central1".format(self._project)
    self._gcs_bucket = "jupyterlab-ucaip-data-{}".format(
        hashlib.md5(self._project.encode('utf-8')).hexdigest())

  @property
  def dataset_client(self):
    return self._dataset_client

  @property
  def model_client(self):
    return self._model_client

  @classmethod
  def get(cls):
    if not cls._instance:
      cls._instance = UCAIPService()
    return cls._instance

  def _build_model(self, model):
    json_formatted = json_format.MessageToDict(model._pb)
    return {
        "id":
            model.name,
        "displayName":
            model.display_name,
        "pipelineId":
            model.training_pipeline,
        "createTime":
            get_milli_time(model.create_time),
        "updateTime":
            get_milli_time(model.update_time),
        "modelType":
            parse_model_type(model),
        "inputs":
            json_formatted.get("explanationSpec", {}).get("metadata",
                                                          {}).get("inputs"),
        "deployedModels":
            json_formatted.get("deployedModels"),
    }

  def get_models(self):
    response = self._model_client.list_models(parent=self._parent).models
    models = []
    for model in response:
      models.append(self._build_model(model))
    return models

  def _build_feature_importance(self, model_explanation):
    features = model_explanation["meanAttributions"][0][
        "featureAttributions"].items()
    return [{
        "name": key,
        "Percentage": round(val * 100, 3),
    } for key, val in features]

  def _build_confusion_matrix(self, confusion_matrix):
    rows = confusion_matrix["rows"]
    titles = []
    for column in confusion_matrix["annotationSpecs"]:
      titles.append(column["displayName"])
    rows.insert(0, titles)
    return rows

  def _build_confidence_metrics(self, confidence_metrics):
    labels = [
        "confidenceThreshold", "f1Score", "f1ScoreAt1", "precision",
        "precisionAt1", "recall", "recallAt1", "trueNegativeCount",
        "truePositiveCount", "falseNegativeCount", "falsePositiveCount",
        "falsePositiveRate", "falsePositiveRateAt1"
    ]
    metrics = []
    for confidence_metric in confidence_metrics:
      metric = {}
      for label in labels:
        metric[label] = confidence_metric.get(label, "NaN")
      metric["confidenceThreshold"] = confidence_metric.get(
          "confidenceThreshold", 0.0) * 100
      metrics.append(metric)
    return metrics

  def _build_model_evaluation(self, raw_eval):
    evaluation = json_format.MessageToDict(raw_eval._pb)

    optional_fields = [
        "auPrc", "auRoc", "logLoss", "rootMeanSquaredLogError", "rSquared",
        "meanAbsolutePercentageError", "rootMeanSquaredError",
        "meanAbsoluteError"
    ]

    metrics = evaluation["metrics"]
    model_eval = {"createTime": get_milli_time(raw_eval.create_time)}
    if "modelExplanation" in evaluation:
      model_eval["featureImportance"] = self._build_feature_importance(
          evaluation["modelExplanation"])
    if "confusionMatrix" in metrics:
      model_eval["confusionMatrix"] = self._build_confusion_matrix(
          metrics['confusionMatrix'])
    if "confidenceMetrics" in metrics:
      model_eval["confidenceMetrics"] = self._build_confidence_metrics(
          metrics["confidenceMetrics"])
    for field in optional_fields:
      model_eval[field] = metrics.get(field)
    return model_eval

  def get_model_evaluation(self, model_id):
    raw_eval = self._model_client.list_model_evaluations(
        parent=model_id).model_evaluations[0]

    return self._build_model_evaluation(raw_eval)

  def _build_feature_transformations(self, response):
    transformations = []
    for column in response:
      for data_type in column.keys():
        transformations.append({
            "dataType": data_type.capitalize(),
            "columnName": column[data_type]["columnName"]
        })
    return transformations

  def _get_training_pipeline(self, pipeline):
    objective = "unknown"
    # Detect training model type from gcs uri
    for ob in ["tables", "image_classification", "image_object_detection"]:
      if ob in pipeline.training_task_definition:
        objective = ob
        break

    end_time = int(time.time())
    if pipeline.end_time:
      end_time = pipeline.end_time.timestamp()

    return {
        "id": pipeline.name,
        "displayName": pipeline.display_name,
        "createTime": get_milli_time(pipeline.create_time),
        "updateTime": get_milli_time(pipeline.update_time),
        "elapsedTime": end_time - pipeline.start_time.timestamp(),
        "datasetId": pipeline.input_data_config.dataset_id,
        "state": pipeline.state.name.split("_")[-1],
        "error": pipeline.error.message,
        "objective": objective
    }

  def _build_training_pipeline(self, pipeline):
    optional_fields = [
        "targetColumn", "predictionType", "optimizationObjective",
        "budgetMilliNodeHours", "trainBudgetMilliNodeHours"
    ]
    training_task_inputs = json_format.MessageToDict(
        pipeline._pb.training_task_inputs)

    training_pipeline = self._get_training_pipeline(pipeline)

    if "transformations" in training_task_inputs:
      transformation_options = self._build_feature_transformations(
          training_task_inputs["transformations"])
      training_pipeline["transformationOptions"] = transformation_options
    for field in optional_fields:
      training_pipeline[field] = training_task_inputs.get(field)
    return training_pipeline

  def get_training_pipeline(self, pipeline_id):
    pipeline = self._pipeline_client.get_training_pipeline(name=pipeline_id)
    return self._build_training_pipeline(pipeline)

  def get_training_pipelines(self):
    pipelines = []
    for pipeline in self._pipeline_client.list_training_pipelines(
        parent=self._parent):
      pipelines.append(self._build_training_pipeline(pipeline))

    return pipelines

  def get_datasets(self):
    datasets = []
    dataset_list = self._dataset_client.list_datasets(
        parent=self._parent).datasets
    for dataset in dataset_list:
      dataset_type = parse_dataset_type(dataset)
      if dataset_type != DatasetType.OTHER:
        datasets.append({
            "id": dataset.name,
            "displayName": dataset.display_name,
            "createTime": get_milli_time(dataset.create_time),
            "updateTime": get_milli_time(dataset.update_time),
            "datasetType": dataset_type.value,
            "metadata": json_format.MessageToDict(dataset._pb.metadata),
        })
    return datasets

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

  def _get_gcs_bucket(self):
    try:
      return self._gcs_client.create_bucket(self._gcs_bucket)
    except exceptions.Conflict:
      # Bucket already exists
      return self._gcs_client.bucket(self._gcs_bucket)

  def create_dataset_from_file(self, display_name, file_name, file_data):
    bucket = self._get_gcs_bucket()
    key = "{}-{}".format(str(uuid.uuid4()), file_name)
    # Possible improvement: prepend md5 hash of file instead of uuid to
    # skip uploading the same existing file
    bucket.blob(key).upload_from_string(file_data)
    return self.create_dataset(display_name,
                               gcs_uri="gs://{}/{}".format(
                                   self._gcs_bucket, key))

  def create_dataset_from_dataframe(self, display_name, df):
    bucket = self._get_gcs_bucket()
    key = "{}-{}".format(str(uuid.uuid4()), "dataframe")
    data = df.to_csv(index=False).encode("utf-8")
    bucket.blob(key).upload_from_string(data)
    return self.create_dataset(display_name,
                               gcs_uri="gs://{}/{}".format(
                                   self._gcs_bucket, key))

  def _gcs_to_dataframe(self, uris):
    return pd.concat((pd.read_csv(uri) for uri in uris), ignore_index=True)

  def _import_bigquery_dataset(self, uri):
    _, project, dataset_id, table_id = re.split("://|[:]|[.]",
                                                uri)  #Split by ://, : or .
    tmp_name = "tmp/{}-{}-{}".format(str(uuid.uuid4()), dataset_id, table_id)
    destination_uri = "gs://{}/{}".format(self._get_gcs_bucket().name, tmp_name)
    dataset_ref = bigquery.DatasetReference(project, dataset_id)
    table_ref = dataset_ref.table(table_id)
    dataset = self._bigquery_client.get_dataset(dataset_ref)

    extract_job = self._bigquery_client.extract_table(
        table_ref,
        destination_uri,
        # Location must match that of the source table.
        location=dataset.location,
    )
    exported = extract_job.result()
    return exported.destination_uris

  def import_dataset(self, dataset_id):
    dataset = self._dataset_client.get_dataset(name=dataset_id)
    if parse_dataset_type(dataset) != DatasetType.TABLE:
      raise ValueError("Dataset provided is not a tables dataset")
    inputConfig = json_format.MessageToDict(dataset._pb.metadata).get(
        "inputConfig", {})
    if "gcsSource" in inputConfig:
      return self._gcs_to_dataframe(inputConfig["gcsSource"]["uri"])
    elif "bigquerySource" in inputConfig:
      tmp_uris = self._import_bigquery_dataset(
          inputConfig["bigquerySource"]["uri"])
      df = self._gcs_to_dataframe(tmp_uris)
      # Delete temp csvs
      for uri in tmp_uris:
        blob = storage.blob.Blob.from_string(uri)
        blob.delete(self._gcs_client)
      return df
    else:
      raise NotImplementedError("Export not implemented for this dataset")

  def _get_model(self, model_id):
    return self._model_client.get_model(name=model_id)

  def create_endpoint(self, name):
    display_name = "ucaip-extension/" + name
    endpoint = {"display_name": display_name}
    return self._endpoint_client.create_endpoint(parent=self._parent,
                                                 endpoint=endpoint).result()

  def delete_endpoint(self, endpoint_id):
    self._endpoint_client.delete_endpoint(name=endpoint_id).result()

  def _build_endpoint(self, deployed_model_id, endpoint):
    return {
        "deployedModelId": deployed_model_id,
        "id": endpoint.name,
        "displayName": endpoint.display_name,
        "models": len(endpoint.deployed_models),
        "updateTime": get_milli_time(endpoint.update_time),
    }

  def get_endpoints(self, model_id):
    model = self._get_model(model_id)
    endpoints = []
    if model.deployed_models:
      for deployed_model in model.deployed_models:
        endpoint = self._endpoint_client.get_endpoint(
            name=deployed_model.endpoint)
        built = self._build_endpoint(deployed_model.deployed_model_id, endpoint)
        endpoints.append(built)
    return endpoints

  def get_all_endpoints(self):
    gcp_endpoints = self._endpoint_client.list_endpoints(
        parent=self._parent).endpoints
    endpoints = []
    for endpoint in gcp_endpoints:
      built = self._build_endpoint("None", endpoint)
      endpoints.append(built)
    return endpoints

  def get_deploying_endpoints(self, model_name, endpoint_id):
    endpoints = self._endpoint_client.list_endpoints(
        parent=self._parent).endpoints
    if endpoint_id:
      filtered = filter(lambda x: endpoint_id == x.name, endpoints)
      filtered = list(filtered)
    else:
      name = "ucaip-extension/" + model_name
      filtered = filter(lambda x: name == x.display_name, endpoints)
      filtered = list(filtered)
    if len(filtered) > 0:
      return [self._build_endpoint("None", filtered[0])]
    return []

  def get_all_endpoints(self):
    gcp_endpoints = self._endpoint_client.list_endpoints(
        parent=self._parent).endpoints
    endpoints = []
    for endpoint in gcp_endpoints:
      built = self._build_endpoint("None", endpoint)
      endpoints.append(built)
    return endpoints

  def deploy_model(self,
                   model_id,
                   machine_type="n1-standard-2",
                   min_replicas=1,
                   endpoint_id=None):
    model = self._get_model(model_id)
    if not endpoint_id:
      endpoint_id = self.create_endpoint(model.display_name).name
    traffic_split = {"0": 100}
    machine_spec = {"machine_type": machine_type}
    dedicated_resources = {
        "machine_spec": machine_spec,
        "min_replica_count": min_replicas
    }
    deployed_model = {
        "model": model_id,
        "display_name": model.display_name,
        "dedicated_resources": dedicated_resources
    }
    self._endpoint_client.deploy_model(endpoint=endpoint_id,
                                       deployed_model=deployed_model,
                                       traffic_split=traffic_split)

  def undeploy_model(self, deployed_model_id, endpoint_id):
    try:
      self._endpoint_client.undeploy_model(
          endpoint=endpoint_id, deployed_model_id=deployed_model_id).result()
    except TypeError:
      print(
          'TypeError when undeploying model. Known error. Fixed in later versions of the API.'
      )

  def predict_tables(self, endpoint_id, instance):
    parameters_dict = {}
    parameters = json_format.ParseDict(parameters_dict, Value())
    instances_list = [instance]
    instances = [json_format.ParseDict(s, Value()) for s in instances_list]
    response = self._prediction_client.predict(endpoint=endpoint_id,
                                               parameters=parameters,
                                               instances=instances)
    return json_format.MessageToDict(response._pb.predictions[0])

  def _copy_local_directory_to_gcs(self, local_path, bucket, gcs_path):
    if not os.path.isdir(local_path):
      raise ValueError("{} is not a valid directory".format(
          os.path.abspath(local_path)))
    for local_file in glob.glob(local_path + '/**', recursive=True):
      if not os.path.isfile(local_file):
        continue
      remote_path = os.path.join(gcs_path, local_file[1 + len(local_path):])
      blob = bucket.blob(remote_path)
      blob.upload_from_filename(local_file)

  def export_saved_model(self, display_name, model_path, framework):
    # Strip out non alphanumeric chars of model name and prepend uuid
    name = "{}-{}".format(re.sub(r'\W+', '', display_name), str(uuid.uuid4()))
    key = "models/" + name
    bucket = self._get_gcs_bucket()

    # Upload model artifacts to GCS
    self._copy_local_directory_to_gcs(model_path, bucket, key)

    # https://pantheon.corp.google.com/gcr/images/cloud-aiplatform/GLOBAL/prediction?gcrImageListsize=30
    if not isinstance(framework, str):
      framework = framework.value

    container_spec = aiplatform_v1alpha1.ModelContainerSpec(
        image_uri="gcr.io/cloud-aiplatform/prediction/{}:latest".format(
            framework))
    model = aiplatform_v1alpha1.Model(display_name=display_name,
                                      artifact_uri="gs://{}/{}".format(
                                          bucket.name, key),
                                      container_spec=container_spec)
    return self._model_client.upload_model(parent=self._parent,
                                           model=model).result()

  def get_dataset_details(self, dataset_id):
    df = self.import_dataset(dataset_id)
    columns = list(df.columns)
    return [{"fieldName": column} for column in columns]

  def _build_create_training_pipeline_response(self, response):
    return {
        "training_display_name":
            response.display_name,
        "training_task_inputs":
            json_format.MessageToDict(response._pb.training_task_inputs),
        "state":
            response.state,
        "create_time":
            response.create_time,
        "dataset_id":
            response.input_data_config.dataset_id,
        "training_fraction":
            response.input_data_config.fraction_split.training_fraction,
        "validation_fraction":
            response.input_data_config.fraction_split.validation_fraction,
        "test_fraction":
            response.input_data_config.fraction_split.test_fraction,
        "model_display_name":
            response.model_to_upload.display_name
    }

  def create_training_pipeline(self, training_pipeline_name, dataset_id,
                               model_name, target_column, prediction_type,
                               objective, budget_hours, transformations):

    training_task_inputs = {
        "targetColumn": target_column,
        "predictionType": prediction_type,
        "transformations": transformations,
        "trainBudgetMilliNodeHours": budget_hours * 1000,
        "disableEarlyStopping": False,
        "optimizationObjective": objective,
    }

    if objective == "maximize-precision-at-recall":
      training_task_inputs["optimizationObjectiveRecallValue"] = 0.5
    elif objective == "maximize-recall-at-precision":
      training_task_inputs["optimizationObjectivePrecisionValue"] = 0.5

    training_pipeline = {
        "display_name":
            training_pipeline_name,
        "training_task_definition":
            "gs://google-cloud-aiplatform/schema/trainingjob/definition/automl_tables_1.0.0.yaml",
        "training_task_inputs":
            json_format.ParseDict(training_task_inputs, Value()),
        "input_data_config": {
            "dataset_id": dataset_id,
            "fraction_split": {
                "training_fraction": 0.8,
                "validation_fraction": 0.1,
                "test_fraction": 0.1,
            },
        },
        "model_to_upload": {
            "display_name": model_name
        },
    }

    response = self._pipeline_client.create_training_pipeline(
        parent=self._parent, training_pipeline=training_pipeline)

    return self._build_create_training_pipeline_response(response)
