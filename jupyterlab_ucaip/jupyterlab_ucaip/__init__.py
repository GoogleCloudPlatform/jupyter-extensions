"""Initializes the endpoints for the uCAIP extension"""

from notebook.utils import url_path_join
from jupyterlab_ucaip.handlers import handlers
from jupyterlab_ucaip.version import VERSION
from jupyterlab_ucaip.public import *
from jupyterlab_ucaip.service import ModelFramework

__version__ = VERSION


def _jupyter_server_extension_paths():
  return [{"module": "jupyterlab_ucaip"}]


def load_jupyter_server_extension(nb_server_app):
  """
    Called when the extension is loaded.
    Args:
      nb_server_app (NotebookWebApplication):
        handle to the Notebook webserver instance.
  """
  host_pattern = ".*$"
  app = nb_server_app.web_app
  gcp_v1_endpoint = url_path_join(app.settings["base_url"], "ucaip", "v1")
  app_handlers = []
  for (route, handler) in handlers.items():
    app_handlers.append((url_path_join(gcp_v1_endpoint, route), handler))
  app.add_handlers(
      host_pattern,
      app_handlers,
  )
