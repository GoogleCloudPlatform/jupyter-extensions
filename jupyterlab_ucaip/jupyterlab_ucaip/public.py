"""Public API methods for JupyterLab uCAIP extension
"""
import os
from typing import Dict

import pandas
from google.cloud import aiplatform_v1alpha1

from jupyterlab_ucaip.service import UCAIPService
from jupyterlab_ucaip.types import ModelFramework


class APIError(Exception):
  pass


def create_dataset(display_name: str,
                   dataframe: pandas.DataFrame = None,
                   file_path: str = None,
                   gcs_uri: str = None,
                   bigquery_uri: str = None) -> aiplatform_v1alpha1.Dataset:
  """Create a tabular dataset in uCAIP from a given source.
  One of dataframe, file_path, gcs_uri or bigquery_uri must be provided.

  Args:
      display_name (str): The user-defined name of the dataset
      dataframe (pandas.DataFrame, optional): Pandas DataFrame to import data from. Defaults to None.
      file_path (str, optional): Local file path to import data from. Defaults to None.
      gcs_uri (str, optional): URI of csv in GCS to import data from. Defaults to None.
      bigquery_uri (str, optional): URI of bigquery table to import data from. Defaults to None.

  Raises:
      APIError: Raised if no valid source is provided

  Returns:
      aiplatform_v1alpha1.Dataset: The newly created dataset
  """
  if dataframe is not None:
    return UCAIPService.get().create_dataset_from_dataframe(
        display_name, dataframe)
  elif file_path is not None:
    file_name = os.path.basename(file_path)
    if not os.path.exists(file_path):
      raise APIError("File path " + file_path + " not found.")
    with open(file_path, "rb") as f:
      return UCAIPService.get().create_dataset_from_file(
          display_name, file_name, f.read())
  elif gcs_uri is not None:
    return UCAIPService.get().create_dataset(display_name=display_name,
                                             gcs_uri=gcs_uri)
  elif bigquery_uri is not None:
    return UCAIPService.get().create_dataset(display_name=display_name,
                                             bigquery_uri=bigquery_uri)
  else:
    raise APIError(
        "One of { dataframe, file_path, gcs_uri, bigquery_uri } must be provided."
    )


def import_dataset(dataset_id: str) -> pandas.DataFrame:
  """Import an existing tables dataset to a Pandas DataFrame

  Args:
      dataset_id (str): ID of the dataset to import

  Returns:
      pandas.DataFrame
  """
  return UCAIPService.get().import_dataset(dataset_id)


def export_saved_model(display_name: str, model_path: str,
                       framework: ModelFramework) -> aiplatform_v1alpha1.Model:
  """Export a custom pretrained model to uCAIP from a folder containing the saved model

  Args:
      display_name (str): The user-defined name of the model
      model_path (str): Local path to the folder containing saved model artifacts (e.g saved_model.pb)
      framework (jupyterlab_ucaip.types.ModelFramework): The framework used to train the model

  Returns:
      aiplatform_v1alpha1.Model: The newly created model
  """
  return UCAIPService.get().export_saved_model(display_name, model_path,
                                               framework)


def predict(endpoint_id: str, instance: object) -> object:
  """Send a prediction request to a uCAIP model endpoint

  Args:
      endpoint_id (str): ID of the uCAIP endpoint
      instance (object): The prediction instance, should match the input format that the endpoint expects

  Returns:
      object: Prediction results from the model
  """
  return UCAIPService.get().predict_tables(endpoint_id, instance)


def create_training_pipeline(
    display_name: str, dataset_id: str, model_name: str, target_column: str,
    prediction_type: str, objective: str, budget_hours: int,
    transformations: Dict[str, Dict[str, str]]
) -> aiplatform_v1alpha1.TrainingPipeline:
  """Create a simple training pipeline and train a model from a tables dataset on uCAIP

  Args:
      display_name (str): The user-defined name of the training pipeline
      dataset_id (str): ID of the dataset to train from
      model_name (str): The user-defined name of the model to create
      target_column (str): Name of the target column
      prediction_type (str): Type of prediction on the target column, can be "regression" or "classification"
      objective (str): Optimization objective.
        Supported binary classification optimisation objectives: maximize-au-roc, minimize-log-loss, maximize-au-prc.
        Supported multi-class classification optimisation objective: minimize-log-loss.
        Supported regression optimization objectives: minimize-rmse, minimize-mae, minimize-rmsle.
      budget_hours (int): Budget of node-hours to allocate to train the model
      transformations (Dict[str, Dict[str, str]]): Transformations to apply to each column

  Returns:
      aiplatform_v1alpha1.TrainingPipeline: The newly created training pipeline
  """
  return UCAIPService.get().create_training_pipeline(display_name, dataset_id,
                                                     model_name, target_column,
                                                     prediction_type, objective,
                                                     budget_hours,
                                                     transformations)
