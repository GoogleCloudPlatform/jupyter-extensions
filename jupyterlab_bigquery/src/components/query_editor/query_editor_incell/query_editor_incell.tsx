import React, { Component } from 'react';
import QueryTextEditor, {
  QueryResult,
  QUERY_DATA_TYPE,
} from '../query_text_editor/query_text_editor';
import { connect } from 'react-redux';
import QueryResults from '../query_text_editor/query_editor_results';
import {
  QueryId,
  generateQueryId,
} from '../../../reducers/queryEditorTabSlice';
import { DOMWidgetView } from '@jupyter-widgets/base';
import { stylesheet } from 'typestyle';
import { BASE_FONT } from 'gcp_jupyterlab_shared';
import BigDataManager from '../../../utils/BigDataManager';

const localStyles = stylesheet({
  inCellEditorRoot: {
    ...BASE_FONT,
  },
});

interface QueryEditorInCellProps {
  queries: { [key: string]: QueryResult };
  ipyView: DOMWidgetView;
}

// flag from python, requesting dataframe
const DEST_VAL_FLAG = 'destination_var';

export class QueryEditorInCell extends Component<QueryEditorInCellProps, {}> {
  queryId: QueryId;
  iniQuery: string;
  queryFlags: { [keys: string]: any };
  queryManager: BigDataManager;

  constructor(pros) {
    super(pros, QueryEditorInCell);

    this.queryId = generateQueryId();
    this.iniQuery = this.props.ipyView.model.get('query') as string;
    const rawQueryFlags = this.props.ipyView.model.get('query_flags') as string;
    this.queryFlags = JSON.parse(rawQueryFlags);
    this.queryManager = new BigDataManager(QUERY_DATA_TYPE);
  }

  render() {
    const showResult = this.queryManager.getSlotSize(this.queryId) > 0;

    return (
      <div className={localStyles.inCellEditorRoot}>
        <QueryTextEditor
          queryId={this.queryId}
          iniQuery={this.iniQuery}
          editorType="IN_CELL"
          queryFlags={this.queryFlags}
          onQueryChange={query => {
            this.props.ipyView.model.set('query', query);
            this.props.ipyView.touch();
          }}
          onQueryFInish={queryResult => {
            if (this.queryFlags[DEST_VAL_FLAG]) {
              const dfData = {
                content: queryResult,
                labels: this.props.queries[this.queryId].labels,
              };

              const val = showResult ? JSON.stringify(dfData) : '';
              this.props.ipyView.model.set('result', val);
              this.props.ipyView.touch();
            }
          }}
        />
        {showResult ? (
          <QueryResults queryId={this.queryId} editorType="IN_CELL" />
        ) : (
          undefined
        )}
      </div>
    );
  }
}

const mapStateToProps = state => {
  return { queries: state.queryEditorTab.queries };
};

export default connect(mapStateToProps)(QueryEditorInCell);
