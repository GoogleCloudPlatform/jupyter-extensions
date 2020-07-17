import React, { Component } from 'react';
import QueryTextEditor, {
  QueryResult,
} from '../query_text_editor/query_text_editor';
import { connect } from 'react-redux';
import QueryResults from '../query_editor_tab/query_editor_results';
import {
  QueryId,
  generateQueryId,
} from '../../../reducers/queryEditorTabSlice';
import { DOMWidgetView } from '@jupyter-widgets/base';

interface QueryEditorInCellProps {
  queryResult: QueryResult;
  ipyView: DOMWidgetView;
}

export class QueryEditorInCell extends Component<QueryEditorInCellProps, {}> {
  queryId: QueryId;
  iniQuery: string;

  constructor(pros) {
    super(pros, QueryEditorInCell);

    this.queryId = generateQueryId();
    this.iniQuery = this.props.ipyView.model.get('query') as string;

    const ipyView = this.props.ipyView;
    ipyView.model.once('change:query', this.queryChange, ipyView);
  }

  queryChange() {
    // TODO: handle python query change
  }

  render() {
    const { queryResult } = this.props;

    // eslint-disable-next-line no-extra-boolean-cast
    const showResult = !!queryResult;

    return (
      <div style={{ width: '80vw' }}>
        <QueryTextEditor queryId={this.queryId} iniQuery={this.iniQuery} />
        {showResult ? <QueryResults queryId={this.queryId} /> : undefined}
      </div>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  const queryId = ownProps.queryId;
  const queryResult = state.queryEditorTab.queries[queryId];

  return { queryResult: queryResult };
};

export default connect(mapStateToProps)(QueryEditorInCell);
