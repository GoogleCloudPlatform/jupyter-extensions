import * as React from 'react';
import { connect } from 'react-redux';
import {
  Paper,
  Collapse,
  LinearProgress,
  IconButton,
  withStyles,
} from '@material-ui/core';
import { stylesheet } from 'typestyle';
import { DateTime } from 'luxon';
import { Refresh } from '@material-ui/icons';

import {
  QueryHistoryService,
  QueryDetailsService,
} from './service/query_history';
import { QueryDetails } from './query_details';
import { QueryBar } from './query_bar';
import { QueryStatusBar } from './query_status_bar';
import { Header } from '../shared/header';
import LoadingPanel from '../loading_panel';
import { QueryHistory } from './service/query_history';
import { TablePaginationActions, StyledPagination } from '../shared/bq_table';
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
    backgroundColor: 'var(--jp-layout-color2)',
  },
  refreshIcon: {
    color: 'var(--jp-ui-font-color1)',
  },
  dateGroup: {
    marginBottom: '12px',
  },
  openDetails: {
    marginBottom: '10px',
    padding: '14px',
  },
});

const HeadingPaper = withStyles({
  root: {
    fontSize: '18px',
    padding: '10px 0px 10px 10px',
    backgroundColor: 'var(--jp-layout-color0)',
    color: 'var(--jp-ui-font-color1)',
  },
})(Paper);

const StyledPaper = withStyles({
  root: {
    fontSize: '13px',
    padding: '10px 0px 10px 10px',
    backgroundColor: 'var(--jp-layout-color0)',
    color: 'var(--jp-ui-font-color1)',
  },
})(Paper);

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
          <Header>
            Query history
            <IconButton
              onClick={this.handleRefreshHistory.bind(this)}
              size="small"
            >
              <Refresh className={localStyles.refreshIcon} />
            </IconButton>
          </Header>
          <div className={localStyles.body}>
            {Object.keys(queriesByDate).map(date => {
              return (
                <div
                  className={localStyles.dateGroup}
                  key={`query_history_date_${date}`}
                >
                  <HeadingPaper variant="outlined" square>
                    {this.displayDate(date)}
                  </HeadingPaper>
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
                            <QueryStatusBar failed={jobs[jobId].errored} />
                          ) : (
                            <QueryBar jobId={jobId} jobs={jobs} />
                          )}
                        </div>
                        <Collapse in={openJob === jobId}>
                          {jobs[jobId].details ? (
                            <StyledPaper
                              square
                              className={localStyles.openDetails}
                            >
                              <QueryDetails job={jobs[jobId]} />
                            </StyledPaper>
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
          <StyledPagination
            rowsPerPageOptions={[10, 30, 50, 100, 200]}
            count={jobIds.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onChangePage={this.handleChangePage.bind(this)}
            onChangeRowsPerPage={this.handleChangeRowsPerPage.bind(this)}
            ActionsComponent={TablePaginationActions}
            labelRowsPerPage="Queries per page:"
            component="div"
          />
        </div>
      );
    } else {
      return (
        <div className={localStyles.queryHistoryRoot}>
          <Header>Query history</Header> <LoadingPanel />
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
