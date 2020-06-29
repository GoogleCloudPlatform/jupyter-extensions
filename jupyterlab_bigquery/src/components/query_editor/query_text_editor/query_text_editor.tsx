import React from 'react';
import Editor from '@monaco-editor/react';
import { connect } from 'react-redux';
import {
  updateQueryResult,
  resetQueryResult,
} from '../../../reducers/queryEditorTabSlice';

import { editor } from 'monaco-editor/esm/vs/editor/editor.api';

import { Button } from '@material-ui/core';
import { stylesheet } from 'typestyle';
import { QueryService } from './service/query';
import PagedService, { JobState } from '../../../utils/pagedAPI/paged_service';
import PagedJob from '../../../utils/pagedAPI/pagedJob';

interface QueryTextEditorState {
  buttonState: ButtonStates;
}

interface QueryTextEditorProps {
  updateQueryResult: any;
  resetQueryResult: any;
}

interface QueryResponseType {
  content: string;
  labels: string;
}

interface QueryRequestBodyType {
  query: string;
  jobConfig: {};
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
  job: PagedJob<QueryRequestBodyType, QueryResponseType> = null;

  pagedQueryService: PagedService<QueryRequestBodyType, QueryResponseType>;

  constructor(props) {
    super(props);
    this.state = {
      buttonState: ButtonStates.READY,
    };
    this.queryService = new QueryService();

    this.pagedQueryService = new PagedService('query');
  }

  async handleSubmit() {
    this.props.resetQueryResult();
    const query = this.editor.getValue();

    this.job = this.pagedQueryService.request(
      { query, jobConfig: {} },
      (state, _, response) => {
        if (state === JobState.Pending) {
          Object.keys(response).map(key => {
            response[key] = JSON.parse(response[key]);
          });

          this.props.updateQueryResult(response);
        }
      },
      2000
    );
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

const mapDispatchToProps = { updateQueryResult, resetQueryResult };

export default connect(mapStateToProps, mapDispatchToProps)(QueryTextEditor);
