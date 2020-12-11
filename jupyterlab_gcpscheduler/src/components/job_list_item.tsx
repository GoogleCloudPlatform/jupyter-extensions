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
  IconButtonMenu,
  UnknownCircle,
  PausedCircle,
  GrayDisabled,
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
  if (state === 'SUCCEEDED' || state === 'ENABLED') {
    return <GreenCheckCircle />;
  } else if (state === 'FAILED' || state === 'UPDATE_FAILED') {
    return <RedClose />;
  } else if (state === 'PAUSED') {
    return <PausedCircle />;
  } else if (state === 'STATE_UNSPECIFIED') {
    return <UnknownCircle />;
  } else if (state === 'CANCELLED' || state === 'DISABLED') {
    return <GrayDisabled />;
  }
  return <GrayPending />;
}

function shouldShowJobMenu(state: string, isSchedule: boolean) {
  if (isSchedule) return true;
  return state === SUCCEEDED;
}

/** Notebook job list item */
export function JobListItem(props: Props) {
  const { gcpService, job } = props;
  const isSchedule = 'schedule' in job;
  return (
    <Grid className={localStyles.job} container spacing={1}>
      <Grid item xs={1}>
        {' '}
        {getIconForJobState(job.state)}
      </Grid>
      <Grid item xs={shouldShowJobMenu(job.state, isSchedule) ? 10 : 11}>
        <div className={css.bold}>
          <LearnMoreLink
            secondary={true}
            noUnderline={true}
            text={job.name}
            href={job.link}
          />
        </div>
        <div>
          {!isSchedule && (
            <div className={localStyles.jobCaption}>
              <span>
                {customShortDateFormat(new Date(job.endTime || job.createTime))}
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
                  {job.endTime
                    ? customShortDateFormat(new Date(job.endTime))
                    : 'None'}
                </span>
              </div>
            </React.Fragment>
          )}
          <div className={classes(css.bold, localStyles.spacing)}>
            <LearnMoreLink
              noUnderline={true}
              href={job.viewerLink
              }
              text={isSchedule ? 'VIEW LATEST EXECUTION RESULT' : 'VIEW RESULT'}
            />
          </div>
        </div>
      </Grid>
      {shouldShowJobMenu(job.state, isSchedule) && (
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
      )}
    </Grid>
  );
}
