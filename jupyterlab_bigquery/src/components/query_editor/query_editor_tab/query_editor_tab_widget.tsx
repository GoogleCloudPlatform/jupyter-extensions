import { UseSignal } from '@jupyterlab/apputils';
import { Signal } from '@phosphor/signaling';
import QueryEditorTab from './query_editor_tab';
import * as React from 'react';
import { stylesheet } from 'typestyle';
import { ReduxReactWidget } from '../../../utils/ReduxReactWidget';

const localStyles = stylesheet({
  panel: {
    backgroundColor: 'white',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignContent: 'stretch',
  },
});

export class QueryEditorTabWidget extends ReduxReactWidget {
  id = 'query-editor-tab';
  private visibleSignal = new Signal<QueryEditorTabWidget, boolean>(this);

  constructor() {
    super();
    this.title.label = 'Query Editor';
    this.title.closable = true;
  }

  onAfterHide() {
    this.visibleSignal.emit(false);
  }

  onAfterShow() {
    this.visibleSignal.emit(true);
  }

  renderReact() {
    return (
      <UseSignal signal={this.visibleSignal}>
        {(_, isVisible) => {
          return (
            <div className={localStyles.panel}>
              <QueryEditorTab isVisible={isVisible} />
            </div>
          );
        }}
      </UseSignal>
    );
  }
}
