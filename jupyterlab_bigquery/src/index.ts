// Ensure styles are loaded by webpack
import '../style/index.css';

import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin,
} from '@jupyterlab/application';

import { ListItemsWidget } from './components/list_items_panel/list_tree_item_widget';
import { ListProjectsService } from './components/list_items_panel/service/list_items';
import { WidgetManager } from './utils/widgetManager/widget_manager';

async function activate(app: JupyterFrontEnd) {
  const manager = WidgetManager.getInstance(app);
  const context = { app: app, manager: manager };
  const listProjectsService = new ListProjectsService();
  const listWidget = new ListItemsWidget(listProjectsService, context);
  listWidget.addClass('jp-BigQueryIcon');
  app.shell.add(listWidget, 'left', { rank: 100 });
}

/**
 * The JupyterLab plugin.
 */
const ListItemsPlugin: JupyterFrontEndPlugin<void> = {
  id: 'bigquery:bigquery',
  requires: [],
  activate: activate,
  autoStart: true,
};

/**
 * Export the plugin as default.
 */
export default [ListItemsPlugin];
