from ipywidgets import DOMWidget
from traitlets import Unicode

# TODO: refactor name and version to sync with front 
module_name = 'bigquery_query_incell_editor'
module_version = '0.0.1'

class QueryIncellEditor(DOMWidget):
  _model_name = Unicode('QueryIncellEditorModel').tag(sync=True)
  _model_module = Unicode(module_name).tag(sync=True)
  _model_module_version = Unicode(module_version).tag(sync=True)
  _view_name = Unicode('QueryIncellEditorView').tag(sync=True)
  _view_module = Unicode(module_name).tag(sync=True)
  _view_module_version = Unicode(module_version).tag(sync=True)

  value = Unicode('Hello').tag(sync=True)