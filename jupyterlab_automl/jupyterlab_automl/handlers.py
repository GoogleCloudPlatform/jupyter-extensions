# Lint as: python3
"""Request handler classes for the extensions."""

import json
import tornado.gen as gen
import math

from collections import namedtuple, defaultdict
from enum import Enum
from notebook.base.handlers import APIHandler, app_log
from google.cloud import automl_v1beta1

import google.auth
from google.auth.exceptions import GoogleAuthError
from google.auth.transport.requests import Request

from jupyterlab_automl.version import VERSION

SCOPE = ("https://www.googleapis.com/auth/cloud-platform",)


class ColumnType(Enum):
    Unspecified = 0
    Numeric = 3
    Timestamp = 4
    String = 6
    Array = 8
    Struct = 9
    Categorical = 10
    Unrecognized = -1


class DatasetType(Enum):
    other = "other"
    TBL = "TBL"
    ICN = "ICN"
    IOD = "IOD"


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


class AuthProvider:
    """Provides default GCP authentication credential."""

    _instance = None

    def __init__(self):
        self._auth, self._project = google.auth.default(scopes=SCOPE)

    @property
    def project(self):
        return self._project

    def refresh(self):
        if not self._auth.valid:
            app_log.info("Refreshing Google Cloud Credential")
            try:
                self._auth.refresh(Request())
            except GoogleAuthError:
                msg = "Unable to refresh Google Cloud Credential"
                app_log.exception(msg)
                raise

    def get_header(self):
        return {"Authorization": "Bearer {}".format(self._auth.token)}

    @classmethod
    def get(cls):
        if not cls._instance:
            auth = AuthProvider()
            cls._instance = auth
        cls._instance.refresh()
        return cls._instance


def create_automl_client():
    return automl_v1beta1.AutoMlClient()


def create_automl_parent(client):
    return client.location_path(AuthProvider.get().project, "us-central1")


def get_bucket_label(bucket):
    if bucket.min == float("-inf"):
        return "[" + str(bucket.min) + ", " + str(round(bucket.max)) + "]"
    elif bucket.max == float("inf"):
        return "[" + str(round(bucket.min)) + ", " + str(bucket.max) + "]"
    else:
        return "[" + str(round(bucket.min)) + ", " + str(round(bucket.max)) + "]"


def get_detail_panel(column_spec, count):
    chart_data = []
    if column_spec.data_type.type_code == 3:
        mean = round(column_spec.data_stats.float64_stats.mean, 2)
        standard_deviation = round(
            column_spec.data_stats.float64_stats.standard_deviation, 2
        )
        for bucket in column_spec.data_stats.float64_stats.histogram_buckets:
            chart_data.append(
                {
                    ChartInfo.name.value: get_bucket_label(bucket),
                    ChartInfo.amount.value: bucket.count,
                }
            )
        return [chart_data, mean, standard_deviation]
    elif column_spec.data_type.type_code == 10:
        try:
            div = (
                column_spec.data_stats.category_stats.top_category_stats[0].count
                / count
            )
            rounded = round(div * 100, 3)
            most_common = (
                column_spec.data_stats.category_stats.top_category_stats[0].value
                + " ("
                + str(rounded)
                + "%)"
            )
        except:
            most_common = ""
        for stat in column_spec.data_stats.category_stats.top_category_stats:
            chart_data.append(
                {ChartInfo.name.value: stat.value, ChartInfo.amount.value: stat.count}
            )
        return [chart_data, most_common]
    elif column_spec.data_type.type_code == 4:
        month_chart = []
        day_chart = []
        time_chart = []
        for month, amount in dict(
            column_spec.data_stats.timestamp_stats.granular_stats[
                "month_of_year"
            ].buckets
        ).items():
            month_chart.append(
                {
                    ChartInfo.name.value: Months(month).name,
                    ChartInfo.amount.value: amount,
                }
            )
        for day, amount in dict(
            column_spec.data_stats.timestamp_stats.granular_stats["day_of_week"].buckets
        ).items():
            day_chart.append(
                {ChartInfo.name.value: Days(day).name, ChartInfo.amount.value: amount}
            )
        for hour, amount in dict(
            column_spec.data_stats.timestamp_stats.granular_stats["hour_of_day"].buckets
        ).items():
            time_chart.append(
                {
                    ChartInfo.name.value: str(hour) + ":00",
                    ChartInfo.amount.value: amount,
                }
            )
        return [month_chart, day_chart, time_chart]
    else:
        return []


def get_column_specs(client, table_spec):
    column_specs = []
    type_summary = defaultdict(int)
    for column_spec in client.list_column_specs(table_spec.name):
        try:
            type_code = ColumnType(column_spec.data_type.type_code).name
        except:
            type_code = ColumnType.unrecognized.name
        detail_panel = get_detail_panel(
            column_spec, table_spec.row_count - column_spec.data_stats.null_value_count
        )
        type_summary[type_code] += 1
        column_specs.append(
            {
                "id": column_spec.name,
                "dataType": type_code,
                "displayName": column_spec.display_name,
                "distinctValueCount": column_spec.data_stats.distinct_value_count,
                "invalidValueCount": table_spec.row_count
                - column_spec.data_stats.valid_value_count,
                "nullValueCount": str(column_spec.data_stats.null_value_count)
                + " ("
                + str(
                    math.floor(
                        column_spec.data_stats.null_value_count
                        / table_spec.row_count
                        * 100
                    )
                )
                + "%)",
                "nullable": column_spec.data_type.nullable,
                "detailPanel": detail_panel,
            }
        )
    columns_summary = []
    for key, val in type_summary.items():
        columns_summary.append({ChartInfo.name.value: key, ChartInfo.amount.value: val})
    return column_specs, columns_summary


