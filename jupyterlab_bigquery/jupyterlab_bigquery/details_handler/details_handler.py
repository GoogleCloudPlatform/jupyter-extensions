# Lint as: python3
"""Decorators that create handlers for the details panels"""

from jupyterlab_bigquery.details_handler.service import BigQueryService
from jupyterlab_bigquery.create_handler.create_handler import _handler

SCOPE = ("https://www.googleapis.com/auth/cloud-platform",)


@_handler("POST", "datasetDetails")
def _get_dataset_details(args):
  return BigQueryService.get().get_dataset_details(args['datasetId'])


@_handler("POST", "tableDetails")
def _get_table_details(args):
  return BigQueryService.get().get_table_details(args["tableId"])


@_handler("POST", "tablePreview")
def _get_table_preview(args):
  return BigQueryService.get().get_table_preview(args["tableId"])


@_handler("POST", "viewDetails")
def _get_view_details(args):
  return BigQueryService.get().get_view_details(args["viewId"])


@_handler("POST", "modelDetails")
def _get_model_details(args):
  return BigQueryService.get().get_model_details(args["modelId"])

@_handler("POST", "trainingRunDetails")
def _get_training_run_details(args):
  return BigQueryService.get().get_training_run_details(args["modelId"], int(args["runIndex"]))