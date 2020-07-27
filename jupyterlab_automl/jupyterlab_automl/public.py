from jupyterlab_automl.service import AutoMLService


def predict(endpoint_id, instance):
  return AutoMLService.get().predict_tables(endpoint_id, instance)

def predict_df(endpoint_id, df):
  return AutoMLService.get().predict_df(endpoint_id, df)
