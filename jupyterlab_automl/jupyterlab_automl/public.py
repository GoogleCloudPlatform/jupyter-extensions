import os
from typing import List, Dict
from jupyterlab_automl.service import AutoMLService, ModelFramework
import pandas as pd


class APIError(Exception):
  pass


def list_datasets():
  return AutoMLService.get().get_datasets()


def list_models():
  return AutoMLService.get().get_models()


def create_dataset(display_name,
                   dataframe: pd.DataFrame = None,
                   file_path: str = None,
                   gcs_uri: str = None,
                   bigquery_uri: str = None):
  if dataframe is not None:
    return AutoMLService.get().create_dataset_from_dataframe(display_name, dataframe)
  elif file_path is not None:
    file_name = os.path.basename(file_path)
    with open(file_path, "rb") as f:
      return AutoMLService.get().create_dataset_from_file(
          display_name, file_name, f.read())
  elif gcs_uri is not None:
    return AutoMLService.get().create_dataset(display_name=display_name,
                                              gcs_uri=gcs_uri)
  elif bigquery_uri is not None:
    return AutoMLService.get().create_dataset(display_name=display_name,
                                              bigquery_uri=bigquery_uri)
  else:
    raise APIError(
        "One of { dataframe, file_path, gcs_uri, bigquery_uri } must be provided."
    )


def export_dataset(dataset_id: str):
  return AutoMLService.get().export_dataset(dataset_id)


def import_saved_model(display_name: str, model_path: str,
                       framework: ModelFramework):
  return AutoMLService.get().import_saved_model(display_name, model_path,
                                                framework)


def predict(endpoint_id: str, instance: object):
  return AutoMLService.get().predict_tables(endpoint_id, instance)


def create_training_pipeline(display_name: str, dataset_id: str,
                             model_name: str, target_column: str,
                             prediction_type: str, objective: str,
                             budget_hours: int, transformations: Dict[str, Dict[str, str]]):
  return AutoMLService.get().create_training_pipeline(display_name, dataset_id,
                                                      model_name, target_column,
                                                      prediction_type,
                                                      objective, budget_hours,
                                                      transformations)
