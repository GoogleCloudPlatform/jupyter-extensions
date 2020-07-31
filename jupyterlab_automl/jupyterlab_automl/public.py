from jupyterlab_automl.service import AutoMLService


def export_dataset(dataset_id):
  return AutoMLService.get().export_dataset(dataset_id)

def create_training_pipeline(training_pipeline_name, dataset_id, model_name,
    target_column, prediction_type, objective, budget_hours, transformations):
  return AutoMLService.get().create_training_pipeline(training_pipeline_name,
      dataset_id, model_name, target_column, prediction_type, objective,
      budget_hours, transformations,)