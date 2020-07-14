import React, { Component } from 'react';
import QueryTextEditor from '../query_text_editor/query_text_editor';
import { WidgetManager } from '../../../utils/widgetManager/widget_manager';
import { EnhancedStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import QueryResults from '../query_editor_tab/query_editor_results';
import {
  QueryId,
  generateQueryId,
} from '../../../reducers/queryEditorTabSlice';

export class QueryEditorInCell extends Component {
  queryId: QueryId;
  store: EnhancedStore;

  constructor(pros) {
    super(pros, QueryEditorInCell);

    this.store = WidgetManager.getInstance().getStore();
    this.queryId = generateQueryId();
  }

  render() {
    return (
      <Provider store={this.store}>
        <div style={{ width: '80vw' }}>
          <QueryTextEditor queryId={this.queryId} />
          <QueryResults queryId={this.queryId} />
        </div>
      </Provider>
    );
  }
}

export default QueryEditorInCell;
