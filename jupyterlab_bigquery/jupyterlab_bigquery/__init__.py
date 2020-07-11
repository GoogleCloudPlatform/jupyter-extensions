from notebook.utils import url_path_join

from jupyterlab_bigquery.handlers import ListHandler, DatasetDetailsHandler, TableDetailsHandler
from jupyterlab_bigquery.version import VERSION
from jupyterlab_bigquery.pagedAPI_handler import PagedQueryHandler
from jupyterlab_bigquery.query_incell_editor import QueryIncellEditor

__version__ = VERSION


def _jupyter_server_extension_paths():
    return [{
        'module': 'jupyterlab_bigquery'
    }]

def load_jupyter_server_extension(nb_server_app):
    """
    Called when the extension is loaded.
    Args:
        nb_server_app (NotebookWebApplication): handle to the Notebook webserver instance.
    """
    host_pattern = '.*$'
    app = nb_server_app.web_app
    gcp_v1_endpoint = url_path_join(app.settings['base_url'], 'bigquery', 'v1')

    def make_endpoint(endPoint, handler):
        return url_path_join(gcp_v1_endpoint, endPoint) + '(.*)', handler

    app.add_handlers(host_pattern, [
        # TODO(cbwilkes): Add auth checking if needed.
        # (url_path_join(gcp_v1_endpoint, auth'), AuthHandler)
        make_endpoint('list', ListHandler),
        make_endpoint('datasetdetails', DatasetDetailsHandler),
        make_endpoint('tabledetails', TableDetailsHandler),
        make_endpoint('query', PagedQueryHandler)
    ])
