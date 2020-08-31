import * as React from 'react';
import { connect } from 'react-redux';
import {
  Paper,
  Collapse,
  LinearProgress,
  Icon,
  TablePagination,
  IconButton,
} from '@material-ui/core';
import { CheckCircle, Error } from '@material-ui/icons';
import { stylesheet } from 'typestyle';
import { DateTime } from 'luxon';
import { Refresh } from '@material-ui/icons';

import {
  QueryHistoryService,
  QueryDetailsService,
} from './service/query_history';
import { Header } from '../shared/header';
import LoadingPanel from '../loading_panel';
import { StripedRows } from '../shared/striped_rows';
import ReadOnlyEditor from '../shared/read_only_editor';
import { JobsObject, Job, QueryHistory } from './service/query_history';
import { QueryEditorTabWidget } from '../query_editor/query_editor_tab/query_editor_tab_widget';
import { WidgetManager } from '../../utils/widgetManager/widget_manager';
import { generateQueryId } from '../../reducers/queryEditorTabSlice';
import { formatTime, formatDate, formatBytes } from '../../utils/formatters';
import { TablePaginationActions } from '../shared/bq_table';
import InfoCard from '../shared/info_card';
import { BASE_FONT } from 'gcp_jupyterlab_shared';

const localStyles = stylesheet({
  queryHistoryRoot: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    ...BASE_FONT,
  },
  body: {
    flex: 1,
    minHeight: 0,
    overflowY: 'auto',
    overflowX: 'hidden',
    backgroundColor: '#FAFAFA',
  },
  query: {
    flex: 1,
    minWidth: 0,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  queryBar: {
    display: 'flex',
    overflow: 'hidden',
    padding: '0px 10px 0px 10px',
    borderBottom: 'var(--jp-border-width) solid var(--jp-border-color2)',
    backgroundColor: 'white',
    alignItems: 'center',
    '&:hover': {
      cursor: 'pointer',
    },
  },
  queryStatusBarFailed: {
    padding: '10px 12px 10px 12px',
    color: 'white',
    backgroundColor: '#DA4336',
    marginTop: '10px',
    '&:hover': {
      cursor: 'pointer',
    },
  },
  queryStatusBarSucceeded: {
    padding: '10px 12px 10px 12px',
    color: 'white',
    backgroundColor: '#00C752',
    marginTop: '10px',
    '&:hover': {
      cursor: 'pointer',
    },
  },
  icon: {
    marginRight: '12px',
  },
  dateGroup: {
    marginBottom: '12px',
  },
  dateHeading: {
    fontSize: '18px',
    marginLeft: '10px',
    padding: '10px 0px 10px 0px',
  },
  queryTime: {
    width: '85px',
    color: 'gray',
  },
  openDetails: {
    marginBottom: '10px',
    padding: '14px',
  },
  openQueryButton: {
    display: 'flex',
    alignItems: 'center',
    border: 'var(--jp-border-width) solid var(--jp-border-color2)',
    backgroundColor: 'white',
    '&:hover': {
      boxShadow: '1px 1px 3px 0px rgba(0,0,0,0.5)',
      cursor: 'pointer',
    },
  },
  openQueryButtonSmall: {
    border: 'var(--jp-border-width) solid white',
    backgroundColor: 'white',
    '&:hover': {
      border: 'var(--jp-border-width) solid var(--jp-border-color2)',
      cursor: 'pointer',
    },
  },
  detailsTopArea: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '14px',
  },
  pagination: {
    backgroundColor: 'white',
    fontSize: '13px',
    borderTop: 'var(--jp-border-width) solid var(--jp-border-color2)',
  },
  paginationOptions: {
    display: 'flex',
    fontSize: '13px',
  },
});

interface Props {
  queryHistoryService: QueryHistoryService;
  currentProject: string;
}

interface State {
  openJob: string;
  hasLoaded: boolean;
  detailLoaded: boolean;
  page: number;
  rowsPerPage: number;
  lastFetchTime: number;
}

