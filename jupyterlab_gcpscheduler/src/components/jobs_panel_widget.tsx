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
import { BASE_FONT, COLORS, Message, Badge, RefreshIcon } from 'gcp_jupyterlab_shared';
import * as React from 'react';
import { stylesheet } from 'typestyle';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import { GcpService, ListAiPlatformJobsResponse } from '../service/gcp';
import { JobListItem } from './job_list_item';

interface Props {
  isVisible: boolean;
  gcpService: GcpService;
}

interface State {
  isLoading: boolean;
  runs: ListAiPlatformJobsResponse;
  schedules: ListAiPlatformJobsResponse;
  projectId?: string;
  error?: string;
  tab: number;
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
    minWidth: '300px',
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
  }
});

const StyledTab = withStyles({
  root: {
    textTransform: 'none',
  },
})(Tab);

const TITLE_TEXT = 'Notebook Scheduler';

/** Panel component for displaying AI Platform runs */
export class GcpScheduledJobsPanel extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      isLoading: false,
      runs: { jobs: [] },
      schedules: {jobs: []},
      tab: 0,
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
      this._getRunsAndSchedules();
    }
  }

  render() {
    const handleChange = (event: React.ChangeEvent<{}>, newValue: number) => {
      this.setState({ tab: newValue });
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
          {runs.jobs.map(j => (
            <JobListItem
              gcpService={gcpService}
              key={j.jobId}
              job={j}
              schedule={false}
              projectId={projectId}
            />
          ))}
        </ul>
      );
      schedulesContent = (
        <ul className={localStyles.list}>
          {schedules.jobs.map(j => (
            <JobListItem
              gcpService={gcpService}
              key={j.jobId}
              job={j}
              schedule={true}
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
          <IconButton title="Refresh Jobs" onClick={() => this._getRunsAndSchedules()}>
            <RefreshIcon />
          </IconButton>
        </div>
        <Tabs
          value={this.state.tab}
          indicatorColor="primary"
          onChange={handleChange}
        >
          <StyledTab label="Runs" />
          <StyledTab label="Schedules" />
        </Tabs>
        <div className={localStyles.tab} role="tabpanel" hidden={this.state.tab !== 0}>
          {runsContent}
        </div>
        <div className={localStyles.tab} role="tabpanel" hidden={this.state.tab !== 1}>
          {schedulesContent}
        </div>
      </div>
    );
  }

  private async _getRunsAndSchedules() {
    try {
      this.setState({ isLoading: true, error: undefined });
      const runs = await this.props.gcpService.listNotebookJobs();
      // const schedules = await this.props.gcpService.listSchedules();
      this.setState({ isLoading: false, runs, schedules: runs});
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
