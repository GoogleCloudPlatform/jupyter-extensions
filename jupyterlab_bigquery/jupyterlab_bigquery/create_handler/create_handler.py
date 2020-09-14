"""Creates GET and POST handlers"""
# Method taken from AutoML extension

import json
import tornado.gen as gen
from notebook.base.handlers import APIHandler, app_log

GET = "GET"
POST = "POST"


class Handler(APIHandler):

  def _handle_exception(self, e):
    app_log.exception(str(e))
    self.set_status(500, str(e))
    self.finish({"error": {"message": str(e)}})


class Handlers():
  """Singleton for handlers dictionary"""

  _instance = None
  _handlers = {}

  @classmethod
  def get(cls):
    if not cls._instance:
      cls._instance = Handlers()
    return cls._instance

  def set_handler(self, key, value):
    self.get()._handlers[key] = value

  def get_handlers(self):
    return self.get()._handlers


def _create_get_handler(handler):
  """Create GET handler"""

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
  """Create POST handler"""

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
    Handlers.get().set_handler(endpoint, METHOD_HANDLERS[request_type](func))
    return func

  return decorator
