import React from 'react';
import Editor, { monaco, Monaco } from '@monaco-editor/react';
import copy from 'copy-to-clipboard';
import { connect } from 'react-redux';
import {
  updateQueryResult,
  resetQueryResult,
  deleteQueryEntry,
  QueryId,
  generateQueryId,
} from '../../../reducers/queryEditorTabSlice';

import { editor } from 'monaco-editor/esm/vs/editor/editor.api';

import {
  PlayCircleFilledRounded,
  PauseCircleOutline,
  CheckCircleOutline,
  ErrorOutlineOutlined,
  FileCopyOutlined,
  FullscreenOutlined,
} from '@material-ui/icons';
import {
  Button,
  CircularProgress,
  Typography,
  IconButton,
} from '@material-ui/core';
import { stylesheet } from 'typestyle';
import PagedService, { JobState } from '../../../utils/pagedAPI/paged_service';
import PagedJob from '../../../utils/pagedAPI/pagedJob';
import { QueryEditorType } from './query_editor_results';
import { WidgetManager } from '../../../utils/widgetManager/widget_manager';
import { QueryEditorTabWidget } from '../query_editor_tab/query_editor_tab_widget';

interface QueryTextEditorState {
  queryState: QueryStates;
  bytesProcessed: number | null;
  message: string | null;
  ifMsgErr: boolean;
  height: number;
  renderMonacoEditor: boolean;
}

interface QueryTextEditorProps {
  updateQueryResult: any;
  resetQueryResult: any;
  deleteQueryEntry: any;
  queryId: QueryId;
  iniQuery?: string;
  editorType?: QueryEditorType;
  queryFlags?: { [keys: string]: any };
  width?: number;
  onQueryChange?: (string) => void;
}

interface QueryResponseType {
  content: string;
  labels: string;
  bytesProcessed: number;
}

export interface QueryResult {
  content: Array<Array<unknown>>;
  labels: Array<string>;
  bytesProcessed: number;
  queryId: QueryId;
  project: string;
  query: string;
}

interface QueryRequestBodyType {
  query: string;
  jobConfig: {};
  dryRunOnly: boolean;
}

const SQL_EDITOR_OPTIONS: editor.IEditorConstructionOptions = {
  lineNumbers: 'on',
  formatOnType: true,
  formatOnPaste: true,
  wordWrap: 'on',
  wrappingIndent: 'same',
  wrappingStrategy: 'advanced',
  minimap: { enabled: false },
  cursorStyle: 'line-thin',
};

const styleSheet = stylesheet({
  queryButton: {
    marginTop: ' 2px',
    marginBottom: ' 2px',
    marginRight: '20px',
    fontSize: '10px',
  },
  statusBarText: {
    textAlign: 'center',
    textTransform: 'none',
    fontWeight: 'bold',
  },
  queryTextEditor: {
    minHeight: '200px',
    flex: 1,
  },
  queryTextEditorInCell: {
    minHeight: '300px',
    height: '30vh',
  },
  wholeEditor: {
    // 4/9 of panel height (in relation to results)
    flex: 4,
    minHeight: 0,
    display: 'flex',
    flexDirection: 'column',
    border: '1px solid rgb(218, 220, 224)',
  },
  message: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
  },
  messageIcon: {
    marginRight: '0.5rem',
  },
  wholeEditorInCell: {
    border: '1px solid rgb(218, 220, 224)',
  },
  pendingStatus: {
    display: 'flex',
    flexDirection: 'row',
    width: '100%',
  },
  buttonInfoBar: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: '5px',
    paddingBottom: '5px',
    paddingLeft: '10px',
    paddingRight: '10px',
    backgroundColor: 'rgb(248, 249, 250)',
    borderBottom: '1px solid rgb(218, 220, 224)',
  },
});

enum QueryStates {
  READY,
  PENDING,
  ERROR,
}

class QueryTextEditor extends React.Component<
  QueryTextEditorProps,
  QueryTextEditorState
