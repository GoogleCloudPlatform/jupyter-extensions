import React from 'react';
import QueryTextEditor, {
  QUERY_DATA_TYPE,
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
import BigDataManager from '../../../utils/BigDataManager';

interface QueryEditorTabProps {
  isVisible: boolean;
  queryId?: string;
  iniQuery?: string;
}

class QueryEditorTab extends React.Component<QueryEditorTabProps, {}> {
  queryId: QueryId;
  queryManager: BigDataManager;

  constructor(props) {
    super(props);
    this.state = {
      isVisible: props.isVisible,
    };

    this.queryId = this.props.queryId ?? generateQueryId();
    this.queryManager = new BigDataManager(QUERY_DATA_TYPE);
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

export default QueryEditorTab;
