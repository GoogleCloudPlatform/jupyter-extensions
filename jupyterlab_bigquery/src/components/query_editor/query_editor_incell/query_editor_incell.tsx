import React, { Component } from 'react';
import QueryTextEditor from '../query_text_editor/query_text_editor';
import { WidgetManager } from '../../../utils/widgetManager/widget_manager';
import { EnhancedStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import QueryResults from '../query_editor_tab/query_editor_results';

export class QueryEditorInCell extends Component {
  store: EnhancedStore;

  constructor(pros) {
    super(pros, QueryEditorInCell);

    this.store = WidgetManager.getInstance().getStore();
  }

  render() {
    return (
      <Provider store={this.store}>
        <div style={{ width: '80vw' }}>
          <QueryTextEditor />
          <QueryResults />
        </div>
      </Provider>
    );
  }
}

export default QueryEditorInCell;
