// Ensure styles are loaded by webpack
import '../style/index.css';
import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin,
} from '@jupyterlab/application';
import { store } from './store/store';
import { MainAreaWidget } from './components/main_area_widget';
import { SidebarWidget } from './components/sidebar_widget';
import { fetchStudies } from './store/studies';
import { fetchMetadata } from './store/metadata';
import { createSnack } from './store/snackbar';
import { SnackbarWidget } from './components/snackbar_widget';
import { unwrapResult } from '@reduxjs/toolkit';
import { createManagedWidget } from './utils/create_managed_widget';

async function activate(app: JupyterFrontEnd) {
  // Create main area widget
  createManagedWidget(store, app, MainAreaWidget);

  // Create Sidebar
  const sidebarWidget = new SidebarWidget(store);
  app.shell.add(sidebarWidget, 'left', { rank: 1000 });
  app.shell.add(new SnackbarWidget(store), 'header');

  // Fetch Metadata for project id, region and then load studies
  await store
    .dispatch(fetchMetadata())
    .then(() => store.dispatch(fetchStudies()))
    .then(unwrapResult)
    .catch(error => store.dispatch(createSnack(error, 'error', 10000)));
}

/**
 * The JupyterLab plugin.
 */
const VizierPlugin: JupyterFrontEndPlugin<void> = {
  id: 'vizier',
  requires: [],
  activate: activate,
  autoStart: true,
};

/**
 * Export the plugin as default.
 */
export default [VizierPlugin];
