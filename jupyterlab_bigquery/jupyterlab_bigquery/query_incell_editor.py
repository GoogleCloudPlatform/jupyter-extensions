import ast
import json
from functools import partial
import IPython
from google.cloud.bigquery.dbapi import _helpers
from IPython.core import magic_arguments
from traitlets import Unicode, Any
from ipywidgets import DOMWidget

module_name = 'bigquery_query_incell_editor'
# IfChange
module_version = '0.1.1'
# ThenChange(jupyterlab_bigquery/src/index.ts)

UNSUPPORTED_ARGS = [
    'destination_var', 'max_results', 'dry_run', 'use_bqstorage_api',
    'use_rest_api', 'verbose'
]


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
    "destination_var",
    nargs="?",
    help=("Unsupported flag.  Placeholder to match bigquery magic."),
)
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
    "--max_results",
    default=None,
    help=("Unsupported flag.  Placeholder to match bigquery magic."),
)
@magic_arguments.argument(
    "--maximum_bytes_billed",
    default=None,
    help=("maximum_bytes_billed to use for executing this query. Defaults to "
          "the context default_query_job_config.maximum_bytes_billed."),
)
@magic_arguments.argument(
    "--dry_run",
    action="store_true",
    default=False,
    help=("Unsupported flag.  Placeholder to match bigquery magic."),
)
@magic_arguments.argument(
    "--use_legacy_sql",
    action="store_true",
    default=False,
    help=("Sets query to use Legacy SQL instead of Standard SQL. Defaults to "
          "Standard SQL if this argument is not used."),
)
@magic_arguments.argument(
    "--use_bqstorage_api",
    action="store_true",
    default=None,
    help=(
        "[Deprecated] Unsupported flag.  Placeholder to match bigquery magic."),
)
@magic_arguments.argument(
    "--use_rest_api",
    action="store_true",
    default=False,
    help=("Unsupported flag.  Placeholder to match bigquery magic."),
)
@magic_arguments.argument(
    "--verbose",
    action="store_true",
    default=False,
    help=("Unsupported flag.  Placeholder to match bigquery magic."),
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
def _cell_magic(line, query=None):
  args = magic_arguments.parse_argstring(_cell_magic, line)

  args_dict = vars(args)

  active_unsupport_args = []
  for unsupport_arg in UNSUPPORTED_ARGS:
    if args_dict[unsupport_arg] is not None and args_dict[
        unsupport_arg] is not False:
      active_unsupport_args.append(unsupport_arg)

  if len(active_unsupport_args) > 0:
    active_unsupport_args.sort()

    print(F"Unsupported args: {', '.join(active_unsupport_args)}")

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
  e.query = query.strip('\n') if isinstance(query, str) else ''
  e.query_flags = json.dumps(query_flags)
  return e
