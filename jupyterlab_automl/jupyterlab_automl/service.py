"""Services for AutoML extension backend"""

import math
from collections import defaultdict
from enum import Enum

from google.cloud import aiplatform_v1alpha1
from gcp_jupyterlab_shared.handlers import AuthProvider
from googleapiclient.discovery import build
from google.protobuf import json_format


def parse_dataset_type(dataset):
    for dt in DatasetType:
        if (
            dt.value
            == dict(dataset.labels)["aiplatform.googleapis.com/dataset_metadata_schema"]
        ):
            return dt
    return DatasetType.OTHER


class DatasetType(Enum):
    OTHER = "OTHER"
    TABLE = "TABLE"
    IMAGE = "IMAGE"


class ManagementService:
    """Provides an authenicated Service Management Client"""

    _instance = None

    @classmethod
    def get(cls):
        if not cls._instance:
            cls._instance = ManagementService()
        return cls._instance

    def get_managed_services(self):
        consumerId = "project:" + AuthProvider.get().project
        request = (
            build("servicemanagement", "v1").services().list(consumerId=consumerId)
        )
        return request.execute()

    def get_project(self):
        return AuthProvider.get().project


class AutoMLService:
    """Provides an authenticated AutoML Client and project info"""

    _instance = None

    def __init__(self):
        self._dataset_client = aiplatform_v1alpha1.DatasetServiceClient(
            client_options={"api_endpoint": "us-central1-aiplatform.googleapis.com"}
        )
        self._model_client = aiplatform_v1alpha1.ModelServiceClient(
            client_options={"api_endpoint": "us-central1-aiplatform.googleapis.com"}
        )
        self._parent = (
            "projects/" + AuthProvider.get().project + "/locations/us-central1"
        )

    @property
    def dataset_client(self):
        return self._dataset_client

    @property
    def model_client(self):
        return self._model_client

    @classmethod
    def get(cls):
        if not cls._instance:
            cls._instance = AutoMLService()
        return cls._instance

    def get_models(self):
        models = self._model_client.list_models(parent=self._parent).models
        return {"models": [{"id": model.name,} for model in models]}

    def get_datasets(self):
        datasets = []
        for dataset in self._dataset_client.list_datasets(parent=self._parent).datasets:
            dataset_type = parse_dataset_type(dataset)
            if dataset_type != DatasetType.OTHER:
                datasets.append(
                    {
                        "id": dataset.name,
                        "displayName": dataset.display_name,
                        "createTime": dataset.create_time.strftime(
                            "%m/%d/%Y, %H:%M:%S"
                        ),
                        "updateTime": dataset.update_time.strftime(
                            "%m/%d/%Y, %H:%M:%S"
                        ),
                        "datasetType": dataset_type.value,
                        "etag": dataset.etag,
                        "metadata": json_format.MessageToDict(dataset._pb.metadata),
                    }
                )
        return {"datasets": datasets}
