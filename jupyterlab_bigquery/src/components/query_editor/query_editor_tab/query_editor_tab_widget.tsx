import QueryEditorTab from './query_editor_tab';
import * as React from 'react';
import { stylesheet } from 'typestyle';
import { ReduxReactWidget } from '../../../utils/widgetManager/redux_react_widget';
import { Signal } from '@phosphor/signaling';
import { Widget } from '@lumino/widgets';
import { UseSignal } from '@jupyterlab/apputils';

const localStyles = stylesheet({
  panel: {
    backgroundColor: 'white',
    height: '100%',
  },
});

export class QueryEditorTabWidget extends ReduxReactWidget {
  id = 'query-editor-tab';

  constructor(
    private editorNumber: number,
    private queryId: string,
    private iniQuery: string
  ) {
    super();
    this.title.label = `Query Editor ${this.editorNumber}`;
    this.title.closable = true;
  }
  private resizeSignal = new Signal<this, Widget.ResizeMessage>(this);

  onResize(msg: Widget.ResizeMessage) {
    this.resizeSignal.emit(msg);
  }

  renderReact() {
    return (
      <UseSignal signal={this.resizeSignal}>
        {(_, event: Widget.ResizeMessage) => {
          const width = event ? event.width : 0;
          return (
            <div className={localStyles.panel}>
              <QueryEditorTab
                isVisible={this.isVisible}
                queryId={this.queryId}
                iniQuery={this.iniQuery}
                width={width}
              />
            </div>
          );
        }}
      </UseSignal>
    );
  }
}