def get_table_specs(client, datasetId):
    table_specs = []
    for table_spec in client.list_table_specs(datasetId):
        column_spec, chart_summary = get_column_specs(client, table_spec)
        table_specs.append(
            {
                "id": table_spec.name,
                "rowCount": table_spec.row_count,
                "validRowCount": table_spec.valid_row_count,
                "columnCount": table_spec.column_count,
                "columnSpecs": column_spec,
                "chartSummary": chart_summary,
            }
        )
    return {"tableSpecs": table_specs}


def parse_dataset_type(dataset):
    return dataset.name.split("/")[-1][:3]


def get_dataset_metadata(dataset):
    dataset_type = parse_dataset_type(dataset)
    if dataset_type == DatasetType.TBL.value:
        metadata = {
            "primary_table_spec_id": dataset.tables_dataset_metadata.primary_table_spec_id,
            "target_column_spec_id": dataset.tables_dataset_metadata.target_column_spec_id,
            "weight_column_spec_id": dataset.tables_dataset_metadata.weight_column_spec_id,
            "ml_use_column_spec_id": dataset.tables_dataset_metadata.ml_use_column_spec_id,
            "stats_update_time": dataset.tables_dataset_metadata.stats_update_time.ToMilliseconds(),
        }
    elif dataset_type == DatasetType.ICN.value:
        metadata = {
            "classification_type": dataset.image_classification_dataset_metadata.classification_type,
        }
    elif dataset_type == DatasetType.IOD.value:
        metadata = ""
    else:
        dataset_type = DatasetType.other.value
        metadata = ""
    return dataset_type, metadata


def get_datasets(client, parent):
    datasets = []
    for dataset in client.list_datasets(parent):
        dataset_type, metadata = get_dataset_metadata(dataset)
        if dataset_type != DatasetType.other.value:
            datasets.append(
                {
                    "id": dataset.name,
                    "displayName": dataset.display_name,
                    "description": dataset.description,
                    "createTime": dataset.create_time.ToMilliseconds(),
                    "exampleCount": dataset.example_count,
                    "datasetType": dataset_type,
                    "metadata": metadata,
                }
            )
    return {"datasets": datasets}


def get_models(client, parent):
    models = client.list_models(parent)
    return {
        "models": [
            {
                "id": model.name,
                "displayName": model.display_name,
                "datasetId": model.dataset_id,
                "updateTime": model.update_time.ToMilliseconds(),
                "deploymentState": model.deployment_state,
                "metadata": "",
            }
            for model in models
        ]
    }


class ListDatasets(APIHandler):
    """Handles getting the datasets from GCP for the project."""

    automl_client = None
    parent = None

    @gen.coroutine
    def get(self, input=""):
        try:
            if not self.automl_client:
                self.automl_client = create_automl_client()

            if not self.parent:
                self.parent = create_automl_parent(self.automl_client)

            self.finish(json.dumps(get_datasets(self.automl_client, self.parent)))

        except Exception as e:
            app_log.exception(str(e))
            self.set_status(500, str(e))
            self.finish({"error": {"message": str(e)}})


class ListModels(APIHandler):
    """Handles getting the models from GCP for the project."""

    automl_client = None
    parent = None

    @gen.coroutine
    def get(self, input=""):
        try:
            if not self.automl_client:
                self.automl_client = create_automl_client()

            if not self.parent:
                self.parent = create_automl_parent(self.automl_client)

            self.finish(json.dumps(get_models(self.automl_client, self.parent)))

        except Exception as e:
            app_log.exception(str(e))
            self.set_status(500, str(e))
            self.finish({"error": {"message": str(e)}})


class ListTableInfo(APIHandler):
    """Handles getting the table info for the dataset."""

    automl_client = None

    @gen.coroutine
    def get(self, input=""):
        datasetId = self.get_argument("datasetId")
        try:
            if not self.automl_client:
                self.automl_client = create_automl_client()

            self.finish(json.dumps(get_table_specs(self.automl_client, datasetId)))

        except Exception as e:
            app_log.exception(str(e))
            self.set_status(500, str(e))
            self.finish({"error": {"message": str(e)}})


class DeleteDataset(APIHandler):
    """ Handles deleteing a dataset in GCP."""

    automl_client = None

    @gen.coroutine
    def post(self, input=""):
        datasetId = self.get_json_body()["datasetId"]
        try:
            if not self.automl_client:
                self.automl_client = create_automl_client()
            self.automl_client.delete_dataset(datasetId)
            self.finish({"success": {"message": "dataset deleted"}})

        except Exception as e:
            app_log.exception(str(e))
            self.set_status(500, str(e))
            self.finish({"error": {"message": str(e)}})


class DeleteModel(APIHandler):
    """ Handles deleteing a model in GCP."""

    automl_client = None

    @gen.coroutine
    def post(self, input=""):
        modelId = self.get_json_body()["modelId"]
        try:
            if not self.automl_client:
                self.automl_client = create_automl_client()
            self.automl_client.delete_model(modelId)
            self.finish({"success": {"message": "model deleted"}})

        except Exception as e:
            app_log.exception(str(e))
            self.set_status(500, str(e))
            self.finish({"error": {"message": str(e)}})
