from jupyterlab_automl.service import AutoMLService


def list_datasets():
  return AutoMLService.get().get_datasets()

def list_models():
  return AutoMLService.get().get_models()

def create_dataset_from_dataframe(display_name, df):
  return AutoMLService.get().create_dataset_from_dataframe(display_name, df)

def predict(endpoint_id, instance):
  return AutoMLService.get().predict_tables(endpoint_id, instance)
