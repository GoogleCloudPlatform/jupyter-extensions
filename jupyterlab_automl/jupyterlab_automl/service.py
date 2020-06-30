"""Services for AutoML extension backend"""

import math
from collections import defaultdict
from enum import Enum

from google.cloud import automl_v1beta1

from gcp_jupyterlab_shared.handlers import AuthProvider

from googleapiclient.discovery import build


def parse_dataset_type(dataset):
  for dt in DatasetType:
    if dt.value == dataset.name.split("/")[-1][:3]:
      return dt
  return DatasetType.other


class DatasetType(Enum):
  other = "other"
  TBL = "TBL"
  ICN = "ICN"
  IOD = "IOD"


class ColumnType(Enum):
  Unspecified = 0
  Numeric = 3
  Timestamp = 4
  String = 6
  Array = 8
  Struct = 9
  Categorical = 10
  Unrecognized = -1


class Months(Enum):
  Jan = 1
  Feb = 2
  Mar = 3
  Apr = 4
  May = 5
  Jun = 6
  Jul = 7
  Aug = 8
  Sep = 9
  Oct = 10
  Nov = 11
  Dec = 12


class Days(Enum):
  Mon = 1
  Tue = 2
  Wed = 3
  Thu = 4
  Fri = 5
  Sat = 6
  Sun = 7


class ChartInfo(Enum):
  name = "name"
  amount = "Number of Instances"


class ManagementService:
  """Provides an authenicated Service Management Client"""

  _instance = None

  @classmethod
  def get(cls):
    if not cls._instance:
      cls._instance = ManagementService()
    return cls._instance

  def get_managed_services(self):
    consumerId = 'project:' + AuthProvider.get().project
    request = build('servicemanagement',
                    'v1').services().list(consumerId=consumerId)
    return request.execute()

  def get_project(self):
    return AuthProvider.get().project


