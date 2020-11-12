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
import { Refresh } from '@material-ui/icons';
import { Signal } from '@phosphor/signaling';
import * as csstips from 'csstips';
import { BASE_FONT, COLORS, Message, Badge } from 'gcp_jupyterlab_shared';
import * as React from 'react';
import { stylesheet } from 'typestyle';

import { GcpService, ListAiPlatformJobsResponse } from '../service/gcp';
import { JobListItem } from './job_list_item';

interface Props {
  isVisible: boolean;
  gcpService: GcpService;
}

interface State {
  isLoading: boolean;
  jobsResponse: ListAiPlatformJobsResponse;
  projectId?: string;
  error?: string;
}

const localStyles = stylesheet({
  headerContainer: {
    borderBottom: 'var(--jp-border-width) solid var(--jp-border-color2)',
    ...csstips.horizontal,
  },
  header: {
    fontWeight: 600,
    fontSize: 'var(--jp-ui-font-size0, 11px)',
    letterSpacing: '1px',
    margin: 0,
    padding: '8px 12px',
    textTransform: 'uppercase',
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
});

const TITLE_TEXT = 'AI Platform Notebook Jobs';
const SlimIconButton = withStyles({
  root: {
    borderRadius: 0,
    padding: '4px',
  },
})(IconButton);
const RefreshIcon = withStyles({
  root: {
    fontSize: '16px',
  },
})(Refresh);

/** Panel component for displaying AI Platform jobs */
export class GcpScheduledJobsPanel extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      isLoading: false,
      jobsResponse: { jobs: [] },
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
      this._getJobs();
    }
  }

  render() {
    const { error, jobsResponse, isLoading, projectId } = this.state;
    const jobs = jobsResponse.jobs || [];
    const gcpService = this.props.gcpService;
    let content: JSX.Element;
    if (isLoading) {
      content = <LinearProgress />;
    } else if (error) {
      content = <Message text={error} asError={true} />;
    } else {
      content = (
        <ul className={localStyles.list}>
          {jobs.map(j => (
            <JobListItem
              gcpService={gcpService}
              key={j.jobId}
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
          <SlimIconButton title="Refresh Jobs" onClick={() => this._getJobs()}>
            <RefreshIcon />
          </SlimIconButton>
        </div>
        {content}
      </div>
    );
  }

  private async _getJobs() {
    try {
      this.setState({ isLoading: true, error: undefined });
      const jobsResponse = await this.props.gcpService.listNotebookJobs();
      this.setState({ isLoading: false, jobsResponse });
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
  id = 'gcpscheduledjobs';
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
