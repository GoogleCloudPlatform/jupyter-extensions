// Ensure styles are loaded by webpack
import '../style/index.css';

import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin,
} from '@jupyterlab/application';

import ListItemsWidget from './components/list_items_panel/list_tree_item_widget';
import { ListProjectsService } from './components/list_items_panel/service/list_items';
import { WidgetManager } from './utils/widget_manager';
import { ReduxReactWidget } from './utils/ReduxReactWidget';

async function activate(app: JupyterFrontEnd) {
  WidgetManager.initInstance(app);
  const manager = WidgetManager.getInstance();
  const context = { app: app, manager: manager };
  const listProjectsService = new ListProjectsService();
  manager.launchWidget(
    ListItemsWidget,
    'left',
    'ListItemWidget',
    (widget: ReduxReactWidget) => {
      widget.addClass('jp-BigQueryIcon');
    },
    [listProjectsService, context],
    { rank: 100 }
  );
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
