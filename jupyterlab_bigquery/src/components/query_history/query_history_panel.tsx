import * as React from 'react';
import { connect } from 'react-redux';
import { Paper, Collapse, LinearProgress } from '@material-ui/core';
import { CheckCircle, Error } from '@material-ui/icons';
import { stylesheet } from 'typestyle';

import {
  QueryHistoryService,
  QueryDetailsService,
} from './service/query_history';
import { Header } from '../shared/header';
import LoadingPanel from '../loading_panel';
import { StripedRows } from '../shared/striped_rows';
import { formatBytes } from '../details_panel/table_details_panel';
import { JobsObject, JobIdsObject } from './service/query_history';

const localStyles = stylesheet({
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
    padding: '8px 10px 8px 10px',
    borderBottom: 'var(--jp-border-width) solid var(--jp-border-color2)',
    backgroundColor: 'white',
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
    width: '100px',
    color: 'gray',
  },
  openDetails: {
    marginBottom: '10px',
    padding: '12px',
  },
});

interface Props {
  queryHistoryService: QueryHistoryService;
  currentProject: string;
}

interface State {
  hasLoaded: boolean;
  isLoading: boolean;
  jobIds: JobIdsObject;
  jobs: JobsObject;
  openJob: string;
}

const QueryDetails = props => {
  const job = props.details;
  const rows = [
    { name: 'Job ID', value: `${job.project}:${job.location}.${job.id}` },
    { name: 'User', value: job.user },
    { name: 'Location', value: job.location },
    { name: 'Creation time', value: job.created },
    { name: 'Start time', value: job.started },
    { name: 'End time', value: job.ended },
    {
      name: 'Duration',
      value: job.duration ? `${job.duration.toFixed(2)} sec` : '0.0 sec',
    },
    {
      name: 'Bytes processed',
      value: job.bytesProcessed
        ? formatBytes(job.bytesProcessed, 2)
        : job.from_cache
        ? '0 B (results cached)'
        : '0 B',
    },
    { name: 'Job priority', value: job.priority },
    { name: 'Destination table', value: job.destination },
    { name: 'Use legacy SQL', value: job.useLegacySql ? 'true' : 'false' },
  ];
  return <StripedRows rows={rows} />;
};

const QueryStatus = props => {
  const failed = props.failed;
  return (
    <div
      style={{
        padding: '10px 12px 10px 12px',
        color: 'white',
        backgroundColor: failed ? '#DA4336' : '#00C752',
        marginTop: '10px',
      }}
    >
      {failed ? 'Query failed' : 'Query succeeded'}
    </div>
  );
};

class QueryHistoryPanel extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasLoaded: false,
      isLoading: false,
      jobs: {} as JobsObject,
      jobIds: {} as JobIdsObject,
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

  formatDateString(date) {
    return `${date.getMonth() + 1}/${date.getDate()}/${date
      .getFullYear()
      .toString()
      .slice(-2)}`;
  }

  displayDate(date) {
    const today = new Date();
    const todayString = this.formatDateString(today);
    const yesterday = new Date(today.setDate(today.getDate() - 1));
    const yesterdayString = this.formatDateString(yesterday);

    if (date === todayString) {
      return 'Today';
    } else if (date === yesterdayString) {
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
      return (
        <div style={{ height: '100%' }}>
          <Header text="Query history" />
          <div className={localStyles.body}>
            {Object.keys(this.state.jobIds).map(date => {
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
                  {this.state.jobIds[date].map(jobId => {
                    return (
                      <div key={jobId}>
                        <div
                          onClick={event => {
                            this.setState({
                              openJob:
                                this.state.openJob === jobId ? null : jobId,
                            });
                            this.getQueryDetails(jobId);
                          }}
                        >
                          {this.state.openJob === jobId ? (
                            <QueryStatus
                              failed={this.state.jobs[jobId].errored}
                            />
                          ) : (
                            <div className={localStyles.queryBar}>
                              <div className={localStyles.queryTime}>
                                {this.state.jobs[jobId].time}
                              </div>
                              {this.state.jobs[jobId].errored ? (
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
                              <div className={localStyles.query}>
                                {this.state.jobs[jobId].query}
                              </div>
                            </div>
                          )}
                        </div>
                        <Collapse in={this.state.openJob === jobId}>
                          {this.state.jobs[jobId].details ? (
                            <Paper square className={localStyles.openDetails}>
                              <QueryDetails
                                details={this.state.jobs[jobId].details}
                              />
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
