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

import { withStyles } from '@material-ui/core';
import { MoreVert } from '@material-ui/icons';
import * as csstips from 'csstips';
import {
  css,
  IconButtonMenu,
  SmallMenuItem,
  GrayPending,
  GreenCheck,
  RedClose,
} from 'gcp-jupyterlab-extensions-shared';
import * as React from 'react';
import { classes, stylesheet } from 'typestyle';

import { AI_PLATFORM_LINK } from '../data';
import { AiPlatformJob } from '../service/gcp';

interface Props {
  job: AiPlatformJob;
  projectId: string;
}

const localStyles = stylesheet({
  item: {
    alignItems: 'center',
    borderBottom: 'var(--jp-border-width) solid var(--jp-border-color2)',
    listStyle: 'none',
    height: '40px',
    paddingRight: '8px',
    $nest: {
      '&:hover': {
        backgroundColor: 'var(--jp-layout-color2)',
      },
    },
    ...csstips.horizontal,
  },
  details: {
    paddingLeft: '4px',
    ...csstips.flex,
  },
  jobLink: {
    textDecoration: 'none',
  },
  jobTime: {
    color: 'var(--jp-content-font-color2)',
    fontSize: '9px',
    textAlign: 'right',
    ...csstips.flex,
  },
  menuLink: {
    display: 'block',
    height: '100%',
    width: '100%',
  },
});

const MenuIcon = withStyles({
  root: {
    fontSize: '20px',
  },
})(MoreVert);

const VIEWER_LINK_BASE = 'https://notebooks.cloud.google.com/view';
const DOWNLOAD_LINK_BASE = 'https://storage.cloud.google.com';
const SUCCEEDED = 'SUCCEEDED';

function getIconForJobState(state: string): JSX.Element {
  if (state === 'SUCCEEDED') {
    return <GreenCheck />;
  } else if (state === 'FAILED') {
    return <RedClose />;
  }
  return <GrayPending />;
}

/** Notebook job list item */
export function JobListItem(props: Props) {
  const { job, projectId } = props;
  const endTime = new Date(job.endTime || job.createTime);

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
  return (
    <li className={localStyles.item}>
      <div title={`Status: ${job.state}`}>{getIconForJobState(job.state)}</div>
      <div className={localStyles.details}>
        <div>
          <a
            className={classes(css.link, localStyles.jobLink)}
            href={jobLink}
            target="_blank"
            title="View AI Platform Job"
          >
            {name}
          </a>
        </div>
        <div>
          <span className={localStyles.jobTime}>
            {endTime.toLocaleString()}
          </span>
        </div>
      </div>
      <div>
        {job.state === SUCCEEDED && (
          <IconButtonMenu
            icon={<MenuIcon />}
            menuItems={menuCloseHandler => [
              <SmallMenuItem key="viewNotebook">
                <a
                  className={localStyles.menuLink}
                  href={viewerLink}
                  target="_blank"
                  title="View notebook output in HTML format"
                  onClick={menuCloseHandler}
                >
                  View
                </a>
              </SmallMenuItem>,
              <SmallMenuItem key="getNotebookPath" onClick={menuCloseHandler}>
                <a
                  className={localStyles.menuLink}
                  href={downloadLink}
                  target="_blank"
                  title="Download the notebook output from Google Cloud Storage"
                  onClick={menuCloseHandler}
                >
                  Download
                </a>
              </SmallMenuItem>,
            ]}
          />
        )}
      </div>
    </li>
  );
}
