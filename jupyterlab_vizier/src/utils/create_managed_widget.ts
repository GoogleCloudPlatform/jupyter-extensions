import { Widget } from '@phosphor/widgets';
import { Store } from 'redux';
import { watch } from '../store/watch';
import { JupyterFrontEnd } from '@jupyterlab/application';
import { ViewType, ViewState } from '../store/view';
import { prettifyStudyName } from '../service/vizier_service';

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
export const createManagedWidget = <
  WIDGET extends Widget,
  STORE extends Store<{ view: ViewState }>
>(
  reduxStore: STORE,
  app: JupyterFrontEnd,
  widgetComponent: new (reduxStore: STORE) => WIDGET
) => {
  let widget = new widgetComponent(reduxStore);
  widget.id = 'vizier:main-area';

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
        widget.id = 'vizier:main-area';
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
