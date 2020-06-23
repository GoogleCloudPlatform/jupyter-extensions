import { ReactWidget, UseSignal } from '@jupyterlab/apputils';
import { Signal } from '@phosphor/signaling';
import QueryEditorTab from './query_editor_tab';
import * as React from 'react';

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
          return <QueryEditorTab isVisible={isVisible} />;
        }}
      </UseSignal>
    );
  }
}
