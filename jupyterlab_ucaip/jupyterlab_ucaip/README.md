<a name="jupyterlab_ucaip.public"></a>
# jupyterlab\_ucaip.public

Public API methods for JupyterLab uCAIP extension

<a name="jupyterlab_ucaip.public.create_dataset"></a>
#### create\_dataset

```python
create_dataset(display_name: str, dataframe: pandas.DataFrame = None, file_path: str = None, gcs_uri: str = None, bigquery_uri: str = None) -> aiplatform_v1alpha1.Dataset
```

Create a tabular dataset in uCAIP from a given source.
One of dataframe, file_path, gcs_uri or bigquery_uri must be provided.

**Arguments**:

- `display_name` _str_ - The user-defined name of the dataset
- `dataframe` _pandas.DataFrame, optional_ - Pandas DataFrame to import data from. Defaults to None.
- `file_path` _str, optional_ - Local file path to import data from. Defaults to None.
- `gcs_uri` _str, optional_ - URI of csv in GCS to import data from. Defaults to None.
- `bigquery_uri` _str, optional_ - URI of bigquery table to import data from. Defaults to None.
  

**Raises**:

- `APIError` - Raised if no valid source is provided
  

**Returns**:

- `aiplatform_v1alpha1.Dataset` - The newly created dataset

<a name="jupyterlab_ucaip.public.import_dataset"></a>
#### import\_dataset

```python
import_dataset(dataset_id: str) -> pandas.DataFrame
```

Import an existing tables dataset to a Pandas DataFrame

**Arguments**:

- `dataset_id` _str_ - ID of the dataset to import
  

**Returns**:

  pandas.DataFrame

<a name="jupyterlab_ucaip.public.export_saved_model"></a>
#### export\_saved\_model

```python
export_saved_model(display_name: str, model_path: str, framework: ModelFramework) -> aiplatform_v1alpha1.Model
```

Export a custom pretrained model to uCAIP from a folder containing the saved model

**Arguments**:

- `display_name` _str_ - The user-defined name of the model
- `model_path` _str_ - Local path to the folder containing saved model artifacts (e.g saved_model.pb)
- `framework` _jupyterlab_ucaip.types.ModelFramework_ - The framework used to train the model
  

**Returns**:

- `aiplatform_v1alpha1.Model` - The newly created model

<a name="jupyterlab_ucaip.public.predict"></a>
#### predict

```python
predict(endpoint_id: str, instance: object) -> object
```

Send a prediction request to a uCAIP model endpoint

**Arguments**:

- `endpoint_id` _str_ - ID of the uCAIP endpoint
- `instance` _object_ - The prediction instance, should match the input format that the endpoint expects
  

**Returns**:

- `object` - Prediction results from the model

<a name="jupyterlab_ucaip.public.create_training_pipeline"></a>
#### create\_training\_pipeline

```python
create_training_pipeline(display_name: str, dataset_id: str, model_name: str, target_column: str, prediction_type: str, objective: str, budget_hours: int, transformations: Dict[str, Dict[str, str]]) -> aiplatform_v1alpha1.TrainingPipeline
```

Create a simple training pipeline and train a model from a tables dataset on uCAIP

**Arguments**:

- `display_name` _str_ - The user-defined name of the training pipeline
- `dataset_id` _str_ - ID of the dataset to train from
- `model_name` _str_ - The user-defined name of the model to create
- `target_column` _str_ - Name of the target column
- `prediction_type` _str_ - Type of prediction on the target column, can be "regression" or "classification"
- `objective` _str_ - Optimization objective.
  Supported binary classification optimisation objectives: maximize-au-roc, minimize-log-loss, maximize-au-prc.
  Supported multi-class classification optimisation objective: minimize-log-loss.
  Supported regression optimization objectives: minimize-rmse, minimize-mae, minimize-rmsle.
- `budget_hours` _int_ - Budget of node-hours to allocate to train the model
- `transformations` _Dict[str, Dict[str, str]]_ - Transformations to apply to each column
  

**Returns**:

- `aiplatform_v1alpha1.TrainingPipeline` - The newly created training pipeline

<a name="jupyterlab_ucaip.types"></a>
# jupyterlab\_ucaip.types

<a name="jupyterlab_ucaip.types.ModelFramework"></a>
## ModelFramework Objects

```python
class ModelFramework(Enum)
```

Enum for the supported custom model frameworks

