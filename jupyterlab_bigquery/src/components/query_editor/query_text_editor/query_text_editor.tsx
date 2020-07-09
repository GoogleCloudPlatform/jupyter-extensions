import React from 'react';
import Editor from '@monaco-editor/react';
import { connect } from 'react-redux';
import {
  updateQueryResult,
  resetQueryResult,
} from '../../../reducers/queryEditorTabSlice';

import { editor } from 'monaco-editor/esm/vs/editor/editor.api';

import { Button, CircularProgress, Typography } from '@material-ui/core';
import { stylesheet } from 'typestyle';
import PagedService, { JobState } from '../../../utils/pagedAPI/paged_service';
import PagedJob from '../../../utils/pagedAPI/pagedJob';

interface QueryTextEditorState {
  buttonState: ButtonStates;
  bytesProcessed: number | null;
  errorMsg: string | null;
}

interface QueryTextEditorProps {
  updateQueryResult: any;
  resetQueryResult: any;
}

interface QueryResponseType {
  content: string;
  labels: string;
  bytesProcessed: number;
}

interface QueryRequestBodyType {
  query: string;
  jobConfig: {};
  dryRunOnly: boolean;
}

const SQL_EDITOR_OPTIONS: editor.IEditorConstructionOptions = {
  lineNumbers: 'on',
  automaticLayout: true,
  formatOnType: true,
  formatOnPaste: true,
  wordWrap: 'on',
  wrappingIndent: 'same',
  wrappingStrategy: 'advanced',
};

const styleSheet = stylesheet({
  queryButton: { float: 'right', width: '100px', maxWidth: '200px' },
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
  editor: editor.IStandaloneCodeEditor;
  job: PagedJob<QueryRequestBodyType, QueryResponseType>;
  timeoutAlarm: NodeJS.Timeout;

  pagedQueryService: PagedService<QueryRequestBodyType, QueryResponseType>;

  constructor(props) {
    super(props);
    this.state = {
      buttonState: ButtonStates.READY,
      bytesProcessed: null,
      errorMsg: null,
    };
    this.pagedQueryService = new PagedService('query');
    this.timeoutAlarm = null;
  }

  handleButtonClick() {
    switch (this.state.buttonState) {
      case ButtonStates.READY:
      case ButtonStates.ERROR:
        this.handleQuery();
        break;
      case ButtonStates.PENDING:
        this.handleCancel();
    }
  }

  handleCancel() {
    // eslint-disable-next-line no-extra-boolean-cast
    if (!!this.job) {
      this.job.cancel();
    }
  }

  handleQuery() {
    this.props.resetQueryResult();
    const query = this.editor.getValue();

    this.setState({
      buttonState: ButtonStates.PENDING,
      bytesProcessed: null,
      errorMsg: null,
    });

    this.job = this.pagedQueryService.request(
      { query, jobConfig: {}, dryRunOnly: false },
      (state, _, response) => {
        if (state === JobState.Pending) {
          response = response as QueryResponseType;

          Object.keys(response).map(key => {
            response[key] = JSON.parse(response[key]);
          });

          this.setState({ bytesProcessed: response.bytesProcessed });
          this.props.updateQueryResult(response);
        } else if (state === JobState.Fail) {
          this.setState({
            buttonState: ButtonStates.ERROR,
            errorMsg: response as string,
          });

          // switch to normal button after certain time
          setTimeout(() => {
            this.setState({ buttonState: ButtonStates.READY });
          }, 2000);
        } else if (state === JobState.Done) {
          this.setState({ buttonState: ButtonStates.READY });
        }
      },
      2000
    );
  }

  handleEditorDidMount(_, editor) {
    this.editor = editor;

    this.editor.onKeyUp(() => {
      // eslint-disable-next-line no-extra-boolean-cast
      if (!!this.timeoutAlarm) {
        clearTimeout(this.timeoutAlarm);
        this.setState({ errorMsg: null });
      }
      this.timeoutAlarm = setTimeout(this.checkSQL.bind(this), 1500);
    });
  }

  checkSQL() {
    const query = this.editor.getValue();
    this.pagedQueryService.request(
      { query, jobConfig: {}, dryRunOnly: true },
      (state, _, response) => {
        if (state === JobState.Fail) {
          this.setState({
            errorMsg: response as string,
          });
        }
      }
    );
  }

  readableBytes(bytes: number) {
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

    return (bytes / Math.pow(1024, i)).toFixed(2) + ' ' + sizes[i];
  }

  renderButton() {
    const buttonState = this.state.buttonState;
    let color = undefined;
    let content = undefined;

    switch (buttonState) {
      case ButtonStates.PENDING:
        color = 'default';
        content = (
          <div style={{ display: 'flex', flexDirection: 'row', width: '100%' }}>
            <CircularProgress size="75%" style={{ alignSelf: 'center' }} />
            <Typography variant="button">Cancel</Typography>
          </div>
        );
        break;
      case ButtonStates.READY:
        color = 'primary';
        content = 'Submit';
        break;
      case ButtonStates.ERROR:
        color = 'secondary';
        content = 'Error';
        break;
    }

    return (
      <Button
        color={color}
        variant="contained"
        onClick={this.handleButtonClick.bind(this)}
        className={styleSheet.queryButton}
      >
        {content}
      </Button>
    );
  }

  renderOptionalText(text, config = {}) {
    // eslint-disable-next-line no-extra-boolean-cast
    if (!!text) {
      return (
        <Typography
          style={{
            marginRight: '10px',
            marginLeft: '10px',
            alignSelf: 'center',
            justifySelf: 'center',
          }}
          variant="body1"
          {...config}
        >
          {text}
        </Typography>
      );
    }

    return undefined;
  }

  render() {
    // eslint-disable-next-line no-extra-boolean-cast
    const readableSize = !!this.state.bytesProcessed
      ? 'Processed ' + this.readableBytes(this.state.bytesProcessed)
      : null;

    const errMsg = this.state.errorMsg;

    return (
      <div style={{ height: '50%' }}>
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

        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'flex-end',
          }}
        >
          {this.renderOptionalText(errMsg, {
            variant: 'caption',
            color: 'error',
          })}
          {this.renderOptionalText(readableSize)}
          {this.renderButton()}
        </div>
      </div>
    );
  }
}

const mapStateToProps = _ => {
  return {};
};

const mapDispatchToProps = { updateQueryResult, resetQueryResult };

export default connect(mapStateToProps, mapDispatchToProps)(QueryTextEditor);
