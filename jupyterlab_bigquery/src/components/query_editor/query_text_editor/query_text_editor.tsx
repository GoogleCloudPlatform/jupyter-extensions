import React from 'react';
import Editor from '@monaco-editor/react';
import { connect } from 'react-redux';
import { updateQueryResult } from '../../../reducers/queryEditorTabSlice';

import { editor } from 'monaco-editor/esm/vs/editor/editor.api';

import { Button } from '@material-ui/core';
import { stylesheet } from 'typestyle';
import { QueryService, QueryResult } from './service/query';

interface QueryTextEditorState {
  buttonState: ButtonStates;
}

interface QueryTextEditorProps {
  updateQueryResult: any;
}

const SQL_EDITOR_OPTIONS: editor.IEditorConstructionOptions = {
  lineNumbers: 'on',
  automaticLayout: true,
  formatOnType: true,
  formatOnPaste: true,
  wordWrapColumn: 80,
  wordWrap: 'bounded',
  wrappingIndent: 'same',
  wrappingStrategy: 'advanced',
};

const styleSheet = stylesheet({
  queryButton: { float: 'right' },
});

enum ButtonStates {
  READY,
  PENDING,
  ERROR,
}

class QueryTextEditor extends React.Component<
  QueryTextEditorProps,
  QueryTextEditorState
> {
  queryService: QueryService;
  editor: editor.IStandaloneCodeEditor;

  constructor(props) {
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
        //TODO: handle success
        this.props.updateQueryResult(res);
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
          value={
            'SELECT * FROM `jupyterlab-interns-sandbox.covid19_public_forecasts.county_14d` LIMIT 10'
          }
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

const mapStateToProps = _ => {
  return {};
};

const mapDispatchToProps = { updateQueryResult };

export default connect(mapStateToProps, mapDispatchToProps)(QueryTextEditor);
