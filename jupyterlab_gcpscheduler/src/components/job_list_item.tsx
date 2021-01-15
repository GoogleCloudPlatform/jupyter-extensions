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
  GreenCheckCircle,
  RedClose,
  MenuIcon,
  IconButtonMenu,
  UnknownCircle,
  PausedCircle,
  GrayDisabled,
  SmallLaunchIcon,
} from 'gcp_jupyterlab_shared';
import * as React from 'react';
import { classes, stylesheet } from 'typestyle';
import { customShortDateFormat, getHumanReadableCron } from '../cron';
import { ShareDialog } from './share_dialog';
import { Execution, Schedule } from '../interfaces';
import { GcpService } from '../service/gcp';
import MenuItem from '@material-ui/core/MenuItem';
import { Grid } from '@material-ui/core';

interface Props {
  job: Execution | Schedule;
  projectId: string;
  gcpService: GcpService;
}

const localStyles = stylesheet({
  menuLink: {
    display: 'block',
    height: '100%',
    width: '100%',
  },
  job: {
    paddingTop: '16px',
    paddingBottom: '16px',
    paddingRight: '20px',
    paddingLeft: '20px',
    width: '100%',
    borderBottom: 'var(--jp-border-width) solid var(--jp-border-color2)',
  },
  jobName: {
    width: '100%',
    maxWidth: '100%',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    display: 'inline-block',
    textOverflow: 'ellipsis',
    fontSize: '15px',
    fontWeight: 500,
  },
  jobCaption: {
    fontSize: '12px',
    paddingTop: '4px',
    color: 'var(--jp-content-font-color2)',
  },
  align: {
    marginTop: '-12px !important',
  },
  topAlign: {
    marginTop: '4px',
  },
  spacing: {
    marginTop: '5px',
  },
});

function getIconForJobState(state: string): JSX.Element {
  if (state === 'SUCCEEDED' || state === 'ENABLED') {
    return <GreenCheckCircle />;
  } else if (state === 'FAILED' || state === 'UPDATE_FAILED') {
    return <RedClose />;
  } else if (state === 'PAUSED') {
    return <PausedCircle />;
  } else if (state === 'CANCELLED' || state === 'DISABLED') {
    return <GrayDisabled />;
  }
  return <UnknownCircle />;
}

/** Notebook job list item */
export function JobListItem(props: Props) {
  const { gcpService, job } = props;
  const isSchedule = 'schedule' in job;
  return (
    <Grid className={localStyles.job} container spacing={1}>
      <Grid item xs={1}>
        <div className={localStyles.topAlign}>
          {getIconForJobState(job.state)}
        </div>
      </Grid>
      <Grid item xs={10}>
        <div>
          <span className={localStyles.jobName}>
            <a href={job.link}>
              {job.name} <SmallLaunchIcon />
            </a>
          </span>
        </div>
        <div>
          {!isSchedule && (
            <div className={localStyles.jobCaption}>
              <span>
                {customShortDateFormat(
                  new Date(job.updateTime || job.createTime)
                )}
              </span>
            </div>
          )}
          {isSchedule && (
            <React.Fragment>
              <div className={localStyles.jobCaption}>
                <span>
                  Frequency: {getHumanReadableCron((job as Schedule).schedule)}
                </span>
              </div>
              <div className={localStyles.jobCaption}>
                <span>
                  Latest execution:{' '}
                  {(job as Schedule).hasExecutions
                    ? customShortDateFormat(new Date(job.updateTime))
                    : 'None'}
                </span>
              </div>
            </React.Fragment>
          )}
          <div className={classes(css.bold, localStyles.spacing)}>
            <LearnMoreLink
              noUnderline={true}
              href={job.viewerLink}
              text={isSchedule ? 'VIEW LATEST EXECUTION RESULT' : 'VIEW RESULT'}
              disabled={isSchedule && !(job as Schedule).hasExecutions}
            />
          </div>
        </div>
      </Grid>
      <Grid item xs={1}>
        <div className={localStyles.align}>
          <IconButtonMenu
            icon={<MenuIcon />}
            menuItems={menuCloseHandler => [
              !isSchedule ? (
                <MenuItem key="shareNotebook" dense={true}>
                  <ShareDialog
                    cloudBucket={(job as Execution).bucketLink}
                    shareLink={job.viewerLink}
                    handleClose={menuCloseHandler}
                  />
                </MenuItem>
              ) : null,
              <MenuItem
                id="open"
                key="openNotebook"
                dense={true}
                onClick={() => {
                  gcpService.importNotebook(job.gcsFile);
                  menuCloseHandler();
                }}
              >
                Open source notebook
              </MenuItem>,
              <MenuItem
                key="downloadSourceNotebook"
                dense={true}
                onClick={menuCloseHandler}
              >
                <a
                  className={localStyles.menuLink}
                  href={job.downloadLink}
                  target="_blank"
                  title="Download the notebook output from Google Cloud Storage"
                >
                  Download source notebook
                </a>
              </MenuItem>,
            ]}
          ></IconButtonMenu>
        </div>
      </Grid>
    </Grid>
  );
}
