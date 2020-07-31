import { Widget } from '@phosphor/widgets';
import { Store } from 'redux';
import { watch } from '../store/watch';
import { JupyterFrontEnd } from '@jupyterlab/application';

/**
 * Opens and closes a widget based on redux store's `view.isVisible` property.
 * @param reduxStore the redux store with `view.isVisible`.
 * @param app the jupyter application.
 * @param widgetComponent the widget to be managed by redux.
 */
export const createManagedWidget = <
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
