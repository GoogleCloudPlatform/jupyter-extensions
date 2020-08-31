"""Initialize server endpoints for extension"""
from notebook.utils import url_path_join
from notebook.base.handlers import app_log

from jupyterlab_bigquery.create_handler import Handlers
from jupyterlab_bigquery.version import VERSION
from jupyterlab_bigquery.query_history_handler import QueryHistoryHandler, GetQueryDetailsHandler
from jupyterlab_bigquery.pagedAPI_handler import PagedQueryHandler

in_cell_editor_enabled = False
try:
  from jupyterlab_bigquery.query_incell_editor import QueryIncellEditor, _cell_magic
  in_cell_editor_enabled = True
except ModuleNotFoundError:
  app_log.warning("Does not support in-cell editor")

__version__ = VERSION


def _jupyter_server_extension_paths():
  return [{'module': 'jupyterlab_bigquery'}]


def load_jupyter_server_extension(nb_server_app):
  """
      Called when the extension is loaded.
      Args:
          nb_server_app (NotebookWebApplication):
            handle to the Notebook webserver instance.
      """
  host_pattern = '.*$'
  app = nb_server_app.web_app
  gcp_v1_endpoint = url_path_join(app.settings['base_url'], 'bigquery', 'v1')

  def make_endpoint(endPoint, handler):
    return url_path_join(gcp_v1_endpoint, endPoint) + '(.*)', handler

  app.add_handlers(
      host_pattern,
      [(url_path_join(gcp_v1_endpoint, k) + "(.*)", v)
       for (k, v) in Handlers.get().get_handlers().items()],
  )
  app.add_handlers(
      host_pattern,
      [
          # TODO(cbwilkes): Add auth checking if needed.
          # (url_path_join(gcp_v1_endpoint, auth'), AuthHandler)
          make_endpoint('query', PagedQueryHandler),
          make_endpoint('projectQueryHistory', QueryHistoryHandler),
          make_endpoint('getQueryDetails', GetQueryDetailsHandler)
      ])


def load_ipython_extension(ipython):
  """Called by IPython when this module is loaded as an IPython extension."""

  if in_cell_editor_enabled:
    ipython.register_magic_function(_cell_magic,
                                    magic_kind="line",
                                    magic_name="bigquery_editor")
    ipython.register_magic_function(_cell_magic,
                                    magic_kind="cell",
                                    magic_name="bigquery_editor")

  else:
    print("in_cell_editor not enabled. Try 'pip install ipywidgets traitlets'")
