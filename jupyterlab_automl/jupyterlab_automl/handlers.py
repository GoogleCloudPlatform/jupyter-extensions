# Lint as: python3
"""Request handler classes for the extensions."""

import json

import tornado.gen as gen
from notebook.base.handlers import APIHandler, app_log

from jupyterlab_automl.service import AutoMLService

handlers = {}


def _create_handler(req_type, handler):
    class Handler(APIHandler):
        if req_type == "GET":

            @gen.coroutine
            def get(self, input=""):
                args = {k: self.get_argument(k) for k in self.request.arguments}
                try:
                    self.finish(json.dumps(handler(args)))
                except Exception as e:
                    self._handle_exception(e)

        elif req_type == "POST":

            @gen.coroutine
            def post(self, input=""):
                args = self.get_json_body()
                try:
                    self.finish(json.dumps(handler(args)))
                except Exception as e:
                    self._handle_exception(e)

        def _handle_exception(self, e):
            app_log.exception(str(e))
            self.set_status(500, str(e))
            self.finish({"error": {"message": str(e)}})

    return Handler


def _handler(request_type, endpoint):
    def decorator(func):
        handlers[endpoint] = _create_handler(request_type, func)
        return func

    return decorator


@_handler("GET", "datasets")
def _list_datasets(args):
    return AutoMLService.get().get_datasets()


@_handler("GET", "models")
def _list_models(args):
    return AutoMLService.get().get_models()


@_handler("GET", "tableInfo")
def _table_info(args):
    return AutoMLService.get().get_table_specs(args["datasetId"])


@_handler("POST", "deleteDataset")
def _delete_dataset(args):
    AutoMLService.get().client.delete_dataset(args["datasetId"])
    return {"success": True}


@_handler("POST", "deleteModel")
def _delete_model(args):
    AutoMLService.get().client.delete_model(args["modelId"])
    return {"success": True}