const QueryDetails = (props: { job: Job }) => {
  const { details, created, errored, query } = props.job;
  const rows = [
    {
      name: 'Job ID',
      value: `${details.project}:${details.location}.${details.id}`,
    },
    { name: 'User', value: details.user },
    { name: 'Location', value: details.location },
    { name: 'Creation time', value: formatDate(details.created) },
    { name: 'Start time', value: formatDate(details.started) },
    { name: 'End time', value: formatDate(details.ended) },
    {
      name: 'Duration',
      value: details.duration
        ? `${details.duration.toFixed(1)} sec`
        : '0.0 sec',
    },
    {
      name: 'Bytes processed',
      value: details.bytesProcessed
        ? formatBytes(details.bytesProcessed, 2)
        : details.from_cache
        ? '0 B (results cached)'
        : '0 B',
    },
    { name: 'Job priority', value: details.priority },
    { name: 'Destination table', value: details.destination },
    { name: 'Use legacy SQL', value: details.useLegacySql ? 'true' : 'false' },
  ];
  return (
    <div>
      <div className={localStyles.detailsTopArea}>
        <div>
          {!errored && `Query completed in ${details.duration.toFixed(3)} sec`}
          <div className={localStyles.queryTime}>{formatTime(created)}</div>
        </div>
        <button
          className={localStyles.openQueryButton}
          onClick={() => {
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
          <Icon
            style={{
              display: 'flex',
              alignContent: 'center',
            }}
            color="primary"
          >
            <div className={'jp-Icon jp-Icon-20 jp-OpenEditorIcon'} />
          </Icon>
          Open query in editor
        </button>
      </div>

      {errored && (
        <InfoCard
          color="#DA4336"
          message={details.errorResult.message}
          icon={<Error />}
        />
      )}

      <div style={{ marginBottom: '12px' }}>
        <ReadOnlyEditor query={query} />
      </div>

      <StripedRows rows={rows} />
    </div>
  );
};

// clickable bar when query details are not open
const QueryBar = (props: { jobs: JobsObject; jobId: string }) => {
  const { jobs, jobId } = props;
  return (
    <div className={localStyles.queryBar}>
      <div className={localStyles.queryTime}>
        {formatTime(jobs[jobId].created)}
      </div>
      {jobs[jobId].errored ? (
        <Error
          fontSize="inherit"
          htmlColor="rgb(230, 0, 0)"
          className={localStyles.icon}
        />
      ) : (
        <CheckCircle
          fontSize="inherit"
          htmlColor="rgb(0, 199, 82)"
          className={localStyles.icon}
        />
      )}
      <div className={localStyles.query}>{jobs[jobId].query}</div>
      <button
        className={localStyles.openQueryButtonSmall}
        onClick={() => {
          const queryId = generateQueryId();
          WidgetManager.getInstance().launchWidget(
            QueryEditorTabWidget,
            'main',
            queryId,
            undefined,
            [queryId, jobs[jobId].query]
          );
        }}
      >
        <Icon
          style={{
            display: 'flex',
            alignContent: 'center',
          }}
        >
          <div className={'jp-Icon jp-Icon-20 jp-OpenEditorIcon'} />
        </Icon>
      </button>
    </div>
  );
};

// clickable bar when query details are open
const QueryStatus = props => {
  const failed = props.failed;
  if (failed) {
    return <div className={localStyles.queryStatusBarFailed}>Query failed</div>;
  } else {
    return (
      <div className={localStyles.queryStatusBarSucceeded}>Query succeeded</div>
    );
  }
};

class QueryHistoryPanel extends React.Component<Props, State> {
  private static queryHistory: QueryHistory | undefined = undefined;

  constructor(props: Props) {
    super(props);
    this.state = {
      openJob: null,
      hasLoaded: QueryHistoryPanel.queryHistory !== undefined,
      detailLoaded: false,
      page: 0,
      rowsPerPage: 30,
      lastFetchTime: 0,
    };
  }

  async componentDidMount() {
    if (this.state.hasLoaded === false) {
      await this.getHistory();
      this.setState({ hasLoaded: true });
    }
  }

  async getQueryDetails(jobId) {
    if (!QueryHistoryPanel.queryHistory.jobs[jobId].details) {
      try {
        const service = new QueryDetailsService();
        await service.getQueryDetails(jobId).then(queryDetails => {
          QueryHistoryPanel.queryHistory.jobs[jobId].details = queryDetails.job;
        });
      } catch (err) {
        console.warn(
          `Error retrieving query details for query ID ${jobId}`,
          err
        );
      }
    }
  }

  processHistory(jobIds, jobs) {
    const queriesByDate = {};
    jobIds.map(jobId => {
      const date = DateTime.fromISO(jobs[jobId].created);
      const day = date.toLocaleString(DateTime.DATE_SHORT);
      if (day in queriesByDate) {
        queriesByDate[day].push(jobId);
      } else {
        queriesByDate[day] = [jobId];
      }
    });
    return queriesByDate;
  }

  private async getHistory() {
    try {
      await this.props.queryHistoryService
        .getQueryHistory(this.props.currentProject)
        .then(queryHistory => {
          const { jobIds, jobs, lastFetchTime } = queryHistory;
          QueryHistoryPanel.queryHistory = {
            jobIds: jobIds,
            jobs: jobs,
            lastFetchTime: lastFetchTime,
          };
        });
    } catch (err) {
      console.warn('Error retrieving query history', err);
    }
  }

  displayDate(date) {
    const today = DateTime.local().toLocaleString(DateTime.DATE_SHORT);
    const yesterday = DateTime.local()
      .minus({ days: 1 })
      .toLocaleString(DateTime.DATE_SHORT);
    if (date === today) {
      return 'Today';
    } else if (date === yesterday) {
      return 'Yesterday';
    } else {
      return date;
    }
  }

  handleChangePage(event, newPage) {
    this.setState({ page: newPage });
  }

  handleChangeRowsPerPage(event) {
    this.setState({
      rowsPerPage: parseInt(event.target.value, 10),
    });
    this.setState({ page: 0 });
  }

  async handleRefreshHistory() {
    try {
      await this.props.queryHistoryService
        .getQueryHistory(
          this.props.currentProject,
          QueryHistoryPanel.queryHistory.lastFetchTime
        )
        .then(queryHistory => {
          const { jobIds, jobs, lastFetchTime } = queryHistory;
          QueryHistoryPanel.queryHistory.jobs = Object.assign(
            QueryHistoryPanel.queryHistory.jobs,
            jobs
          );

          // pre-pend since query ids are ordered by time, ascending
          QueryHistoryPanel.queryHistory.jobIds = jobIds.concat(
            QueryHistoryPanel.queryHistory.jobIds
          );
          QueryHistoryPanel.queryHistory.lastFetchTime = lastFetchTime;

          this.setState({ lastFetchTime });
        });
    } catch (err) {
      console.warn('Error retrieving query history', err);
    }
  }

  render() {
    const { hasLoaded, rowsPerPage, page, openJob } = this.state;

    if (hasLoaded) {
      const { jobIds, jobs } = QueryHistoryPanel.queryHistory;

      const queriesByDate = this.processHistory(
        jobIds.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
        jobs
      );

      return (
        <div className={localStyles.queryHistoryRoot}>
          <div>
            <Header>
              Query history
              <IconButton onClick={this.handleRefreshHistory.bind(this)}>
                <Refresh fontSize={'small'} />
              </IconButton>
            </Header>
          </div>
          <div className={localStyles.body}>
            {Object.keys(queriesByDate).map(date => {
              return (
                <div
                  className={localStyles.dateGroup}
                  key={`query_history_date_${date}`}
                >
                  <Paper variant="outlined" square>
                    <div className={localStyles.dateHeading}>
                      {this.displayDate(date)}
                    </div>
                  </Paper>
                  {queriesByDate[date].map(jobId => {
                    return (
                      <div key={`query_details_${jobId}`}>
                        <div
                          onClick={async () => {
                            const shouldOpen = openJob !== jobId;

                            this.setState({
                              openJob: openJob === jobId ? null : jobId,
                            });

                            if (shouldOpen) {
                              this.setState({
                                detailLoaded: false,
                              });
                              await this.getQueryDetails(jobId);
                              this.setState({
                                detailLoaded: true,
                              });
                            }
                          }}
                        >
                          {openJob === jobId ? (
                            <QueryStatus failed={jobs[jobId].errored} />
                          ) : (
                            <QueryBar jobId={jobId} jobs={jobs} />
                          )}
                        </div>
                        <Collapse in={openJob === jobId}>
                          {jobs[jobId].details ? (
                            <Paper square className={localStyles.openDetails}>
                              <QueryDetails job={jobs[jobId]} />
                            </Paper>
                          ) : (
                            <LinearProgress />
                          )}
                        </Collapse>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
          <TablePagination
            className={localStyles.pagination}
            rowsPerPageOptions={[10, 30, 50, 100, 200]}
            component="div"
            count={jobIds.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onChangePage={this.handleChangePage.bind(this)}
            onChangeRowsPerPage={this.handleChangeRowsPerPage.bind(this)}
            ActionsComponent={TablePaginationActions}
            labelRowsPerPage="Queries per page:"
          />
        </div>
      );
    } else {
      return (
        <>
          <Header>Query history</Header> <LoadingPanel />
        </>
      );
    }
  }
}

const mapStateToProps = state => {
  const currentProject = state.dataTree.data.projectIds[0];
  return { currentProject };
};

export default connect(mapStateToProps, {})(QueryHistoryPanel);
