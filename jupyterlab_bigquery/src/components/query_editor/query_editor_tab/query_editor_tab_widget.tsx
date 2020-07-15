import QueryEditorTab from './query_editor_tab';
import * as React from 'react';
import { stylesheet } from 'typestyle';
import { ReduxReactWidget } from '../../../utils/widgetManager/redux_react_widget';

const localStyles = stylesheet({
  panel: {
    backgroundColor: 'white',
    height: '100%',
  },
});

export class QueryEditorTabWidget extends ReduxReactWidget {
  id = 'query-editor-tab';

  constructor() {
    super();
    this.title.label = 'Query Editor';
    this.title.closable = true;
  }

  renderReact() {
    return (
      <div className={localStyles.panel}>
        <QueryEditorTab isVisible={this.isVisible} />
      </div>
    );
  }
}
