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

/**
 * Opens and closes a widget based on redux store's `view.isVisible` property.
 * @param reduxStore the redux store with `view.isVisible`.
 * @param app the jupyter application.
 * @param widgetComponent the widget to be managed by redux.
 */
const createManagedWidget = <
  WIDGET extends Widget,
  STORE extends Store<{ view: { isVisible: boolean } }>
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
  if (reduxStore.getState().view.isVisible) {
    app.shell.add(widget, 'main');
    app.shell.activateById(widget.id);
  }
  reduxStore.subscribe(
    onChange(isVisible => {
      if (isVisible) {
        app.shell.add(widget, 'main');
        app.shell.activateById(widget.id);
      } else {
        widget.close();
        // Setup component for next open
        widget = new widgetComponent(reduxStore);
        widget.id = 'optimizer:main-area';
      }
    })
  );
};

async function activate(app: JupyterFrontEnd) {
  store.dispatch(fetchStudies());

  // Create main area widget
  createManagedWidget(store, app, MainAreaWidget);

  // Create Sidebar
  const sidebarWidget = new SidebarWidget(store);
  app.shell.add(sidebarWidget, 'left', { rank: 100 });
  await store.dispatch(fetchMetadata());
  await store.dispatch(fetchStudies());
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
