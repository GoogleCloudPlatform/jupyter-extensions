/**
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { ReactWidget, UseSignal } from '@jupyterlab/apputils';
import { IconButton, LinearProgress, withStyles } from '@material-ui/core';
import { Signal } from '@phosphor/signaling';
import * as csstips from 'csstips';
import {
  BASE_FONT,
  COLORS,
  Message,
  Badge,
  RefreshIcon,
} from 'gcp_jupyterlab_shared';
import * as React from 'react';
import { stylesheet } from 'typestyle';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import { Executions, Schedules, Execution, Schedule } from '../interfaces';
import { GcpService } from '../service/gcp';
import { JobListItem } from './job_list_item';
import TablePagination from '@material-ui/core/TablePagination';
const DEFAULT_PAGE_SIZE = 10;

interface Props {
  isVisible: boolean;
  gcpService: GcpService;
}

interface State {
  executionsTab: {
    isLoading: boolean;
    visibleRows: Execution[];
    response: Executions;
    error?: string;
  };
  schedulesTab: {
    isLoading: boolean;
    visibleRows: Schedule[];
    response: Schedules;
    error?: string;
  };
  error?: string;
  projectId?: string;
  tab: number;
  page: number;
  rowsPerPage: number;
}

const localStyles = stylesheet({
  headerContainer: {
    ...csstips.horizontal,
    padding: '16px',
  },
  header: {
    fontWeight: 500,
    fontSize: '16px',
    margin: 0,
    padding: '8px 12px',
    ...csstips.flex,
  },
  panel: {
    backgroundColor: COLORS.white,
    color: COLORS.base,
    height: '100%',
    ...BASE_FONT,
    ...csstips.vertical,
  },
  list: {
    margin: 0,
    overflowY: 'scroll',
    padding: 0,
    height: '100%',
    overflowX: 'hidden',
    ...csstips.flex,
  },
  tab: {
    overflow: 'hidden',
    height: '100%',
  },
  pagination: {
    fontSize: '12px',
    borderTop: '2px solid #eeeeee',
  },
});

const StyledTabs = withStyles({
  indicator: {
    backgroundColor: 'rgba(0,0,0,0)',
  },
})(Tabs);

const StyledTab = withStyles({
  root: {
    textTransform: 'none',
    borderBottom: 'var(--jp-border-width) solid var(--jp-border-color2)',
    fontSize: '14px',
  },
  selected: {
    borderBottom: '2px solid ' + COLORS.focus,
  },
})(Tab);

const StyledTablePagination = withStyles({
  root: {
    fontSize: '12px',
  },
  input: {
    fontSize: '12px !important',
  },
  caption: {
    fontSize: '12px',
  },
  selectRoot: {
    marginRight: '8px',
  },
  actions: {
    marginLeft: '0px',
  },
})(TablePagination);

const TITLE_TEXT = 'Notebook Executor';

/** Panel component for displaying AI Platform executions */
export class GcpScheduledJobsPanel extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      executionsTab: {
        isLoading: false,
        visibleRows: [],
        response: { executions: [], pageToken: '' },
      },
      schedulesTab: {
        isLoading: false,
        visibleRows: [],
        response: { schedules: [], pageToken: '' },
      },
      tab: 0,
      page: 0,
      rowsPerPage: DEFAULT_PAGE_SIZE,
    };
    this.handleChangeTab = this.handleChangeTab.bind(this);
    this.handleChangePage = this.handleChangePage.bind(this);
    this.handleChangeRowsPerPage = this.handleChangeRowsPerPage.bind(this);
    this.handleRefresh = this.handleRefresh.bind(this);
    this.labelDisplayRowsMesssage = this.labelDisplayRowsMesssage.bind(this);
  }

  async componentDidMount() {
    try {
      const projectId = await this.props.gcpService.projectId;
      this.setState({ projectId });
    } catch (err) {
      this.setState({ error: `${err}: Unable to determine GCP project` });
    }
  }

  componentDidUpdate(prevProps: Props) {
    if (
      this.props.isVisible &&
      !(
        prevProps.isVisible ||
        (this.state.tab === 0 && this.state.executionsTab.isLoading) ||
        (this.state.tab === 1 && this.state.schedulesTab.isLoading)
      )
    ) {
      this._getExecutionsOrSchedules(this.state.tab, this.state.rowsPerPage);
      this.setState({ page: 0 });
    }
  }

  handleChangeTab(event: React.ChangeEvent<{}>, newValue: number) {
    this._getExecutionsOrSchedules(newValue, this.state.rowsPerPage);
    this.setState({ tab: newValue, page: 0 });
  }

  handleChangePage(
    event: React.MouseEvent<HTMLButtonElement> | null,
    newPage: number
  ) {
    if (newPage > this.state.page) {
      if (!this.enableNextPage()) return;
      if (this.pageHasBeenSeen(newPage)) {
        this._setVisibleRows(newPage);
      } else {
        this._getExecutionsOrSchedules(
          this.state.tab,
          this.state.rowsPerPage,
          true
        );
      }
    } else {
      this._setVisibleRows(newPage);
    }
    this.setState({ page: newPage });
  }

  handleChangeRowsPerPage(
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    const newRowsPerPage = parseInt(event.target.value, DEFAULT_PAGE_SIZE);
    this._getExecutionsOrSchedules(this.state.tab, newRowsPerPage);
    this.setState({ rowsPerPage: newRowsPerPage, page: 0 });
  }

  handleRefresh() {
    this._getExecutionsOrSchedules(this.state.tab, this.state.rowsPerPage);
  }

  labelDisplayRowsMesssage({ from, to, count }) {
    let totalCount: string | number = 'many';
    if (this.state.tab === 0 && !this.state.executionsTab.response.pageToken) {
      totalCount = this.state.executionsTab.response.executions.length;
    } else if (
      this.state.tab === 1 &&
      !this.state.schedulesTab.response.pageToken
    ) {
      totalCount = this.state.schedulesTab.response.schedules.length;
    }
    if (totalCount === 0) return '0 of 0';
    return `${from}-${
      totalCount !== 'many' ? Math.min(to, totalCount as number) : to
    } of ${count !== -1 ? String(count) : totalCount}`;
  }

  render() {
    const { error, executionsTab, schedulesTab, projectId } = this.state;
    const gcpService = this.props.gcpService;
    let executionsContent: JSX.Element;
    let schedulesContent: JSX.Element;
    if (executionsTab.isLoading) {
      executionsContent = <LinearProgress />;
    } else if (executionsTab.error || error) {
      executionsContent = (
        <Message text={executionsTab.error || error} asError={true} />
      );
    } else {
      executionsContent = (
        <ul className={localStyles.list}>
          {executionsTab.visibleRows.map(j => (
            <JobListItem
              gcpService={gcpService}
              key={j.id}
              job={j}
              projectId={projectId}
            />
          ))}
        </ul>
      );
    }
    if (schedulesTab.isLoading) {
      schedulesContent = <LinearProgress />;
    } else if (schedulesTab.error || error) {
      schedulesContent = (
        <Message text={schedulesTab.error || error} asError={true} />
      );
    } else {
      schedulesContent = (
        <ul className={localStyles.list}>
          {schedulesTab.visibleRows.map(j => (
            <JobListItem
              gcpService={gcpService}
              key={j.id}
              job={j}
              projectId={projectId}
            />
          ))}
        </ul>
      );
    }
    return (
      <div className={localStyles.panel}>
        <div className={localStyles.headerContainer}>
          <header className={localStyles.header}>
            {TITLE_TEXT} <Badge value="alpha" />
          </header>
          <IconButton title="Refresh" onClick={this.handleRefresh}>
            <RefreshIcon />
          </IconButton>
        </div>
        <StyledTabs
          value={this.state.tab}
          indicatorColor="primary"
          variant="fullWidth"
          onChange={this.handleChangeTab}
        >
          <StyledTab label="Executions" />
          <StyledTab label="Schedules" />
        </StyledTabs>
        <div
          className={localStyles.tab}
          role="tabpanel"
          hidden={this.state.tab !== 0}
        >
          {executionsContent}
        </div>
        <div
          className={localStyles.tab}
          role="tabpanel"
          hidden={this.state.tab !== 1}
        >
          {schedulesContent}
        </div>
        {this.shouldShowFooter() && (
          <footer className={localStyles.pagination}>
            <StyledTablePagination
              count={-1}
              page={this.state.page}
              onChangePage={this.handleChangePage}
              rowsPerPage={this.state.rowsPerPage}
              onChangeRowsPerPage={this.handleChangeRowsPerPage}
              labelDisplayedRows={this.labelDisplayRowsMesssage}
              labelRowsPerPage="Items per page:"
              SelectProps={{ variant: 'outlined' }}
              nextIconButtonProps={{ disabled: !this.enableNextPage() }}
            />
          </footer>
        )}
      </div>
    );
  }

  private pageHasBeenSeen(newPage: number) {
    let rowCount = 0;
    if (this.state.tab === 0) {
      rowCount = this.state.executionsTab.response.executions.length;
    } else {
      rowCount = this.state.schedulesTab.response.schedules.length;
    }
    return rowCount > newPage * this.state.rowsPerPage;
  }

  private enableNextPage() {
    return (
      (this.state.tab === 0 && this.state.executionsTab.response.pageToken) ||
      (this.state.tab === 1 && this.state.schedulesTab.response.pageToken) ||
      this.pageHasBeenSeen(this.state.page + 1)
    );
  }

  private shouldShowFooter() {
    if (
      this.state.tab === 0 &&
      (this.state.executionsTab.error || this.state.error)
    ) {
      return false;
    }
    if (
      this.state.tab === 1 &&
      (this.state.schedulesTab.error || this.state.error)
    ) {
      return false;
    }
    return true;
  }

  private _getExecutionsOrSchedules(
    tab: number,
    pageSize: number,
    getPageToken = false
  ) {
    let pageToken = undefined;
    if (getPageToken) {
      pageToken =
        this.state.tab === 0
          ? this.state.executionsTab.response.pageToken
          : this.state.schedulesTab.response.pageToken;
    }
    if (tab === 0) {
      this._getExecutions(pageSize, pageToken);
    } else {
      this._getSchedules(pageSize, pageToken);
    }
  }

  private async _getSchedules(pageSize: number, pageToken?: string) {
    const emptyResponse = { schedules: [], pageToken: undefined };
    try {
      this.setState({
        schedulesTab: {
          ...this.state.schedulesTab,
          visibleRows: [],
          isLoading: true,
          error: undefined,
        },
      });
      const schedules = await this.props.gcpService.listSchedules(
        pageSize,
        pageToken
      );
      const prevSchedules = pageToken
        ? this.state.schedulesTab.response.schedules
        : [];
      prevSchedules.push(...schedules.schedules);
      const visibleRows = [...schedules.schedules];
      schedules.schedules = prevSchedules;
      this.setState({
        schedulesTab: {
          visibleRows,
          isLoading: false,
          response: schedules,
        },
      });
    } catch (err) {
      this.setState({
        schedulesTab: {
          isLoading: false,
          visibleRows: [],
          error: `${err}: Unable to retrieve schedules`,
          response: emptyResponse,
        },
      });
    }
  }

  private async _getExecutions(pageSize: number, pageToken?: string) {
    const emptyResponse = { executions: [], pageToken: undefined };
    try {
      this.setState({
        executionsTab: {
          ...this.state.executionsTab,
          visibleRows: [],
          isLoading: true,
          error: undefined,
        },
      });
      const executions = await this.props.gcpService.listExecutions(
        '',
        pageSize,
        pageToken
      );
      const prevExecutions = pageToken
        ? this.state.executionsTab.response.executions
        : [];
      prevExecutions.push(...executions.executions);
      const visibleRows = [...executions.executions];
      executions.executions = prevExecutions;
      this.setState({
        executionsTab: {
          visibleRows,
          isLoading: false,
          response: executions,
        },
      });
    } catch (err) {
      this.setState({
        executionsTab: {
          isLoading: false,
          visibleRows: [],
          error: `${err}: Unable to retrieve executions`,
          response: emptyResponse,
        },
      });
    }
  }

  private _setVisibleRows(newPage: number) {
    if (this.state.tab === 0) {
      this.setState({
        executionsTab: {
          ...this.state.executionsTab,
          visibleRows: this.state.executionsTab.response.executions.slice(
            newPage * this.state.rowsPerPage,
            Math.min(
              (newPage + 1) * this.state.rowsPerPage,
              this.state.executionsTab.response.executions.length
            )
          ),
        },
      });
    } else {
      this.setState({
        schedulesTab: {
          ...this.state.schedulesTab,
          visibleRows: this.state.schedulesTab.response.schedules.slice(
            newPage * this.state.rowsPerPage,
            Math.min(
              (newPage + 1) * this.state.rowsPerPage,
              this.state.schedulesTab.response.schedules.length
            )
          ),
        },
      });
    }
  }
}

/** Widget to be registered in the left-side panel. */
export class GcpScheduledJobsWidget extends ReactWidget {
  id = 'gcpscheduledexecutions';
  private visibleSignal = new Signal<GcpScheduledJobsWidget, boolean>(this);

  constructor(private readonly gcpService: GcpService) {
    super();
    this.title.iconClass = 'jp-Icon jp-Icon-20 jp-SchedulerIcon';
    this.title.caption = TITLE_TEXT;
  }

  onAfterHide() {
    this.visibleSignal.emit(false);
  }

  onAfterShow() {
    this.visibleSignal.emit(true);
  }

  render() {
    return (
      <UseSignal signal={this.visibleSignal}>
        {(_, isVisible) => (
          <GcpScheduledJobsPanel
            isVisible={isVisible}
            gcpService={this.gcpService}
          />
        )}
      </UseSignal>
    );
  }
}
