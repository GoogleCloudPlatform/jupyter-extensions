// Ensure styles are loaded by webpack
import '../style/index.css';
import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin,
} from '@jupyterlab/application';
import { Widget } from '@phosphor/widgets';
import { Store } from 'redux';
import { store } from './store/store';
import { watch } from './store/watch';
import { MainAreaWidget } from './components/main_area_widget';
import { SidebarWidget } from './components/sidebar_widget';
import { fetchStudies } from './store/studies';
import { fetchMetadata } from './store/metadata';
import { createSnack } from './store/snackbar';
import { SnackbarWidget } from './components/snackbar_widget';
import { ViewState, ViewType } from './store/view';
import { prettifyStudyName } from './service/optimizer';
import { unwrapResult } from '@reduxjs/toolkit';

function viewName(data: ViewType) {
  switch (data.view) {
    case 'createStudy':
      return 'Create Study';
    case 'dashboard':
      return 'Dashboard';
    case 'studyDetails':
      return `"${prettifyStudyName(data.studyId)}" Details`;
    case 'suggestTrials':
      return `"${prettifyStudyName(data.studyId)}" Trials`;
    case 'visualizeTrials':
      return `"${prettifyStudyName(data.studyId)}" Visualizations`;
  }
}

/**
 * Opens and closes a widget based on redux store's `view.isVisible` property.
 * @param reduxStore the redux store with `view.isVisible`.
 * @param app the jupyter application.
 * @param widgetComponent the widget to be managed by redux.
 */
const createManagedWidget = <
  WIDGET extends Widget,
  STORE extends Store<{ view: ViewState }>
>(
  reduxStore: STORE,
  app: JupyterFrontEnd,
  widgetComponent: new (reduxStore: STORE) => WIDGET
) => {
  let widget = new widgetComponent(reduxStore);
  widget.id = 'optimizer:main-area';

  const onChange = watch(
    reduxStore.getState,
    state => state.view.isVisible,
    (previousIsVisible, nextIsVisible) => previousIsVisible === nextIsVisible
  );

  const onViewChange = watch(
    reduxStore.getState,
    state => state.view.data,
    // NOTE: this is a shallow equal (should not matter since the state is
    // immutable, thus changes to state should trigger a shallow change)
    (previousView, nextView) => previousView === nextView
  );

  reduxStore.subscribe(
    onChange((isVisible, state) => {
      if (isVisible) {
        app.shell.add(widget, 'main');
        app.shell.activateById(widget.id);
      } else {
        widget.close();
        // Setup component for next open
        widget = new widgetComponent(reduxStore);
        widget.id = 'optimizer:main-area';
        widget.title.label = viewName(state.view.data);
      }
    })
  );

  // Refocus component
  reduxStore.subscribe(
    onViewChange(view => {
      widget.title.label = viewName(view);
      app.shell.activateById(widget.id);
    })
  );
};

async function activate(app: JupyterFrontEnd) {
  // Create main area widget
  createManagedWidget(store, app, MainAreaWidget);

  // Create Sidebar
  const sidebarWidget = new SidebarWidget(store);
  app.shell.add(sidebarWidget, 'left', { rank: 1000 });
  app.shell.add(new SnackbarWidget(store), 'header');

  await store
    .dispatch(fetchMetadata())
    .then(() => store.dispatch(fetchStudies()))
    .then(unwrapResult)
    .catch(error => store.dispatch(createSnack(error, 'error', 10000)));
}

/**
 * The JupyterLab plugin.
 */
const OptimizerPlugin: JupyterFrontEndPlugin<void> = {
  id: 'caip-optimizer',
  requires: [],
  activate: activate,
  autoStart: true,
};

/**
 * Export the plugin as default.
 */
export default [OptimizerPlugin];
