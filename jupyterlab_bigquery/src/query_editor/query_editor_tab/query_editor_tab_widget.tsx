import { ReactWidget, UseSignal } from '@jupyterlab/apputils';
import { Signal } from '@phosphor/signaling';
import QueryEditorTab from './query_editor_tab';
import { QueryResults } from './query_editor_results';
import * as React from 'react';
import { stylesheet } from 'typestyle';

const localStyles = stylesheet({
  panel: {
    backgroundColor: 'white',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignContent: 'stretch',
  },
});

export class QueryEditorTabWidget extends ReactWidget {
  static readonly id = 'query-editor-tab';
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

  render() {
    return (
      <UseSignal signal={this.visibleSignal}>
        {(_, isVisible) => {
          return (
            <div className={localStyles.panel}>
              <QueryEditorTab isVisible={isVisible} />
              <QueryResults />
            </div>
          );
        }}
      </UseSignal>
    );
  }
}
