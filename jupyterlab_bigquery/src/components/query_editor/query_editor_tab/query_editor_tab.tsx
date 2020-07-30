import React from 'react';
import QueryTextEditor from '../query_text_editor/query_text_editor';
import QueryResults from './query_editor_results';
import {
  QueryId,
  generateQueryId,
} from '../../../reducers/queryEditorTabSlice';

interface QueryEditorTabProps {
  isVisible: boolean;
  queryId?: string;
  iniQuery?: string;
}

class QueryEditorTab extends React.Component<QueryEditorTabProps, {}> {
  queryId: QueryId;

  constructor(props) {
    super(props);
    this.state = {
      isVisible: props.isVisible,
    };

    this.queryId = this.props.queryId ?? generateQueryId();
  }

  render() {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          height: '100%',
        }}
      >
        <QueryTextEditor
          queryId={this.queryId}
          iniQuery={this.props.iniQuery}
        />
        <QueryResults queryId={this.queryId} />
      </div>
    );
  }
}

export default QueryEditorTab;
