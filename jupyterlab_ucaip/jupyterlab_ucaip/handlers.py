"""Request handler classes for the extension"""

import base64
import json

import tornado.gen as gen
from notebook.base.handlers import APIHandler, app_log

from jupyterlab_ucaip.service import UCAIPService, ManagementService

handlers = {}


def _create_handler(req_type, handler):

  class Handler(APIHandler):
    """Handles the request types sent from the frontend"""

    if req_type == "GET":

      @gen.coroutine
      def get(self, _input=""):
        args = {k: self.get_argument(k) for k in self.request.arguments}
        try:
          self.finish(json.dumps(handler(args)))
        except Exception as e:
          self._handle_exception(e)

    elif req_type == "POST":

      @gen.coroutine
      def post(self, _input=""):
        args = self.get_json_body()
        try:
          self.finish(json.dumps(handler(args)))
        except Exception as e:
          self._handle_exception(e)

    def _handle_exception(self, e):
      app_log.exception(str(e))
      self.set_status(500, str(e))
      self.finish({"error": {"message": str(e)}})

  return Handler


def _handler(request_type, endpoint):

  def decorator(func):
    handlers[endpoint] = _create_handler(request_type, func)
    return func

  return decorator


@_handler("GET", "datasets")
def _list_datasets(_):
  return UCAIPService.get().get_datasets()


@_handler("GET", "datasetDetails")
def _get_dataset_details(args):
  return UCAIPService.get().get_dataset_details(args["datasetId"])


@_handler("GET", "models")
def _list_models(_):
  return UCAIPService.get().get_models()


@_handler("GET", "modelEvaluation")
def _list_model_evaluations(args):
  return UCAIPService.get().get_model_evaluation(args["modelId"])


@_handler("GET", "pipeline")
def _get_pipeline(args):
  return UCAIPService.get().get_training_pipeline(args["pipelineId"])


@_handler("GET", "pipelines")
def _get_pipelines(_):
  return UCAIPService.get().get_training_pipelines()


@_handler("POST", "getEndpoints")
def _get_endpoints(args):
  return UCAIPService.get().get_endpoints(model_id=args["modelId"])


@_handler("POST", "getDeployingEndpoints")
def _check_deploying(args):
  return UCAIPService.get().get_deploying_endpoints(
      model_name=args["modelName"], endpoint_id=args["endpointId"])


@_handler("GET", "getAllEndpoints")
def _get_all_endpoints(args):
  return UCAIPService.get().get_all_endpoints()


@_handler("POST", "checkDeploying")
def _check_deploying(args):
  return UCAIPService.get().check_deploying(model_name=args["modelName"],
                                            endpoint_id=args["endpointId"])


@_handler("POST", "trainModel")
def _train_model(args):
  UCAIPService.get().create_training_pipeline(
      training_pipeline_name=args["pipelineName"],
      dataset_id=args["datasetId"],
      model_name=args["modelName"],
      target_column=args["targetColumn"],
      prediction_type=args["predictionType"],
      objective=args["objective"],
      budget_hours=args["budgetHours"],
      transformations=args["transformations"])
  return {"success": True}


@_handler("POST", "deployModel")
def _deploy_model(args):
  UCAIPService.get().deploy_model(model_id=args["modelId"],
                                  machine_type=args["machineType"],
                                  endpoint_id=args["endpointId"])
  return {"success": True}


@_handler("POST", "undeployModel")
def _undeploy_model(args):
  UCAIPService.get().undeploy_model(deployed_model_id=args["deployedModelId"],
                                    endpoint_id=args["endpointId"])
  return {"success": True}


@_handler("POST", "deleteEndpoint")
def _delete_endpoint(args):
  UCAIPService.get().delete_endpoint(endpoint_id=args["endpointId"])
  return {"success": True}


@_handler("POST", "predict")
def _predict_tables(args):
  return UCAIPService.get().predict_tables(endpoint_id=args["endpointId"],
                                           instance=args["inputs"])


@_handler("POST", "deleteDataset")
def _delete_dataset(args):
  UCAIPService.get().dataset_client.delete_dataset(name=args["datasetId"])
  return {"success": True}


@_handler("POST", "deleteModel")
def _delete_model(args):
  UCAIPService.get().model_client.delete_model(name=args["modelId"])
  return {"success": True}


@_handler("POST", "deleteEndpoint")
def _delete_endpoint(args):
  UCAIPService.get().delete_endpoint(endpoint_id=args["endpointId"])
  return {"success": True}


@_handler("GET", "managedServices")
def _managed_services(_):
  return ManagementService.get().get_managed_services()


@_handler("GET", "project")
def _project(_):
  return ManagementService.get().get_project()


@_handler("POST", "createTablesDataset")
def _create_tables_dataset(args):
  file_source = args.get("fileSource")
  if file_source:
    decoded = base64.decodebytes(file_source["data"])
    UCAIPService.get().create_dataset_from_file(
        display_name=args["displayName"],
        file_name=file_source["name"],
        file_data=decoded)
  else:
    UCAIPService.get().create_dataset(display_name=args["displayName"],
                                      gcs_uri=args.get("gcsSource"),
                                      bigquery_uri=args.get("bigquerySource"))
  return {"success": True}
