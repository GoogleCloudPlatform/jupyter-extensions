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
import { Execution, Schedule } from '../interfaces';
import { GcpService } from '../service/gcp';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import IconButton from '@material-ui/core/IconButton';
import { Grid } from '@material-ui/core';

interface Props {
  job: Execution | Schedule;
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
    this.handleClick = this.handleClick.bind(this);
    this.handleClose = this.handleClose.bind(this);
  }

  handleClick(event: React.MouseEvent<HTMLButtonElement>) {
    this.setState({ anchorEl: event.currentTarget });
  }

  handleClose() {
    this.setState({ anchorEl: null });
  }

  render() {
    const { gcpService, job } = this.props;
    const schedule = 'schedule' in job;
    const endTime = new Date(job.endTime || job.createTime);
    return (
      <Grid className={localStyles.job} container spacing={1}>
        <Grid item xs={1}>
          {' '}
          {getIconForJobState(job.state)}
        </Grid>
        <Grid item xs={job.state === SUCCEEDED ? 10 : 11}>
          <div className={css.bold}>
            <LearnMoreLink
              secondary={true}
              noUnderline={true}
              text={job.name}
              href={job.link}
            />
          </div>
          <div>
            {!schedule && (
              <div className={localStyles.jobCaption}>
                <span>{customShortDateFormat(endTime)}</span>
              </div>
            )}
            {schedule && (
              <React.Fragment>
                <div className={localStyles.jobCaption}>
                  <span>
                    Frequency:{' '}
                    {getHumanReadableCron((job as Schedule).schedule)}
                  </span>
                </div>
                <div className={localStyles.jobCaption}>
                  <span>
                    Latest execution: {customShortDateFormat(endTime)}
                  </span>
                </div>
              </React.Fragment>
            )}
            <div className={classes(css.bold, localStyles.spacing)}>
              <LearnMoreLink
                noUnderline={true}
                href={job.viewerLink}
                text={schedule ? 'VIEW LATEST EXECUTION RESULT' : 'VIEW RESULT'}
              />
            </div>
          </div>
        </Grid>
        {job.state === SUCCEEDED && (
          <Grid item xs={1}>
            {''}
            <IconButton
              className={localStyles.align}
              onClick={this.handleClick}
            >
              <MenuIcon />
            </IconButton>
            <Menu
              id="execution-menu"
              anchorEl={this.state.anchorEl}
              keepMounted
              open={Boolean(this.state.anchorEl)}
              onClose={this.handleClose}
            >
              {!schedule && (
                <MenuItem key="shareNotebook" dense={true}>
                  <ShareDialog
                    cloudBucket={(job as Execution).bucketLink}
                    shareLink={job.viewerLink}
                    handleClose={this.handleClose}
                  />
                </MenuItem>
              )}
              <MenuItem
                id="open"
                key="openNotebook"
                dense={true}
                onClick={() => gcpService.importNotebook(job.gcsFile)}
              >
                Open source notebook
              </MenuItem>
              <MenuItem
                key="downloadSourceNotebook"
                dense={true}
                onClick={this.handleClose}
              >
                <a
                  className={localStyles.menuLink}
                  href={job.downloadLink}
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
