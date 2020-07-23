# Lint as: python3
"""Decorators that create handlers for the data tree"""

import jupyterlab_bigquery.list_items_handler.create_handler
from jupyterlab_bigquery.list_items_handler.service import BigQueryService
from jupyterlab_bigquery.list_items_handler.create_handler import _handler

SCOPE = ("https://www.googleapis.com/auth/cloud-platform",)


@_handler("POST", "listProjects")
def _list_projects(args):
  return BigQueryService.get().list_projects()


@_handler("POST", "listDatasets")
def _list_datasets(args):
  return BigQueryService.get().list_datasets(args["projectId"])


@_handler("POST", "listTables")
def _list_tables(args):
  return BigQueryService.get().list_tables(args["datasetId"])


@_handler("POST", "listModels")
def _list_models(args):
  return BigQueryService.get().list_models(args["datasetId"])


@_handler("POST", "search")
def _search(args):
  return BigQueryService.get().search_projects(args["searchKey"],
                                               args["projectId"])

@_handler("POST", "getProject")
def _get_project(args):
  custom_client = BigQueryService.get().create_custom_client(args["projectId"])
  return BigQueryService.get().get_project(custom_client)
