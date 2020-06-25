import React from 'react';
import Editor from '@monaco-editor/react';

import { editor } from 'monaco-editor/esm/vs/editor/editor.api';

import { Button } from '@material-ui/core';
import { stylesheet } from 'typestyle';
import { QueryService, QueryResult } from './service/query';

interface QueryTextEditorState {
  buttonState: ButtonStates;
}

const SQL_EDITOR_OPTIONS: editor.IEditorConstructionOptions = {
  lineNumbers: 'on',
  automaticLayout: true,
};

const styleSheet = stylesheet({
  queryButton: { float: 'right' },
});

enum ButtonStates {
  READY,
  PENDING,
  ERROR,
}

class QueryTextEditor extends React.Component<{}, QueryTextEditorState> {
  queryService: QueryService;
  editor: editor.IStandaloneCodeEditor;

  constructor(props: {}) {
    super(props);
    this.state = {
      buttonState: ButtonStates.READY,
    };
    this.queryService = new QueryService();
  }

  async handleSubmit() {
    const query = this.editor.getValue();

    this.queryService
      .query(query)
      .then((res: QueryResult) => {
        console.log(res);
        //TODO: handle success
      })
      .catch(err => {
        //TODO: Handle fail query
      });
  }

  handleEditorDidMount(_, editor) {
    this.editor = editor;
  }

  render() {
    return (
      <div>
        <Editor
          width="100vw"
          height="40vh"
          theme={'light'}
          language={'sql'}
          value={'// type your code...'}
          editorDidMount={this.handleEditorDidMount.bind(this)}
          options={SQL_EDITOR_OPTIONS}
        />
        <Button
          color="primary"
          variant="contained"
          onClick={this.handleSubmit.bind(this)}
          className={styleSheet.queryButton}
        >
          Submit
        </Button>
      </div>
    );
  }
}

export default QueryTextEditor;
