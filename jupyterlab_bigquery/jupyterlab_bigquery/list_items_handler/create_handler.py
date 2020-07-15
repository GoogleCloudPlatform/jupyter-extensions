"""Creates GET and POST handlers"""
# Method taken from AutoML extension

import json
import tornado.gen as gen
from notebook.base.handlers import APIHandler, app_log

GET = "GET"
POST = "POST"
handlers = {}

class Handler(APIHandler):

  def _handle_exception(self, e):
    app_log.exception(str(e))
    self.set_status(500, str(e))
    self.finish({"error": {"message": str(e)}})


def _create_get_handler(handler):

  class GetHandler(Handler):

    @gen.coroutine
    def get(self, *args, **kwargs):
      args = {k: self.get_argument(k) for k in self.request.arguments}
      try:
        self.finish(json.dumps(handler(args)))
      except Exception as e:
        self._handle_exception(e)

  return GetHandler


def _create_post_handler(handler):

  class PostHandler(Handler):

    @gen.coroutine
    def post(self, *args, **kwargs):
      args = self.get_json_body()
      try:
        self.finish(json.dumps(handler(args)))
      except Exception as e:
        self._handle_exception(e)

  return PostHandler


METHOD_HANDLERS = {GET: _create_get_handler, POST: _create_post_handler}


def _handler(request_type, endpoint):

  def decorator(func):
    handlers[endpoint] = METHOD_HANDLERS[request_type](func)
    return func

  return decorator
