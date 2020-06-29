import React from 'react';
import QueryTextEditor from '../query_text_editor/query_text_editor';
import QueryResults from './query_editor_results';

interface QueryEditorTabProps {
  isVisible: boolean;
}

class QueryEditorTab extends React.Component<QueryEditorTabProps, {}> {
  constructor(props) {
    super(props);
    this.state = {
      isVisible: props.isVisible,
    };
  }

  render() {
    return (
      <div style={{ height: '100%' }}>
        <QueryTextEditor />
        <QueryResults />
      </div>
    );
  }
}

export default QueryEditorTab;
