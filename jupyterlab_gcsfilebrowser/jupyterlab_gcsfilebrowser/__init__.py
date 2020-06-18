from notebook.utils import url_path_join

from jupyterlab_gcsfilebrowser.handlers import CheckpointHandler, CopyHandler, DeleteHandler, GCSHandler, GCSNbConvert, MoveHandler, NewHandler, UploadHandler
from jupyterlab_gcsfilebrowser.version import VERSION

__version__ = VERSION


def _jupyter_server_extension_paths():
  return [{'module': 'jupyterlab_gcsfilebrowser'}]


def load_jupyter_server_extension(nb_server_app):
  """
    Called when the extension is loaded.
    Args:
        nb_server_app (NotebookWebApplication): handle to the Notebook webserver instance.
    """
  host_pattern = '.*$'
  app = nb_server_app.web_app
  gcp_v1_endpoint = url_path_join(app.settings['base_url'], 'gcp', 'v1', 'gcs')
  app.add_handlers(
      host_pattern,
      [
          # TODO(cbwilkes): Add auth checking if needed.
          # (url_path_join(gcp_v1_endpoint, auth'), AuthHandler)
          (url_path_join(gcp_v1_endpoint, 'files') + '(.*)', GCSHandler),
          (url_path_join(
              gcp_v1_endpoint,
              'upload',
          ) + '(.*)', UploadHandler),
          (url_path_join(
              gcp_v1_endpoint,
              'delete',
          ) + '(.*)', DeleteHandler),
          (url_path_join(
              gcp_v1_endpoint,
              'move',
          ) + '(.*)', MoveHandler),
          (url_path_join(
              gcp_v1_endpoint,
              'copy',
          ) + '(.*)', CopyHandler),
          (url_path_join(
              gcp_v1_endpoint,
              'new',
          ) + '(.*)', NewHandler),
          (url_path_join(
              gcp_v1_endpoint,
              'checkpoint',
          ) + '(.*)', CheckpointHandler),
          ('/nbconvert/(.*)/GCS%3A(.*)', GCSNbConvert),
      ])
