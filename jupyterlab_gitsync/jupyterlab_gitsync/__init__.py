from notebook.utils import url_path_join

from jupyterlab_gitsync.handlers import *
from jupyterlab_gitsync.version import VERSION

__version__ = VERSION


def _jupyter_server_extension_paths():
  return [{'module': 'jupyterlab_gitsync'}]


def load_jupyter_server_extension(nb_server_app):
  """
    Called when the extension is loaded.
    Args:
        nb_server_app (NotebookWebApplication): handle to the Notebook webserver instance.
    """
  host_pattern = '.*$'
  app = nb_server_app.web_app
  gcp_v1_endpoint = url_path_join(app.settings['base_url'],
                                  'jupyterlab_gitsync', 'v1')
  app.add_handlers(
      host_pattern,
      [(url_path_join(gcp_v1_endpoint, 'sync') + '(.*)', SyncHandler),
       (url_path_join(gcp_v1_endpoint, 'setup') + '(.*)', SetupHandler),
       (url_path_join(gcp_v1_endpoint, 'nbinit') + '(.*)', NotebookInitHandler),
       (url_path_join(gcp_v1_endpoint, 'nbmerge') + '(.*)',
        NotebookMergeHandler),
       (url_path_join(gcp_v1_endpoint, 'nbresolve') + '(.*)',
        NotebookResolveHandler)])
