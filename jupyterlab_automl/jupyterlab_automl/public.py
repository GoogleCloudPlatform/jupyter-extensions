from jupyterlab_automl.service import AutoMLService


def predict(endpoint_id, instance):
  return AutoMLService.get().predict_tables(endpoint_id, instance)