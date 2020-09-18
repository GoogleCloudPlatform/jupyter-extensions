import copy from 'copy-to-clipboard';
import React, { Component } from 'react';
import { stylesheet } from 'typestyle';
import { connect } from 'react-redux';
import { QueryResult, QUERY_DATA_TYPE } from './query_text_editor';
import { QueryId } from '../../../reducers/queryEditorTabSlice';
import { BQTable } from '../../shared/bq_table';
import { gColor } from '../../shared/styles';
import { Button, Typography } from '@material-ui/core';
import QueryResultsManager from '../../../utils/QueryResultsManager';
import { formatBytes } from '../../../utils/formatters';
import { WidgetManager } from '../../../utils/widgetManager/widget_manager';
import { NotebookActions } from '@jupyterlab/notebook';
import { SnackbarState, openSnackbar } from '../../../reducers/snackbarSlice';
import { COPIED_AUTOHIDE_DURATION } from '../../shared/snackbar';

const localStyles = stylesheet({
  resultsContainer: {
    // 5/9 of panel height (in relation to editor)
    flex: 5,
    minHeight: 0,
    display: 'flex',
    flexDirection: 'column',
  },
  inCell: {
    height: '350px',
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    borderBottom: 'var(--jp-border-width) solid var(--jp-border-color2)',
    fontSize: '18px',
    padding: '10px 0px 10px 0px',
  },
  headerTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: '0.5rem',
  },
});

interface QueryResultsState {
  page: number;
  rowsPerPage: number;
}

export type QueryEditorType = 'FULL_WINDOW' | 'IN_CELL';

interface QueryResultsProps {
  queryResult: QueryResult;
  queryId: QueryId;
  editorType?: QueryEditorType;
  snackbar: SnackbarState;
  openSnackbar: any;
}

class QueryResults extends Component<QueryResultsProps, QueryResultsState> {
  queryId: QueryId;
  queryManager: QueryResultsManager;

  constructor(props) {
    super(props);
    this.state = {
      page: 0,
      rowsPerPage: 10,
    };
    this.queryId = props.queryId;
    this.queryManager = new QueryResultsManager(QUERY_DATA_TYPE);
  }

  handleDatastudioExploreButton() {
    const { query, project } = this.props.queryResult;
    const config = {
      sql: query.replace(' ', '+'),
      billingProjectId: project,
      projectId: project,
      connectorType: 'BIG_QUERY',
      sqlType: 'STANDARD_SQL',
    };
    const url =
      'https://datastudio.google.com/c/u/0/linking/setupAnalysis?config=' +
      JSON.stringify(config);
    window.open(url);
  }

  handleDataFrameButton() {
    const { query, queryFlags } = this.props.queryResult;

    const ifIncell = this.props.editorType === 'IN_CELL';

    const processedFlags = {};
    let ifEmpty = true;

    for (const [k, v] of Object.entries(queryFlags)) {
      // eslint-disable-next-line no-extra-boolean-cast
      if (!!v) {
        processedFlags[k] = v;
        ifEmpty = false;
      }
    }

    let code =
      `# The following two lines are only necessary to run once.\n` +
      `# Comment out otherwise for speed-up.\n` +
      `from google.cloud.bigquery import Client, QueryJobConfig\n` +
      `client = Client()\n\n`;
    if (ifEmpty) {
      code += `query = '${query.trim()}'\n` + `job = client.query(query)\n`;
    } else {
      const flagsJson = JSON.stringify(processedFlags, null, 2);

      code +=
        `flags=${flagsJson}\n` +
        `job_config = bigquery.QueryJobConfig(**flags)\n` +
        `query = '${query.trim()}'\n` +
        `job = client.query(query, job_config=job_config)\n`;
    }
    code += `df = job.to_dataframe()`;

    if (ifIncell) {
      const notebookTrack = WidgetManager.getInstance().getNotebookTracker();
      const curWidget = notebookTrack.currentWidget;
      const notebook = curWidget.content;
      NotebookActions.insertBelow(notebook);
      const cell = notebookTrack.activeCell;
      cell.model.value.text = code;
    } else {
      copy(code);
      this.props.openSnackbar({
        message: 'Code copied',
        autoHideDuration: COPIED_AUTOHIDE_DURATION,
      });
    }
  }

  renderMessage() {
    const { duration, bytesProcessed } = this.props.queryResult;

    const readableBytes = formatBytes(bytesProcessed, 1);

    return (
      <Typography style={{ fontSize: '0.7rem' }}>
        Query complete ({duration} sec elapsed, {readableBytes} processed)
      </Typography>
    );
  }

  renderDataStudioButton() {
    return (
      <Button
        onClick={this.handleDatastudioExploreButton.bind(this)}
        style={{ textTransform: 'none', color: gColor('BLUE') }}
      >
        Explore in Data Studio
      </Button>
    );
  }

  renderDataFrameButton() {
    const ifIncell = this.props.editorType === 'IN_CELL';
    return (
      <Button
        onClick={this.handleDataFrameButton.bind(this)}
        style={{ textTransform: 'none', color: gColor('BLUE') }}
      >
        {ifIncell ? 'Query and load as DataFrame' : 'Copy code for DataFrame'}
      </Button>
    );
  }

  render() {
    const fields = this.props.queryResult.labels;
    const rows = this.queryManager.getSlot(this.queryId);

    return (
      <div
        className={
          this.props.editorType === 'IN_CELL'
            ? localStyles.inCell
            : localStyles.resultsContainer
        }
      >
        <div className={localStyles.header}>
          <div className={localStyles.headerTop}>
            Query results
            <div>
              {this.renderDataFrameButton()}
              {this.renderDataStudioButton()}
            </div>
          </div>

          {this.renderMessage()}
        </div>

        {fields.length > 0 && (
          <BQTable fields={fields} rows={rows as (string | number)[][]} />
        )}
      </div>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  const queryId = ownProps.queryId;
  const snackbar = state.snackbar;
  let queryResult = state.queryEditorTab.queries[queryId];

  if (!queryResult) {
    queryResult = {
      contentLen: 0,
      labels: [],
      bytesProcessed: null,
      queryId: queryId,
    } as QueryResult;
  }
  return { queryResult: queryResult, snackbar };
};

const mapDispatchToProps = {
  openSnackbar,
};

export default connect(mapStateToProps, mapDispatchToProps)(QueryResults);
export { QueryResults };
