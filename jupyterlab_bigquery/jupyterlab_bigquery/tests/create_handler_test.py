import inspect
import unittest
from unittest.mock import MagicMock

from notebook.base.handlers import APIHandler

from jupyterlab_bigquery.create_handler.create_handler import _handler, Handlers


class TestHandlers(unittest.TestCase):

  def testHandlerDecorator(self):
    func = MagicMock()

    @_handler("POST", "_test")
    def f(args):
      func(args)

    # Ensure handler is a subclass of APIHandler
    self.assertTrue(
        APIHandler in inspect.getmro(Handlers.get().get_handlers()["_test"]))

  def testHandlerDecoratorGet(self):
    func = MagicMock()

    @_handler("GET", "_test")
    def f(args):
      func(args)

    Handlers.get().get_handlers()["_test"].get(MagicMock())
    func.assert_called()

  def testHandlerDecoratorPost(self):
    func = MagicMock()

    @_handler("POST", "_test")
    def f(args):
      func(args)

    Handlers.get().get_handlers()["_test"].post(MagicMock())
    func.assert_called()


if __name__ == "__main__":
  unittest.main()
