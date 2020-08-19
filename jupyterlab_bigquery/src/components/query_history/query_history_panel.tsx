import * as React from 'react';
import { connect } from 'react-redux';
import { Paper, Collapse, LinearProgress, Icon } from '@material-ui/core';
import { CheckCircle, Error } from '@material-ui/icons';
import { stylesheet } from 'typestyle';
import { DateTime } from 'luxon';

import {
  QueryHistoryService,
  QueryDetailsService,
} from './service/query_history';
import { Header } from '../shared/header';
import LoadingPanel from '../loading_panel';
import { StripedRows } from '../shared/striped_rows';
import ReadOnlyEditor from '../shared/read_only_editor';
import { JobsObject, Job } from './service/query_history';
import { QueryEditorTabWidget } from '../query_editor/query_editor_tab/query_editor_tab_widget';
import { WidgetManager } from '../../utils/widgetManager/widget_manager';
import { generateQueryId } from '../../reducers/queryEditorTabSlice';
import { formatTime, formatDate, formatBytes } from '../../utils/formatters';
import { BASE_FONT } from 'gcp_jupyterlab_shared';

const localStyles = stylesheet({
  queryHistoryRoot: {
    height: '100%',
    ...BASE_FONT,
  },
  body: {
    height: '100%',
    overflowY: 'auto',
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
});

interface Props {
  queryHistoryService: QueryHistoryService;
  currentProject: string;
}

interface State {
  hasLoaded: boolean;
  isLoading: boolean;
  jobIds: string[];
  jobs: JobsObject;
  openJob: string;
}

const ErrorBox = (props: { errorMsg: string }) => {
  return (
    <Paper
      style={{
        display: 'flex',
        alignItems: 'stretch',
        marginBottom: '12px',
      }}
      elevation={1}
      variant="outlined"
    >
      <div style={{ width: '6px', backgroundColor: '#e60000' }} />
      <div style={{ padding: '8px', display: 'flex', alignItems: 'center' }}>
        <Error
          fontSize="default"
          htmlColor="rgb(230, 0, 0)"
          className={localStyles.icon}
        />
        {props.errorMsg}
      </div>
    </Paper>
  );
};

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

      {errored && <ErrorBox errorMsg={details.errorResult.message} />}

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
  constructor(props: Props) {
    super(props);
    this.state = {
      hasLoaded: false,
      isLoading: false,
      jobs: {} as JobsObject,
      jobIds: [],
      openJob: null,
    };
  }

  componentDidMount() {
    this.getHistory();
  }

  handleExpandJob = async jobId => {
    await this.getQueryDetails(jobId);
  };

  getQueryDetails = async jobId => {
    if (!this.state.jobs[jobId].details) {
      try {
        const service = new QueryDetailsService();
        await service.getQueryDetails(jobId).then(queryDetails => {
          const updatedJobs = { ...this.state.jobs };
          updatedJobs[jobId]['details'] = queryDetails.job;
          this.setState({ jobs: updatedJobs });
        });
      } catch (err) {
        console.warn(
          `Error retrieving query details for query ID ${jobId}`,
          err
        );
      }
    }
  };

  processHistory = (jobIds, jobs) => {
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
  };

  private async getHistory() {
    try {
      this.setState({ isLoading: true });
      await this.props.queryHistoryService
        .getQueryHistory(this.props.currentProject)
        .then(queryHistory => {
          const jobIds = queryHistory.jobIds;
          const jobs = queryHistory.jobs;
          this.setState({ hasLoaded: true, jobIds: jobIds, jobs: jobs });
        });
    } catch (err) {
      console.warn('Error retrieving query history', err);
    } finally {
      this.setState({ isLoading: false });
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

  render() {
    if (this.state.isLoading) {
      return (
        <>
          <Header text="Query history" /> <LoadingPanel />
        </>
      );
    } else {
      const { jobs, jobIds, openJob } = this.state;
      const queriesByDate = this.processHistory(jobIds, jobs);

      return (
        <div className={localStyles.queryHistoryRoot}>
          <Header text="Query history" />
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
                          onClick={() => {
                            this.setState({
                              openJob: openJob === jobId ? null : jobId,
                            });
                            this.getQueryDetails(jobId);
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
        </div>
      );
    }
  }
}

const mapStateToProps = state => {
  const currentProject = state.dataTree.data.projectIds[0];
  return { currentProject };
};

export default connect(mapStateToProps, {})(QueryHistoryPanel);
