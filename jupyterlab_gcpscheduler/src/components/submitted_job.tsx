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
import { COLORS, css, LearnMoreLink } from 'gcp_jupyterlab_shared';
import * as React from 'react';
import { Button } from '@material-ui/core';
import { classes, stylesheet } from 'typestyle';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableRow from '@material-ui/core/TableRow';
import { getNextRunDate, getHumanReadableCron } from '../cron';

import {
  findOptionByValue,
  REGIONS,
  SCALE_TIERS,
  SCHEDULER_LINK,
  MASTER_TYPES,
  CUSTOM,
  ACCELERATOR_TYPES,
  CONTAINER_IMAGES,
} from '../data';
import { RunNotebookRequest } from '../interfaces';
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
  table: {
    paddingLeft: '15px',
    paddingRight: '15px',
  },
  tableHeader: {
    paddingRight: '10px !important',
  },
  message: {
    alignItems: 'center',
    fontSize: '15px',
    fontWeight: 500,
  },
  messageCaption: {
    fontSize: '12px',
    marginBottom: '20px',
    marginLeft: '37px',
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
    const container = findOptionByValue(CONTAINER_IMAGES, request.imageUri);
    const gcsInformation = this.getGcsInformation(request.inputNotebookGcsPath);
    const isRecurring = !!schedule;
    const jobLink = `${SCHEDULER_LINK}?${projectParam}`;
    return (
      <div className={css.column}>
        <div className={classes(css.row, localStyles.message)}>
          <GreenCheck />
          <span>
            {isRecurring ? 'Schedule' : 'Single run'} successfully created!
          </span>
        </div>
        <div className={classes(css.row, localStyles.messageCaption)}>
          {!isRecurring && <span>Run has been started</span>}
          {isRecurring && <span>{getNextRunDate(schedule)}</span>}
        </div>
        <TableContainer>
          <Table
            padding="none"
            aria-label="simple table"
            className={localStyles.table}
          >
            <TableBody>
              <TableRow key="notebookLink">
                <TableCell className={localStyles.tableHeader} variant="head">
                  Notebook
                </TableCell>
                <TableCell>{gcsInformation.basename}</TableCell>
              </TableRow>
              <TableRow key="region">
                <TableCell className={localStyles.tableHeader} variant="head">
                  Region
                </TableCell>
                <TableCell>{region.text}</TableCell>
              </TableRow>
              <TableRow key="scaleTier">
                <TableCell className={localStyles.tableHeader} variant="head">
                  Scale tier
                </TableCell>
                <TableCell>{scaleTier.text}</TableCell>
              </TableRow>
              {scaleTier.value === CUSTOM && (
                <React.Fragment>
                  <TableRow key="masterType">
                    <TableCell
                      className={localStyles.tableHeader}
                      variant="head"
                    >
                      Master type
                    </TableCell>
                    <TableCell>{masterType.text}</TableCell>
                  </TableRow>
                  <TableRow key="acceleratorType">
                    <TableCell
                      className={localStyles.tableHeader}
                      variant="head"
                    >
                      Accelerator type
                    </TableCell>
                    <TableCell>{acceleratorType.text}</TableCell>
                  </TableRow>
                  {request.acceleratorCount && (
                    <TableRow key="acceleratorCount">
                      <TableCell
                        className={localStyles.tableHeader}
                        variant="head"
                      >
                        Accelerator count
                      </TableCell>
                      <TableCell>{request.acceleratorCount}</TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              )}
              <TableRow key="container">
                <TableCell className={localStyles.tableHeader} variant="head">
                  Container
                </TableCell>
                <TableCell>{container.text}</TableCell>
              </TableRow>
              <TableRow key="type">
                <TableCell className={localStyles.tableHeader} variant="head">
                  Type
                </TableCell>
                <TableCell>
                  {isRecurring ? 'Schedule (scheduled runs)' : 'Single run'}
                </TableCell>
              </TableRow>
              {isRecurring && (
                <TableRow key="schedule">
                  <TableCell className={localStyles.tableHeader} variant="head">
                    Schedule
                  </TableCell>
                  <TableCell>{getHumanReadableCron(schedule)}</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <ActionBar
          closeLabel="Done"
          closeOnRight={true}
          onDialogClose={onDialogClose}
          displayMessage={
            <span>
              Check the run status in the Scheduler extension or in{' '}
              <LearnMoreLink text="Google Cloud console" href={jobLink} />
            </span>
          }
        >
          <Button onClick={onFormReset}>Submit another run</Button>
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
