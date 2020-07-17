from ipywidgets import DOMWidget
from traitlets import Unicode, Any
from IPython.core import magic_arguments
import IPython

module_name = 'bigquery_query_incell_editor'
module_version = '0.0.1'

class QueryIncellEditor(DOMWidget):
  _model_name = Unicode('QueryIncellEditorModel').tag(sync=True)
  _model_module = Unicode(module_name).tag(sync=True)
  _model_module_version = Unicode(module_version).tag(sync=True)
  _view_name = Unicode('QueryIncellEditorView').tag(sync=True)
  _view_module = Unicode(module_name).tag(sync=True)
  _view_module_version = Unicode(module_version).tag(sync=True)

  query = Unicode().tag(sync=True)
  result = Any().tag(sync=True)


@magic_arguments.magic_arguments()
def _cell_magic(line, query=None):
  args = magic_arguments.parse_argstring(_cell_magic, line)

  e = QueryIncellEditor()
  e.query = query if isinstance(query, str) else ''
  return e
  
