import * as React from 'react';
import { ReactWidget } from '@jupyterlab/apputils';
import { store, RootState } from '../../store/store';
import { Provider, connect } from 'react-redux';
import { close, ViewType } from '../../store/view';
import { CreateStudy } from '../create_study';
import { Dashboard } from '../dashboard';
import { SuggestTrials } from '../suggest_trials';
import { StudyDetails } from '../study_details';
import { VisualizeTrials } from '../trial_visualization';

const mapStateToProps = (state: RootState) => ({
  data: state.view.data,
});

/**
 * ViewManager acts as the extensions router for various views.
 */
export const ViewManager = ({ data }: { data: ViewType }) => {
  switch (data.view) {
    case 'dashboard':
      return <Dashboard />;
    case 'createStudy':
      return <CreateStudy />;
    case 'studyDetails':
      return <StudyDetails studyId={data.studyId} />;
    case 'suggestTrials':
      return <SuggestTrials studyName={data.studyId} />;
    case 'visualizeTrials':
      return <VisualizeTrials studyName={data.studyId} />;
  }
};

const WrappedViewManager = connect(mapStateToProps)(ViewManager);

/**
 * Provides redux store for ViewManager and sub components.
 * Hooks into redux to maintain that view.isVisible is in sync with component creation/deletion.
 */
export class MainAreaWidget extends ReactWidget {
  constructor(private readonly reduxStore: typeof store) {
    super();
    this.id = 'optimizer:main-area';
    this.title.label = 'GCP Optimizer';
    this.title.iconClass = 'jp-Icon jp-Icon-20 jp-optimizer-icon';
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