> {
  editor: editor.IStandaloneCodeEditor;
  monacoInstance: Monaco;
  job: PagedJob<QueryRequestBodyType, QueryResponseType>;
  timeoutAlarm: NodeJS.Timeout;
  queryId: QueryId;
  queryFlags: {};

  pagedQueryService: PagedService<QueryRequestBodyType, QueryResponseType>;

  constructor(props) {
    super(props);
    this.state = {
      queryState: QueryStates.READY,
      bytesProcessed: null,
      message: null,
      ifMsgErr: false,
      height: 0,
      renderMonacoEditor: false,
    };
    this.pagedQueryService = new PagedService('query');
    this.timeoutAlarm = null;
    this.queryId = props.queryId;
    this.queryFlags = !this.props.queryFlags ? {} : this.props.queryFlags;

    monaco.init().then(monacoInstance => {
      this.monacoInstance = monacoInstance;
      this.monacoInstance.editor.defineTheme('sqlTheme', {
        base: 'vs',
        inherit: true,
        rules: [],
        colors: {
          'editorGutter.background': '#f8f9fa',
        },
      });
    });
  }

  updateDimensions() {
    this.editor.layout();
  }

  componentDidMount() {
    window.addEventListener('resize', this.updateDimensions.bind(this));

    // Delay rendering of monaco editor to avoid mal-size
    setTimeout(() => {
      this.setState({ renderMonacoEditor: true });
    }, 100);
  }

  componentWillUnmount() {
    this.props.deleteQueryEntry(this.queryId);
    window.removeEventListener('resize', this.updateDimensions.bind(this));
  }

  componentDidUpdate(
    prevProps: QueryTextEditorProps,
    prevState: QueryTextEditorState
  ) {
    if (
      (prevProps.width !== this.props.width ||
        prevState.height !== this.state.height) &&
      this.editor
    ) {
      this.editor.layout({
        width: this.props.width,
        height: this.state.height,
      });
    }
  }

  handleButtonClick() {
    switch (this.state.queryState) {
      case QueryStates.READY:
      case QueryStates.ERROR:
        this.handleQuery();
        break;
    }
  }

  handleCancel() {
    // eslint-disable-next-line no-extra-boolean-cast
    if (!!this.job) {
      this.job.cancel();
    }
  }

  handleQuery() {
    this.props.resetQueryResult(this.props.queryId);
    const query = this.editor.getValue();

    this.setState({
      queryState: QueryStates.PENDING,
      bytesProcessed: null,
      message: null,
      ifMsgErr: false,
    });

    this.job = this.pagedQueryService.request(
      { query, jobConfig: this.queryFlags, dryRunOnly: false },
      (state, _, response) => {
        if (state === JobState.Pending) {
          response = response as QueryResponseType;

          Object.keys(response).map(key => {
            response[key] = JSON.parse(response[key]);
          });

          this.setState({ bytesProcessed: response.bytesProcessed });
          const processed = (response as unknown) as QueryResult;
          processed.queryId = this.queryId;
          processed.query = query;

          this.props.updateQueryResult(processed);
        } else if (state === JobState.Fail) {
          this.setState({
            queryState: QueryStates.ERROR,
            bytesProcessed: null,
            message: response as string,
            ifMsgErr: true,
          });

          // switch to normal button after certain time
          setTimeout(() => {
            this.setState({ queryState: QueryStates.READY });
          }, 2000);
        } else if (state === JobState.Done) {
          this.setState({ queryState: QueryStates.READY });
        }
      },
      2000
    );
  }

  handleEditorDidMount(_, editor) {
    if (this.editorRef.current) {
      this.setState({ height: this.editorRef.current.clientHeight });
    }
    this.editor = editor;

    this.editor.onKeyUp(() => {
      if (this.props.onQueryChange) {
        const query = this.editor.getValue();
        this.props.onQueryChange(query);
      }

      this.setState({ bytesProcessed: null, message: null, ifMsgErr: false });
      // eslint-disable-next-line no-extra-boolean-cast
      if (!!this.timeoutAlarm) {
        clearTimeout(this.timeoutAlarm);
      }
      this.timeoutAlarm = setTimeout(this.checkSQL.bind(this), 1500);
      this.resetMarkers();
    });

    // initial check
    this.checkSQL();
  }

  checkSQL() {
    const query = this.editor.getValue();

    if (!query) {
      return;
    }

    this.pagedQueryService.request(
      { query, jobConfig: this.queryFlags, dryRunOnly: true },
      (state, _, response) => {
        if (state === JobState.Fail) {
          const res = response as string;

          this.setState({
            bytesProcessed: null,
            message: res,
            ifMsgErr: true,
          });

          // deal with errors
          this.handleSyntaxError(res);
          this.handleNotFound(res);
        } else if (state === JobState.Pending) {
          response = response as QueryResponseType;
          this.setState({
            bytesProcessed: response.bytesProcessed,
            message: null,
            ifMsgErr: false,
          });
        }
      }
    );
  }

  async handleNotFound(response: string) {
    const prompt = 'Not found:';
    response = response.trim();
    if (!response.startsWith(prompt)) {
      return;
    }

    const body = response;
    // response follow the format "not found: [Table, Dataset, etc] xxx:name"
    const errStr = response
      .split(' ')[3]
      .split(':')
      .pop();
    const model = this.editor.getModel();
    const texts = model.getValue().split('\n');

    let line = -1;
    let pos = -1;

    for (let i = 0; i < texts.length; i++) {
      const text = texts[i];
      const indx = text.indexOf(errStr);
      if (indx !== -1) {
        line = i + 1;
        pos = indx;
      }
    }

    const startPos = pos;
    const endPos = pos + errStr.length;

    this.monacoInstance.editor.setModelMarkers(model, 'owner', [
      {
        startLineNumber: line,
        endLineNumber: line,
        startColumn: startPos,
        endColumn: endPos,
        message: body,
        severity: this.monacoInstance.MarkerSeverity.Error,
      },
    ]);
  }

  async handleSyntaxError(response: string) {
    const prompt = 'Syntax error:';
    response = response.trim();
    if (!response.startsWith(prompt)) {
      return;
    }

    // error message follows the format xxxx at [row:column]
    const body = response.substring(prompt.length, response.lastIndexOf('at'));
    const posStr = response.substring(
      response.lastIndexOf('[') + 1,
      response.lastIndexOf(']')
    );

    const [line, pos] = posStr.split(':').map(x => parseInt(x, 10));
    const model = this.editor.getModel();
    const text = model.getValue().split('\n')[line - 1];

    const startPos = pos;
    const errLen = text.substring(pos).indexOf(' ');
    const endPos = errLen !== -1 ? errLen + pos + 1 : text.length + 1;
    this.monacoInstance.editor.setModelMarkers(model, 'owner', [
      {
        startLineNumber: line,
        endLineNumber: line,
        startColumn: startPos,
        endColumn: endPos,
        message: body,
        severity: this.monacoInstance.MarkerSeverity.Error,
      },
    ]);
  }

  resetMarkers() {
    const model = this.editor.getModel();
    this.monacoInstance.editor.setModelMarkers(model, 'owner', []);
  }

  readableBytes(bytes: number) {
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

    return (bytes / Math.pow(1024, i)).toFixed(2) + ' ' + sizes[i];
  }

  renderButton() {
    const buttonState = this.state.queryState;
    let content = undefined;
    let startIcon = undefined;

    switch (buttonState) {
      case QueryStates.PENDING:
        content = 'Running';
        startIcon = (
          <CircularProgress size="1rem" thickness={5} color="secondary" />
        );
        break;
      case QueryStates.READY:
      case QueryStates.ERROR:
        content = 'Submit query';
        startIcon = <PlayCircleFilledRounded />;
        break;
    }

    return (
      <Button
        color="primary"
        size="small"
        variant="contained"
        onClick={this.handleButtonClick.bind(this)}
        className={styleSheet.queryButton}
        startIcon={startIcon}
      >
        {this.renderButtontext(content)}
      </Button>
    );
  }

  renderCancelButton() {
    const buttonState = this.state.queryState;
    if (buttonState !== QueryStates.PENDING) {
      return undefined;
    }

    return (
      <Button
        onClick={this.handleCancel.bind(this)}
        size="small"
        startIcon={<PauseCircleOutline />}
        color="primary"
      >
        {this.renderButtontext('stop')}
      </Button>
    );
  }

  renderButtontext(text) {
    return (
      <Typography
        style={{ fontSize: '0.8rem' }}
        className={styleSheet.statusBarText}
      >
        {text}
      </Typography>
    );
  }

  renderOptionalText(text, config = {}) {
    // eslint-disable-next-line no-extra-boolean-cast
    if (!!text) {
      return (
        <Typography
          style={{ fontSize: '0.7rem' }}
          className={styleSheet.statusBarText}
          {...config}
        >
          {text}
        </Typography>
      );
    }

    return undefined;
  }

  private editorRef = React.createRef<HTMLDivElement>();

  renderMessage() {
    // eslint-disable-next-line no-extra-boolean-cast
    const readableSize = !!this.state.bytesProcessed
      ? this.readableBytes(this.state.bytesProcessed)
      : null;

    const message = this.state.message;
    const ifMsgErr = this.state.ifMsgErr;

    if (!message && !readableSize) {
      return;
    }

    if (ifMsgErr) {
      return (
        <div className={styleSheet.message}>
          <ErrorOutlineOutlined
            className={styleSheet.messageIcon}
            color="error"
            fontSize="small"
          />
          {this.renderOptionalText(message)}
        </div>
      );
    } else if (readableSize !== null) {
      const sizeMsg = `This query will process ${readableSize} when run.`;
      return (
        <div className={styleSheet.message}>
          <CheckCircleOutline
            className={styleSheet.messageIcon}
            fontSize="small"
            htmlColor="rgb(15, 157, 88)"
          />
          {this.renderOptionalText(sizeMsg)}
        </div>
      );
    }
  }

  renderCopyButton() {
    return (
      <IconButton
        size="small"
        onClick={_ => {
          const query = this.editor.getValue();
          copy(query.trim());
        }}
      >
        <FileCopyOutlined fontSize="small" />
      </IconButton>
    );
  }

  renderOpenTabQueryEditorButton() {
    return (
      <IconButton
        size="small"
        onClick={_ => {
          const query = this.editor.getValue();
          const queryId = generateQueryId();
          WidgetManager.getInstance().launchWidget(
            QueryEditorTabWidget,
            'main',
            queryId,
            undefined,
            [queryId, query]
          );
        }}
      >
        <FullscreenOutlined />
      </IconButton>
    );
  }

  handleKeyPress(evt) {
    if ((evt.ctrlKey || evt.metaKey) && evt.key === 'Enter') {
      this.handleButtonClick();
    }
  }

  render() {
    const { iniQuery } = this.props;

    // eslint-disable-next-line no-extra-boolean-cast
    const queryValue = !!iniQuery ? iniQuery : '';

    const ifIncell = this.props.editorType === 'IN_CELL';

    return (
      <div
        className={
          ifIncell ? styleSheet.wholeEditorInCell : styleSheet.wholeEditor
        }
        onKeyPress={this.handleKeyPress.bind(this)}
      >
        <div className={styleSheet.buttonInfoBar}>
          <div>
            {this.renderButton()}
            {this.renderCancelButton()}
          </div>
          <div
            style={{
              alignSelf: 'center',
              display: 'flex',
              flexDirection: 'row',
            }}
          >
            {this.renderMessage()}
            {this.renderCopyButton()}
            {ifIncell && this.renderOpenTabQueryEditorButton()}
          </div>
        </div>

        <div
          className={
            ifIncell
              ? styleSheet.queryTextEditorInCell
              : styleSheet.queryTextEditor
          }
          ref={this.editorRef}
        >
          {this.state.renderMonacoEditor && (
            <Editor
              width="100%"
              height="100%"
              theme={'sqlTheme'}
              language={'sql'}
              value={queryValue}
              editorDidMount={this.handleEditorDidMount.bind(this)}
              options={SQL_EDITOR_OPTIONS}
            />
          )}
        </div>
      </div>
    );
  }
}

const mapStateToProps = _ => {
  return {};
};

const mapDispatchToProps = {
  updateQueryResult,
  resetQueryResult,
  deleteQueryEntry,
};

export default connect(mapStateToProps, mapDispatchToProps)(QueryTextEditor);
