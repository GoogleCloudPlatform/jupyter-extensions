"""Initializes the endpoints for the AutoML extension"""

from notebook.utils import url_path_join
from jupyterlab_automl.handlers import handlers
from jupyterlab_automl.version import VERSION
from jupyterlab_automl.public import *
from jupyterlab_automl.service import ModelFramework

__version__ = VERSION


def _jupyter_server_extension_paths():
  return [{"module": "jupyterlab_automl"}]


def load_jupyter_server_extension(nb_server_app):
  """
    Called when the extension is loaded.
    Args:
      nb_server_app (NotebookWebApplication):
        handle to the Notebook webserver instance.
  """
  host_pattern = ".*$"
  app = nb_server_app.web_app
  gcp_v1_endpoint = url_path_join(app.settings["base_url"], "automl", "v1")
  app_handlers = []
  for (route, handler) in handlers.items():
    app_handlers.append((url_path_join(gcp_v1_endpoint, route), handler))
  app.add_handlers(
      host_pattern,
      app_handlers,
  )
