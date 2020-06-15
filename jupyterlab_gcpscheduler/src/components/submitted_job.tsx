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
import { CheckCircle } from '@material-ui/icons';
import { COLORS, css, LearnMoreLink } from 'gcp-jupyterlab-shared';
import * as React from 'react';
import { classes, stylesheet } from 'typestyle';

import {
  findOptionByValue,
  REGIONS,
  SCALE_TIERS,
  GCS_LINK,
  SCHEDULER_LINK,
    MASTER_TYPES,
  CUSTOM,
  ACCELERATOR_TYPES,
} from '../data';
import { RunNotebookRequest } from '../service/gcp';
import { OnDialogClose } from './dialog';
import { ActionBar } from './action_bar';

interface Props {
  onFormReset: () => void;
  onDialogClose: OnDialogClose;
  request: RunNotebookRequest;
  projectId: string;
  schedule?: string;
}

interface GcsInformation {
  basename: string;
  link: string;
}

const localStyles = stylesheet({
  dl: {
    fontSize: '13px',
    $nest: {
      '& > div': {
        marginBottom: '8px',
      },
      '& dt': {
        display: 'inline',
        fontWeight: 500,
      },
      '& dd': {
        display: 'inline',
        marginLeft: '4px',
      },
    },
  },
  message: {
    alignItems: 'center',
    fontSize: '15px',
    fontWeight: 500,
  },
});

const GreenCheck = withStyles({
  root: {
    color: COLORS.green,
    fontSize: '28px',
    marginRight: '8px',
  },
})(CheckCircle);

export class SubmittedJob extends React.Component<Props, {}> {
  render() {
    const {
      onDialogClose,
      onFormReset,
      request,
      projectId,
      schedule,
    } = this.props;
    const projectParam = `project=${projectId}`;
    const region = findOptionByValue(REGIONS, request.region);
    const scaleTier = findOptionByValue(SCALE_TIERS, request.scaleTier);
    const masterType = findOptionByValue(MASTER_TYPES, request.masterType);
    const acceleratorType = findOptionByValue(
      ACCELERATOR_TYPES,
      request.acceleratorType
    );
    const gcsInformation = this.getGcsInformation(request.inputNotebookGcsPath);
    const gcsLink = `${GCS_LINK}/${gcsInformation.link}?${projectParam}`;
    const isRecurring = !!schedule;
    const jobLink = `${SCHEDULER_LINK}?${projectParam}`;
    return (
      <div className={css.column}>
        <div className={classes(css.row, localStyles.message)}>
          <GreenCheck />
          <span>Notebook run successfully scheduled!</span>
        </div>
        <dl className={localStyles.dl}>
          <div>
            <dt>Notebook:</dt>
            <dd>
              <LearnMoreLink text={gcsInformation.basename} href={gcsLink} />
            </dd>
          </div>
          <div>
            <dt>Run name:</dt>
            <dd>{request.jobId}</dd>
          </div>
          <div>
            <dt>Region:</dt>
            <dd>{region.text}</dd>
          </div>
          <div>
            <dt>Scale tier:</dt>
            <dd>
              {scaleTier.value} - {scaleTier.text}
            </dd>
          </div>
                    {scaleTier.value === CUSTOM && (
            <React.Fragment>
              <div>
                <dt>Master type:</dt>
                <dd>{masterType.text}</dd>
              </div>
              <div>
                <dt>Accelerator type:</dt>
                <dd>{acceleratorType.text}</dd>
              </div>
              <div>
                <dt>Accelerator count:</dt>
                <dd>{request.acceleratorCount}</dd>
              </div>
            </React.Fragment>
          )}
          <div>
            <dt>Container:</dt>
            <dd>{request.imageUri}</dd>
          </div>
          <div>
            <dt>Type:</dt>
            <dd>{isRecurring ? 'Recurring run' : 'Single run'}</dd>
          </div>
          {isRecurring && (
            <div>
              <dt>Schedule:</dt>
              <dd>{schedule}</dd>
            </div>
          )}
          <div>
            <dt>Job:</dt>
            <dd>
              <LearnMoreLink text="View in Cloud Console" href={jobLink} />
            </dd>
          </div>
        </dl>
        <ActionBar closeLabel="Done" onDialogClose={onDialogClose}>
          <button className={css.button} type="button" onClick={onFormReset}>
            Submit another job
          </button>
        </ActionBar>
      </div>
    );
  }

  // Strips off the gs:// prefix and returns everything up to the file name
  private getGcsInformation(notebookPath: string): GcsInformation {
    const sliceEnd = notebookPath.lastIndexOf('/');
    return {
      basename: notebookPath.slice(sliceEnd + 1),
      link: notebookPath.slice('gs://'.length, sliceEnd),
    };
  }
}
