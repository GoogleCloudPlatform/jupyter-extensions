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
import { ListWordsWidget } from './components/list_words_widget';
import { ListWordsService } from './service/list_words';
import { fetchStudies } from './store/studies';
import { fetchMetadata } from './store/metadata';

// temp
import { setView } from './store/view'
import { SideBarWidget } from './components/sidebar'
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
  // Create main area widget
  createManagedWidget(store, app, MainAreaWidget);

  // temp
  let widget = new SideBarWidget(store);
  console.log('test');
  app.shell.add(widget, 'left', { rank: 100 });
  app.shell.activateById(widget.id);

  const listWordsService = new ListWordsService();
  const listWidget = new ListWordsWidget(listWordsService);
  listWidget.addClass('optimizer');
  app.shell.add(listWidget, 'left', { rank: 100 });
  await store.dispatch(fetchMetadata());
  await store.dispatch(fetchStudies());
  // temp
  await store.dispatch(setView({ view: 'studyDetails', studyId: 'id' }))
}

/**
 * The JupyterLab plugin.
 */
const ListWordsPlugin: JupyterFrontEndPlugin<void> = {
  id: 'caip-optimizer',
  requires: [],
  activate: activate,
  autoStart: true,
};

/**
 * Export the plugin as default.
 */
export default [ListWordsPlugin];
