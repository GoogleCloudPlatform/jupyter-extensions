import inspect
import unittest
from unittest.mock import MagicMock, Mock, patch

from notebook.base.handlers import APIHandler

from jupyterlab_automl.handlers import _handler, handlers


class TestHandlers(unittest.TestCase):
    def testHandlerDecorator(self):
        func = MagicMock()

        @_handler("POST", "_test")
        def f(args):
            func(args)

        # Ensure handler is a subclass of APIHandler
        self.assertTrue(APIHandler in inspect.getmro(handlers["_test"]))

    def testHandlerDecoratorGet(self):
        func = MagicMock()

        @_handler("GET", "_test")
        def f(args):
            func(args)

        handlers["_test"].get(MagicMock())
        func.assert_called()

    def testHandlerDecoratorPost(self):
        func = MagicMock()

        @_handler("POST", "_test")
        def f(args):
            func(args)

        handlers["_test"].post(MagicMock())
        func.assert_called()


if __name__ == "__main__":
    unittest.main()
