import React from 'react';
import QueryTextEditor, {
  QUERY_DATA_TYPE,
  QueryResult,
} from '../query_text_editor/query_text_editor';
import QueryResults from '../query_text_editor/query_editor_results';
import {
  QueryId,
  generateQueryId,
} from '../../../reducers/queryEditorTabSlice';
import { stylesheet } from 'typestyle';
import { BASE_FONT } from 'gcp_jupyterlab_shared';

const localStyles = stylesheet({
  queryTextEditorRoot: {
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    height: '100%',
    ...BASE_FONT,
  },
});
import QueryResultsManager from '../../../utils/QueryResultsManager';
import { connect } from 'react-redux';

export interface QueryEditorTabProps {
  queries: { [key: string]: QueryResult };
  isVisible: boolean;
  queryId?: string;
  iniQuery?: string;
}

export interface QueryEditorTabState {
  isVisible: boolean;
}

class QueryEditorTab extends React.Component<
  QueryEditorTabProps,
  QueryEditorTabState
> {
  queryId: QueryId;
  queryManager: QueryResultsManager;

  constructor(props) {
    super(props);
    this.state = {
      isVisible: props.isVisible,
    };

    this.queryId = this.props.queryId ?? generateQueryId();
    this.queryManager = new QueryResultsManager(QUERY_DATA_TYPE);
  }

  render() {
    const showResult = this.queryManager.getSlotSize(this.queryId) > 0;

    return (
      <div className={localStyles.queryTextEditorRoot}>
        <QueryTextEditor
          queryId={this.queryId}
          iniQuery={this.props.iniQuery}
        />
        {showResult && <QueryResults queryId={this.queryId} />}
      </div>
    );
  }
}

const mapStateToProps = state => {
  return { queries: state.queryEditorTab.queries };
};

export default connect(mapStateToProps)(QueryEditorTab);
export { QueryEditorTab };