class AutoMLService:
  """Provides an authenticated AutoML Client and project info"""

  _instance = None

  def __init__(self):
    self._client = automl_v1beta1.AutoMlClient()
    self._parent = self._client.location_path(AuthProvider.get().project,
                                              "us-central1")

  @property
  def client(self):
    return self._client

  @classmethod
  def get(cls):
    if not cls._instance:
      cls._instance = AutoMLService()
    return cls._instance

  def get_models(self):
    models = self._client.list_models(self._parent)
    return {
        "models": [{
            "id": model.name,
            "displayName": model.display_name,
            "datasetId": model.dataset_id,
            "updateTime": model.update_time.ToMilliseconds(),
            "deploymentState": model.deployment_state,
            "metadata": "",
        } for model in models]
    }

  def get_datasets(self):
    datasets = []
    for dataset in self._client.list_datasets(self._parent):
      dataset_type, metadata = self._get_dataset_metadata(dataset)
      if dataset_type != DatasetType.other:
        datasets.append({
            "id": dataset.name,
            "displayName": dataset.display_name,
            "description": dataset.description,
            "createTime": dataset.create_time.ToMilliseconds(),
            "exampleCount": dataset.example_count,
            "datasetType": dataset_type.value,
            "metadata": metadata,
        })
    return {"datasets": datasets}

  def _get_dataset_metadata(self, dataset):
    dataset_type = parse_dataset_type(dataset)
    metadata = ""
    if dataset_type == DatasetType.TBL:
      metadata = {
          "primary_table_spec_id":
              dataset.tables_dataset_metadata.primary_table_spec_id,
          "target_column_spec_id":
              dataset.tables_dataset_metadata.target_column_spec_id,
          "weight_column_spec_id":
              dataset.tables_dataset_metadata.weight_column_spec_id,
          "ml_use_column_spec_id":
              dataset.tables_dataset_metadata.ml_use_column_spec_id,
          "stats_update_time":
              dataset.tables_dataset_metadata.stats_update_time.ToMilliseconds(
              ),
      }
    elif dataset_type == DatasetType.ICN:
      metadata = {
          "classification_type":
              dataset.image_classification_dataset_metadata.classification_type,
      }
    elif dataset_type == DatasetType.IOD:
      metadata = ""
    return dataset_type, metadata

  def get_table_specs(self, dataset_id):
    table_specs = []
    for table_spec in self._client.list_table_specs(dataset_id):
      column_spec, chart_summary = self.get_column_specs(table_spec)
      table_specs.append({
          "id": table_spec.name,
          "rowCount": table_spec.row_count,
          "validRowCount": table_spec.valid_row_count,
          "columnCount": table_spec.column_count,
          "columnSpecs": column_spec,
          "chartSummary": chart_summary,
      })
    return {"tableSpecs": table_specs}

  def get_column_specs(self, table_spec):
    column_specs = []
    type_summary = defaultdict(int)
    for column_spec in self._client.list_column_specs(table_spec.name):
      try:
        type_code = ColumnType(column_spec.data_type.type_code).name
      except Exception:
        type_code = ColumnType.unrecognized.name
      detail_panel = self._get_detail_panel(
          column_spec,
          table_spec.row_count - column_spec.data_stats.null_value_count,
      )
      type_summary[type_code] += 1
      column_specs.append({
          "id":
              column_spec.name,
          "dataType":
              type_code,
          "displayName":
              column_spec.display_name,
          "distinctValueCount":
              column_spec.data_stats.distinct_value_count,
          "invalidValueCount":
              table_spec.row_count - column_spec.data_stats.valid_value_count,
          "nullValueCount":
              str(column_spec.data_stats.null_value_count) + " (" + str(
                  math.floor(column_spec.data_stats.null_value_count /
                             table_spec.row_count * 100)) + "%)",
          "nullable":
              column_spec.data_type.nullable,
          "detailPanel":
              detail_panel,
      })
    columns_summary = []
    for key, val in type_summary.items():
      columns_summary.append({
          ChartInfo.name.value: key,
          ChartInfo.amount.value: val
      })
    return column_specs, columns_summary

  def _get_bucket_label(self, bucket):
    if bucket.min == float("-inf"):
      return "[" + str(bucket.min) + ", " + str(round(bucket.max)) + "]"
    elif bucket.max == float("inf"):
      return "[" + str(round(bucket.min)) + ", " + str(bucket.max) + "]"
    else:
      return "[" + str(round(bucket.min)) + ", " + str(round(bucket.max)) + "]"

  def _get_detail_panel(self, column_spec, count):
    chart_data = []
    if column_spec.data_type.type_code == 3:
      mean = round(column_spec.data_stats.float64_stats.mean, 2)
      standard_deviation = round(
          column_spec.data_stats.float64_stats.standard_deviation, 2)
      for bucket in column_spec.data_stats.float64_stats.histogram_buckets:
        chart_data.append({
            ChartInfo.name.value: self._get_bucket_label(bucket),
            ChartInfo.amount.value: bucket.count,
        })
      return [chart_data, mean, standard_deviation]
    elif column_spec.data_type.type_code == 10:
      try:
        div = (
            column_spec.data_stats.category_stats.top_category_stats[0].count /
            count)
        rounded = round(div * 100, 3)
        most_common = (
            column_spec.data_stats.category_stats.top_category_stats[0].value +
            " (" + str(rounded) + "%)")
      except:
        most_common = ""
      for stat in column_spec.data_stats.category_stats.top_category_stats:
        chart_data.append({
            ChartInfo.name.value: stat.value,
            ChartInfo.amount.value: stat.count,
        })
      return [chart_data, most_common]
    elif column_spec.data_type.type_code == 4:
      month_chart = []
      day_chart = []
      time_chart = []
      for month, amount in dict(
          column_spec.data_stats.timestamp_stats.
          granular_stats["month_of_year"].buckets).items():
        month_chart.append({
            ChartInfo.name.value: Months(month).name,
            ChartInfo.amount.value: amount,
        })
      for day, amount in dict(column_spec.data_stats.timestamp_stats.
                              granular_stats["day_of_week"].buckets).items():
        day_chart.append({
            ChartInfo.name.value: Days(day).name,
            ChartInfo.amount.value: amount,
        })
      for hour, amount in dict(column_spec.data_stats.timestamp_stats.
                               granular_stats["hour_of_day"].buckets).items():
        time_chart.append({
            ChartInfo.name.value: str(hour) + ":00",
            ChartInfo.amount.value: amount,
        })
      return [month_chart, day_chart, time_chart]
    else:
      return []
