"""Services for AutoML extension that get reponses from the uCAIP API"""

import base64
import hashlib
import uuid
from enum import Enum
from google.protobuf.struct_pb2 import Value
from google.cloud import aiplatform_v1alpha1, exceptions, storage
from google.cloud import aiplatform
from google.protobuf import json_format
from googleapiclient.discovery import build
from gcp_jupyterlab_shared.handlers import AuthProvider
from google.cloud.aiplatform_v1alpha1.types import PredictRequest

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


class ModelType(Enum):
  OTHER = "OTHER"
  TABLE = "TABLE"
  IMAGE = "IMAGE"


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
    self._dataset_client = aiplatform.DatasetServiceClient(
        client_options=client_options)
    self._model_client = aiplatform_v1alpha1.ModelServiceClient(
        client_options=client_options)
    self._pipeline_client = aiplatform_v1alpha1.PipelineServiceClient(
        client_options=client_options)
    self._endpoint_client = aiplatform_v1alpha1.EndpointServiceClient(
        client_options=client_options)
    self._prediction_client = aiplatform_v1alpha1.PredictionServiceClient(
        client_options={"api_endpoint": PREDICTION_ENDPOINT})
    self._gcs_client = storage.Client()
    self._project = AuthProvider.get().project
    self._parent = "projects/{}/locations/us-central1".format(self._project)
    self._gcs_bucket = "jupyterlab-ucaip-data-{}".format(
        hashlib.md5(self._project.encode('utf-8')).hexdigest())
    self._endpoint = None

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
    return [{
        "id": model.name,
        "displayName": model.display_name,
        "pipelineId": model.training_pipeline,
        "createTime": get_milli_time(model.create_time),
        "updateTime": get_milli_time(model.update_time),
        "etag": model.etag,
        "modelType": parse_model_type(model)
    } for model in models]

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
      model_eval[field] = metrics.get(field, None)
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

  def get_pipeline(self, pipeline_id):
    pipeline = self._pipeline_client.get_training_pipeline(name=pipeline_id)
    optional_fields = [
        "targetColumn", "predictionType", "optimizationObjective",
        "budgetMilliNodeHours", "trainBudgetMilliNodeHours"
    ]
    training_task_inputs = json_format.MessageToDict(
        pipeline._pb.training_task_inputs)
    training_pipeline = {
        "id": pipeline.name,
        "displayName": pipeline.display_name,
        "createTime": get_milli_time(pipeline.create_time),
        "updateTime": get_milli_time(pipeline.update_time),
        "elapsedTime": (pipeline.end_time - pipeline.start_time).seconds,
        "datasetId": pipeline.input_data_config.dataset_id,
    }
    if "transformations" in training_task_inputs:
      transformation_options = self._build_feature_transformations(
          training_task_inputs["transformations"])
      training_pipeline["transformationOptions"] = transformation_options
    for field in optional_fields:
      training_pipeline[field] = training_task_inputs.get(field, None)
    return training_pipeline

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
            "etag": dataset.etag,
            "metadata": json_format.MessageToDict(dataset._pb.metadata),
        })
    return datasets

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

  def create_dataset_from_file(self, display_name, file_name, file_data):
    try:
      bucket = self._gcs_client.create_bucket(self._gcs_bucket)
    except exceptions.Conflict:
      # Bucket already exists
      bucket = self._gcs_client.bucket(self._gcs_bucket)

    key = "{}-{}".format(str(uuid.uuid4()), file_name)
    # Possible improvement: prepend md5 hash of file instead of uuid to
    # skip uploading the same existing file
    decoded = base64.decodebytes(file_data.encode("ascii"))
    bucket.blob(key).upload_from_string(decoded)
    return self.create_dataset(display_name,
                               gcs_uri="gs://{}/{}".format(
                                   self._gcs_bucket, key))

  def _get_model(self, model_id):
    return self._model_client.get_model(name=model_id)
  
  def create_endpoint(self, name):
    display_name = "ucaip-extension/" + name
    endpoint = {"display_name": display_name}
    return self._endpoint_client.create_endpoint(parent=self._parent, endpoint=endpoint).result()
  
  def delete_endpoint(self, endpoint_id):
    self._endpoint_client.delete_endpoint(name=endpoint_id).result()

  def check_deployed(self, model_id):
    endpoints = self._endpoint_client.list_endpoints(parent=self._parent).endpoints
    name = "ucaip-extension/"
    name += self._get_model(model_id).display_name
    filtered = filter(lambda x: name in x.display_name, endpoints)
    filtered = list(filtered)
    for endpoint in filtered:
      for deployed_model in endpoint.deployed_models:
        if deployed_model.model == model_id:
          return {
              "state": 1,
              "deployedModel": {
                  "deployedModelId": deployed_model.id,
                  "endpointId": endpoint.name,
            }
          }
    if len(filtered) != 0:
      return {
          "state": 0,
      }
    else:
      return {
          "state": -1
      }

  def deploy_model(self, model_id, machine_type="n1-standard-2", endpoint_id=None):
    model = self._get_model(model_id)
    if not endpoint_id:
      endpoint_id = self.create_endpoint(model.display_name).name
    traffic_split = {"0": 100}
    machine_spec = {"machine_type": machine_type}
    dedicated_resources = {"machine_spec": machine_spec, "min_replica_count": 1}
    deployed_model = {"model": model_id, "display_name": model.display_name, "dedicated_resources": dedicated_resources}
    self._endpoint_client.deploy_model(endpoint=endpoint_id, deployed_model=deployed_model, traffic_split=traffic_split)

  def undeploy_model(self, deployed_model_id, endpoint_id):
    try:
      self._endpoint_client.undeploy_model(endpoint=endpoint_id, deployed_model_id=deployed_model_id).result()
    except:
      print('TypeError when undeploying model. Known error. Fixed in later versions of the API.')

  def predict_tables(self, endpoint_id, instance):
    parameters_dict = {}
    parameters = json_format.ParseDict(parameters_dict, Value())
    instances_list = [instance]
    instances = [json_format.ParseDict(s, Value()) for s in instances_list]
    response = self._prediction_client.predict(endpoint=endpoint_id, parameters=parameters, instances=instances)
    prediction = response.predictions[0]
    readable = []
    labels = prediction["classes"]
    values = prediction["scores"]
    for i, _ in enumerate(labels):
      readable.append({
          "label": labels[i],
          "confidence": values[i],
      })
    return readable

  def predict_df(self, endpoint_id, df):
    parameters_dict = {}
    parameters = json_format.ParseDict(parameters_dict, Value())
    instances_list = df.to_dict('index').values()
    instances = [json_format.ParseDict(s, Value()) for s in instances_list]
    response = self._prediction_client.predict(endpoint=endpoint_id, parameters=parameters, instances=instances)
    predictions = response.predictions
    num_new_columns = len(predictions[0]["classes"]) + len(predictions[0]["scores"])
    new_columns = [ [] for _ in range(num_new_columns)]
    for prediction in predictions:
      labels = prediction["classes"]
      values = prediction["scores"]
      i = 0
      j = 0
      while i < len(labels):
        new_columns[j].append(labels[i])
        new_columns[j + 1].append(values[i])
        i += 1
        j += 2
    i = 0
    j = 0
    while i < num_new_columns:
      label = "Label" + str(j)
      confidence = "Confidence" + str(j)
      df[label] = new_columns[i]
      df[confidence] = new_columns[i + 1]
      i += 2
      j += 1
    return df

# instance = {
# 	'county_fips_code': 'asdf',
# 	'state_fips_code': 'asdf',
# 	'county_name': 'asdf',
# 	'county_name_lsad': 'asdf',
# 	'state_name': 'sdf',
# 	'predicted_metric': 'ads',
# 	'forecast_date': 'asdfdasdf',
# 	'target_prediction_date': 'asfd',
# }
# print(AutoMLService().predict('projects/222309772370/locations/us-central1/endpoints/130745126682099712', instance))