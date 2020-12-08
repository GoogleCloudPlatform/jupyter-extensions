/**
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http=//www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// Ensure styles are loaded by webpack
import '../style/index.css';

import { IJupyterWidgetRegistry } from '@jupyter-widgets/base';
import { INotebookTracker } from '@jupyterlab/notebook';
import ListItemsWidget from './components/list_items_panel/list_tree_item_widget';
import { ListProjectsService } from './components/list_items_panel/service/list_items';
import * as QueryEditorInCellWidgetsExport from './components/query_editor/query_editor_incell/query_editor_incell_widget';
import { ICONS } from './constants';
import { ReduxReactWidget } from './utils/widgetManager/redux_react_widget';
import { WidgetManager } from './utils/widgetManager/widget_manager';

import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin,
} from '@jupyterlab/application';

async function activate(
  app: JupyterFrontEnd,
  notebookTrack: INotebookTracker,
  registry: IJupyterWidgetRegistry
) {
  const inCellEnabled = !!registry;

  WidgetManager.initInstance(app, inCellEnabled, notebookTrack);
  const manager = WidgetManager.getInstance();
  const context = {
    app: app,
    manager: manager,
    notebookTrack: notebookTrack,
  };
  const listProjectsService = new ListProjectsService();
  manager.launchWidget(
    ListItemsWidget,
    'left',
    'ListItemWidget',
    (widget: ReduxReactWidget) => {
      widget.addClass(ICONS.bigQuery);
    },
    [listProjectsService, context],
    { rank: 100 }
  );

  if (inCellEnabled) {
    registry.registerWidget({
      name: 'bigquery_query_incell_editor',
      // IfChange
      version: '0.1.1',
      // ThenChange(jupyterlab_bigquery/jupyterlab_bigquery/query_incell_editor.py)
      exports: QueryEditorInCellWidgetsExport,
    });
  }
}

/**
 * The JupyterLab plugin.
 */
const BigQueryPlugin: JupyterFrontEndPlugin<void> = {
  id: 'bigquery:bigquery',
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  requires: [INotebookTracker],
  optional: [IJupyterWidgetRegistry as any],
  activate: activate,
  autoStart: true,
};

/**
 * Export the plugin as default.
 */
export default [BigQueryPlugin];
