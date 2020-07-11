import React, { Component } from 'react';
import QueryTextEditor from '../query_text_editor/query_text_editor';
import { WidgetManager } from '../../../utils/widgetManager/widget_manager';
import { EnhancedStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';

export class QueryEditorInCell extends Component {
  store: EnhancedStore;

  constructor(pros) {
    super(pros, QueryEditorInCell);

    this.store = WidgetManager.getInstance().getStore();
  }

  render() {
    return (
      <Provider store={this.store}>
        <QueryTextEditor />
      </Provider>
    );
  }
}

export default QueryEditorInCell;
