import React, { Component } from 'react';
import QueryTextEditor, {
  QueryResult,
} from '../query_text_editor/query_text_editor';
import { connect } from 'react-redux';
import QueryResults from '../query_text_editor/query_editor_results';
import {
  QueryId,
  generateQueryId,
} from '../../../reducers/queryEditorTabSlice';
import { DOMWidgetView } from '@jupyter-widgets/base';
import ReactResizeDetector from 'react-resize-detector';

interface QueryEditorInCellProps {
  queries: { [key: string]: QueryResult };
  ipyView: DOMWidgetView;
}

export class QueryEditorInCell extends Component<QueryEditorInCellProps, {}> {
  queryId: QueryId;
  iniQuery: string;
  queryFlags: { [keys: string]: any };

  constructor(pros) {
    super(pros, QueryEditorInCell);

    this.queryId = generateQueryId();
    this.iniQuery = this.props.ipyView.model.get('query') as string;
    const rawQueryFlags = this.props.ipyView.model.get('query_flags') as string;
    this.queryFlags = JSON.parse(rawQueryFlags);
  }

  sendQueryToPython(query) {
    const val = query ? JSON.stringify(query) : '';
    this.props.ipyView.model.set('result', val);
    this.props.ipyView.touch();
  }

  render() {
    const { queries } = this.props;

    const queryResult = queries[this.queryId];
    // eslint-disable-next-line no-extra-boolean-cast
    const showResult = !!queryResult && queryResult.content.length > 0;

    return (
      <ReactResizeDetector>
        {({ width }) => {
          return (
            <div>
              <QueryTextEditor
                queryId={this.queryId}
                iniQuery={this.iniQuery}
                editorType="IN_CELL"
                queryFlags={this.queryFlags}
                width={width}
                onFinishQuery={this.sendQueryToPython.bind(this)}
              />
              {showResult ? (
                <QueryResults queryId={this.queryId} editorType="IN_CELL" />
              ) : (
                undefined
              )}
            </div>
          );
        }}
      </ReactResizeDetector>
    );
  }
}

const mapStateToProps = state => {
  return { queries: state.queryEditorTab.queries };
};

export default connect(mapStateToProps)(QueryEditorInCell);
