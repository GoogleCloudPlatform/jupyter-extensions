from jupyterlab_automl.service import AutoMLService, ModelFramework
import pandas as pd


def list_datasets():
  return AutoMLService.get().get_datasets()


def list_models():
  return AutoMLService.get().get_models()


def create_dataset_from_dataframe(display_name: str, df: pd.Dataframe):
  return AutoMLService.get().create_dataset_from_dataframe(display_name, df)


def export_dataset(dataset_id: str):
  return AutoMLService.get().export_dataset(dataset_id)


def import_saved_model(display_name: str, model_path: str,
                       framework: ModelFramework):
  return AutoMLService.get().import_saved_model(display_name, model_path,
                                                framework)
