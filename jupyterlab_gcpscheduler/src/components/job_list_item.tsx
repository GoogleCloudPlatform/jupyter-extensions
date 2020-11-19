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
import {
  css,
  LearnMoreLink,
  GrayPending,
  GreenCheckCircle,
  RedClose,
  MenuIcon,
} from 'gcp_jupyterlab_shared';
import * as React from 'react';
import { classes, stylesheet } from 'typestyle';
import { customShortDateFormat, getHumanReadableCron } from '../cron';
import { ShareDialog } from './share_dialog';
import { AI_PLATFORM_LINK } from '../data';
import { AiPlatformJob, GcpService } from '../service/gcp';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import IconButton from '@material-ui/core/IconButton';
import { Grid } from '@material-ui/core';

// Description-key used to identify Cloud Scheduler jobs for Notebook Runs
const SCHEDULED_NOTEBOOK_JOB = 'jupyterlab_scheduled_notebook';
// const IMMEDIATE_NOTEBOOK_JOB = 'jupyterlab_immediate_notebook';
const JOB_TYPE = 'job_type';
// const SCHEDULER_JOB_NAME = 'scheduler_job_name';

interface Props {
  job: AiPlatformJob;
  schedule: boolean;
  projectId: string;
  gcpService: GcpService;
}

interface State {
  anchorEl: null | HTMLElement;
}

const localStyles = stylesheet({
  menuLink: {
    display: 'block',
    height: '100%',
    width: '100%',
  },
  job: {
    paddingTop: '15px',
    paddingBottom: '15px',
    paddingRight: '20px',
    paddingLeft: '15px',
    width: '100%',
    borderBottom: 'var(--jp-border-width) solid var(--jp-border-color2)',
  },
  jobCaption: {
    fontSize: '12px',
    paddingTop: '5px',
    color: 'var(--jp-content-font-color2)',
  },
  align: {
    marginTop: '-15px !important',
  },
  spacing: {
    marginTop: '5px',
  },
});

const VIEWER_LINK_BASE = 'https://notebooks.cloud.google.com/view';
const DOWNLOAD_LINK_BASE = 'https://storage.cloud.google.com';
const SUCCEEDED = 'SUCCEEDED';

function getIconForJobState(state: string): JSX.Element {
  if (state === 'SUCCEEDED') {
    return <GreenCheckCircle />;
  } else if (state === 'FAILED') {
    return <RedClose />;
  }
  return <GrayPending />;
}

/** Notebook job list item */
export class JobListItem extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { anchorEl: null };
  }

  render() {
    const { gcpService, job, projectId, schedule } = this.props;
    const endTime = new Date(job.endTime || job.createTime);

    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
      this.setState({ anchorEl: event.currentTarget });
    };

    const handleClose = () => {
      this.setState({ anchorEl: null });
    };

    const gcsFile =
      job.trainingInput &&
      job.trainingInput.args &&
      job.trainingInput.args[4].slice(5);

    /*
    Extract the bucket and jobName from the GCS URI. The actual AI Platform job
    ID may have an additional timestamp if it was submitted as a recurring run
  */
    const [bucket, jobName, ...object] = gcsFile.split('/');
    const name = jobName.replace('_', ' ');
    const encodedObjectPath = [jobName, ...object]
      .map(p => encodeURIComponent(p))
      .join('/');
    const jobLink = `${AI_PLATFORM_LINK}/${job.jobId}?project=${projectId}`;
    const viewerLink = `${VIEWER_LINK_BASE}/${bucket}/${encodedObjectPath}`;
    const downloadLink = `${DOWNLOAD_LINK_BASE}/${gcsFile}`;
    const jobType =
      job['labels'] && job['labels'][JOB_TYPE] === SCHEDULED_NOTEBOOK_JOB
        ? 'Scheduled run'
        : 'Single run';
    const cronSchedule = '* * * * *';
    return (
      <Grid className={localStyles.job} container spacing={0}>
        <Grid item xs={1}>
          {' '}
          {getIconForJobState(job.state)}
        </Grid>
        <Grid item xs={job.state === SUCCEEDED ? 10 : 11}>
          <div className={css.bold}>
            <LearnMoreLink
              secondary={true}
              noUnderline={true}
              text={name}
              href={jobLink}
            />
          </div>
          <div>
            {!schedule && (
              <div className={localStyles.jobCaption}>
                <span>
                  {customShortDateFormat(endTime)} - {jobType}
                </span>
              </div>
            )}
            {schedule && (
              <React.Fragment>
                <div className={localStyles.jobCaption}>
                  <span>Frequency: {getHumanReadableCron(cronSchedule)}</span>
                </div>
                <div className={localStyles.jobCaption}>
                  <span>Latest run: {customShortDateFormat(endTime)}</span>
                </div>
              </React.Fragment>
            )}
            <div className={classes(css.bold, localStyles.spacing)}>
              <LearnMoreLink
                noUnderline={true}
                href={viewerLink}
                text={schedule? "VIEW LATEST RUN RESULT": "VIEW RESULT"}
              />
            </div>
          </div>
        </Grid>
        {job.state === SUCCEEDED && (
          <Grid item xs={1}>
            {''}
            <IconButton className={localStyles.align} onClick={handleClick}>
              <MenuIcon />
            </IconButton>
            <Menu
              id="run-menu"
              anchorEl={this.state.anchorEl}
              keepMounted
              open={Boolean(this.state.anchorEl)}
              onClose={handleClose}
            >
              {!schedule && (
                <MenuItem key="shareNotebook" dense={true}>
                  <ShareDialog
                    learnMoreLink=""
                    cloudBucket=""
                    shareLink={viewerLink}
                  />
                </MenuItem>
              )}
              <MenuItem
                id="open"
                key="openNotebook"
                dense={true}
                onClick={() => gcpService.importNotebook(gcsFile)}
              >
                Open source notebook
              </MenuItem>
              <MenuItem
                key="downloadSourceNotebook"
                dense={true}
                onClick={handleClose}
              >
                <a
                  className={localStyles.menuLink}
                  href={downloadLink}
                  target="_blank"
                  title="Download the notebook output from Google Cloud Storage"
                >
                  Download source notebook
                </a>
              </MenuItem>
            </Menu>{' '}
          </Grid>
        )}
      </Grid>
    );
  }
}
