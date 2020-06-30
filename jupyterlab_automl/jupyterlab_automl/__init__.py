from notebook.utils import url_path_join

from jupyterlab_automl.handlers import handlers
from jupyterlab_automl.version import VERSION

__version__ = VERSION


def _jupyter_server_extension_paths():
  return [{"module": "jupyterlab_automl"}]


def load_jupyter_server_extension(nb_server_app):
  """
    Called when the extension is loaded.
    Args:
        nb_server_app (NotebookWebApplication): handle to the Notebook webserver instance.
    """
  host_pattern = ".*$"
  app = nb_server_app.web_app
  gcp_v1_endpoint = url_path_join(app.settings["base_url"], "automl", "v1")
  app.add_handlers(
      host_pattern,
      [(url_path_join(gcp_v1_endpoint, k) + "(.*)", v)
       for (k, v) in handlers.items()],
  )
