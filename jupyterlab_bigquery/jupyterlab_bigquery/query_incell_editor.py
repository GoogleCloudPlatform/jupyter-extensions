import ast
import json
from functools import partial
import IPython
from google.cloud.bigquery.dbapi import _helpers
from IPython.core import magic_arguments
from traitlets import Unicode, Any
from ipywidgets import DOMWidget

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
  query_flags = Unicode().tag(sync=True)


@magic_arguments.magic_arguments()
@magic_arguments.argument(
    "--destination_table",
    type=str,
    default=None,
    help=("If provided, save the output of the query to a new BigQuery table. "
          "Variable should be in a format <dataset_id>.<table_id>. "
          "If table does not exists, it will be created. "
          "If table already exists, its data will be overwritten."),
)
@magic_arguments.argument(
    "--project",
    type=str,
    default=None,
    help=
    ("Project to use for executing this query. Defaults to the context project."
    ),
)
@magic_arguments.argument(
    "--maximum_bytes_billed",
    default=None,
    help=("maximum_bytes_billed to use for executing this query. Defaults to "
          "the context default_query_job_config.maximum_bytes_billed."),
)
@magic_arguments.argument(
    "--params",
    nargs="+",
    default=None,
    help=("Parameters to format the query string. If present, the --params "
          "flag should be followed by a string representation of a dictionary "
          "in the format {'param_name': 'param_value'} (ex. {\"num\": 17}), "
          "or a reference to a dictionary in the same format. The dictionary "
          "reference can be made by including a '$' before the variable "
          "name (ex. $my_dict_var)."),
)
@magic_arguments.argument(
    "--use_legacy_sql",
    action="store_true",
    default=False,
    help=("Sets query to use Legacy SQL instead of Standard SQL. Defaults to "
          "Standard SQL if this argument is not used."),
)
def _cell_magic(line, query=None):
  args = magic_arguments.parse_argstring(_cell_magic, line)

  params = None

  if args.maximum_bytes_billed is None:
    maximum_bytes_billed = None
  elif args.maximum_bytes_billed == 'None':
    maximum_bytes_billed = 0
  else:
    maximum_bytes_billed = int(args.maximum_bytes_billed)

  # test params syntax
  if args.params is not None:
    try:
      params = ast.literal_eval("".join(args.params))
      _helpers.to_query_parameters(params)
    except Exception:
      raise SyntaxError("--params is not a correctly formatted\
             JSON string or a JSON "
                        "serializable dictionary")

  query_flags = {
      'destination_table': args.destination_table,
      'project': args.project,
      'maximum_bytes_billed': maximum_bytes_billed,
      'params': params,
      'use_legacy_sql': args.use_legacy_sql,
  }

  e = QueryIncellEditor()
  e.query = query if isinstance(query, str) else ''
  e.query_flags = json.dumps(query_flags)
  return e
