import * as React from 'react';
import { ReactWidget } from '@jupyterlab/apputils';
import { store, AppDispatch } from '../store/store';
import { Provider, connect } from 'react-redux';
import { close, ViewType, setView } from '../store/view';
// import { Dashboard } from './dashboard';

const mapDispatchToProps = (dispatch: AppDispatch) => ({
  setView: (view: ViewType) => dispatch(setView(view)),
  close: () => dispatch(close()),
});

/**
 * ViewManager acts as the extensions router for various views.
 */
export const Sidebar = ({
  setView,
  close,
}: {
  setView: (stuff: any) => void;
  close: () => void;
}) => {
  // TODO: add custom components
  return (
    <>
      <button onClick={() => setView({ view: 'createStudy' })}>open</button>

      <button onClick={() => close()}>close</button>
    </>
  );
};

const WrappedViewManager = connect(undefined, mapDispatchToProps)(Sidebar);

/**
 * Provides redux store for ViewManager and sub components.
 * Hooks into redux to maintain that view.isVisible is in sync with component creation/deletion.
 */
export class SideBarWidget extends ReactWidget {
  constructor(private readonly reduxStore: typeof store) {
    super();
    this.id = 'optimizer:main-area';
    this.title.label = 'GCP Optimizer';
    this.title.closable = true;
  }

  onCloseRequest() {
    this.reduxStore.dispatch(close());
    this.dispose();
  }

  render() {
    return (
      <Provider store={this.reduxStore}>
        <WrappedViewManager />
      </Provider>
    );
  }
}