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
import { GcpService, Runs, Schedules } from '../service/gcp';
import { JobListItem } from './job_list_item';
import TablePagination from '@material-ui/core/TablePagination';
const DEFAULT_PAGE_SIZE = 10;

interface Props {
  isVisible: boolean;
  gcpService: GcpService;
}

interface State {
  isLoading: boolean;
  runs: Runs;
  schedules: Schedules;
  projectId?: string;
  error?: string;
  tab: number;
  page: number;
  rowsPerPage: number;
}

const localStyles = stylesheet({
  headerContainer: {
    borderBottom: 'var(--jp-border-width) solid var(--jp-border-color2)',
    ...csstips.horizontal,
  },
  header: {
    fontWeight: 500,
    fontSize: 'var(--jp-ui-font-size2, 11px)',
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
    ...csstips.flex,
  },
  tab: {
    overflowY: 'scroll',
  },
  pagination: {
    fontSize: '12px',
    borderTop: '2px solid #eeeeee',
  },
});

const StyledTab = withStyles({
  root: {
    textTransform: 'none',
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

const TITLE_TEXT = 'Notebook Scheduler';

/** Panel component for displaying AI Platform runs */
export class GcpScheduledJobsPanel extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      isLoading: false,
      runs: { runs: [], pageToken: '' },
      schedules: { schedules: [], pageToken: '' },
      tab: 0,
      page: 0,
      rowsPerPage: DEFAULT_PAGE_SIZE,
    };
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
      !(prevProps.isVisible || this.state.isLoading)
    ) {
      this._getRunsAndSchedules(this.state.rowsPerPage);
    }
  }

  render() {
    const handleChangeTab = (
      event: React.ChangeEvent<{}>,
      newValue: number
    ) => {
      this._getRunsAndSchedules(this.state.rowsPerPage);
      this.setState({ tab: newValue, page: 0 });
    };
    const handleChangePage = (
      event: React.MouseEvent<HTMLButtonElement> | null,
      newPage: number
    ) => {
      this._getRunsAndSchedules(
        this.state.rowsPerPage,
        this.state.tab === 0
          ? this.state.runs.pageToken
          : this.state.schedules.pageToken
      );
      this.setState({ page: newPage });
    };

    const handleChangeRowsPerPage = (
      event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
      const newRowsPerPage = parseInt(event.target.value, DEFAULT_PAGE_SIZE);
      this._getRunsAndSchedules(newRowsPerPage);
      this.setState({ rowsPerPage: newRowsPerPage, page: 0 });
    };

    const labelDisplayRowsMesssage = ({ from, to, count }) => {
      return `${from}-${to} of ${count !== -1 ? String(count) : 'many'}`;
    };

    const { error, runs, schedules, isLoading, projectId } = this.state;
    const gcpService = this.props.gcpService;
    let runsContent: JSX.Element;
    let schedulesContent: JSX.Element;
    if (isLoading) {
      runsContent = <LinearProgress />;
      schedulesContent = <LinearProgress />;
    } else if (error) {
      runsContent = <Message text={error} asError={true} />;
      schedulesContent = <Message text={error} asError={true} />;
    } else {
      runsContent = (
        <ul className={localStyles.list}>
          {runs.runs.map(j => (
            <JobListItem
              gcpService={gcpService}
              key={j.id}
              job={j}
              projectId={projectId}
            />
          ))}
        </ul>
      );
      schedulesContent = (
        <ul className={localStyles.list}>
          {schedules.schedules.map(j => (
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
          <IconButton
            title="Refresh Jobs"
            onClick={() => this._getRunsAndSchedules(this.state.rowsPerPage)}
          >
            <RefreshIcon />
          </IconButton>
        </div>
        <Tabs
          value={this.state.tab}
          indicatorColor="primary"
          variant="fullWidth"
          onChange={handleChangeTab}
        >
          <StyledTab label="Runs" />
          <StyledTab label="Schedules" />
        </Tabs>
        <div
          className={localStyles.tab}
          role="tabpanel"
          hidden={this.state.tab !== 0}
        >
          {runsContent}
        </div>
        <div
          className={localStyles.tab}
          role="tabpanel"
          hidden={this.state.tab !== 1}
        >
          {schedulesContent}
        </div>
        <footer className={localStyles.pagination}>
          <StyledTablePagination
            count={-1}
            page={this.state.page}
            onChangePage={handleChangePage}
            rowsPerPage={this.state.rowsPerPage}
            onChangeRowsPerPage={handleChangeRowsPerPage}
            labelDisplayedRows={labelDisplayRowsMesssage}
            labelRowsPerPage="Items per page:"
            SelectProps={{variant:"outlined",}}
          />
        </footer>
      </div>
    );
  }

  private async _getRunsAndSchedules(pageSize: number, pageToken?: string) {
    try {
      this.setState({ isLoading: true, error: undefined });
      if (!pageToken) {
        const runs = await this.props.gcpService.listRuns(pageSize);
        const schedules = await this.props.gcpService.listSchedules(pageSize);
        this.setState({
          isLoading: false,
          runs,
          schedules,
        });
      } else if (pageToken && this.state.tab === 0) {
        const runs = await this.props.gcpService.listRuns(pageSize, pageToken!);
        this.setState({ isLoading: false, runs });
        this.setState({ isLoading: false, runs });
      } else if (pageToken && this.state.tab === 1) {
        const schedules = await this.props.gcpService.listSchedules(
          pageSize,
          pageToken!
        );
        this.setState({ isLoading: false, schedules });
      }
    } catch (err) {
      this.setState({
        isLoading: false,
        error: `${err}: Unable to retrieve Jobs`,
      });
    }
  }
}

/** Widget to be registered in the left-side panel. */
export class GcpScheduledJobsWidget extends ReactWidget {
  id = 'gcpscheduledruns';
  private visibleSignal = new Signal<GcpScheduledJobsWidget, boolean>(this);

  constructor(private readonly gcpService: GcpService) {
    super();
    this.title.iconClass = 'jp-Icon jp-Icon-20 jp-ScheduledJobsIcon';
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
