// Ensure styles are loaded by webpack
import '../style/index.css';

import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin,
} from '@jupyterlab/application';

import { AutoMLWidget } from './components/automl_widget';
import { WidgetManager } from './widget_manager';

async function activate(app: JupyterFrontEnd) {
  const manager = new WidgetManager(app);
  const context = { app: app, manager: manager };
  const listWidget = new AutoMLWidget(context);
  listWidget.addClass('jp-AutoMLIcon');
  app.shell.add(listWidget, 'left', { rank: 100 });
}

/**
 * The JupyterLab plugin.
 */
const AutoMLPlugin: JupyterFrontEndPlugin<void> = {
  id: 'automl:automl',
  requires: [],
  activate: activate,
  autoStart: true,
};

/**
 * Export the plugin as default.
 */
export default [AutoMLPlugin];
