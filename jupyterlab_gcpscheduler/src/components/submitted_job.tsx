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
import { COLORS, FONT_SIZE, css, LearnMoreLink } from 'gcp_jupyterlab_shared';
import * as React from 'react';
import { Button } from '@material-ui/core';
import { classes, stylesheet } from 'typestyle';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableRow from '@material-ui/core/TableRow';
import { getNextExecutionDate, getHumanReadableCron } from '../cron';

import {
  findOptionByValue,
  REGIONS,
  SCALE_TIERS,
  SCHEDULES_LINK,
  EXECUTIONS_LINK,
  MASTER_TYPES,
  CUSTOM,
  ACCELERATOR_TYPES,
  ENVIRONMENT_IMAGES,
} from '../data';
import { ExecuteNotebookRequest } from '../interfaces';
import { OnDialogClose } from './dialog';
import { ActionBar } from './action_bar';

interface Props {
  onFormReset: () => void;
  onDialogClose: OnDialogClose;
  request: ExecuteNotebookRequest;
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
    fontSize: FONT_SIZE.heading,
    fontWeight: 500,
  },
  messageCaption: {
    fontSize: FONT_SIZE.text,
    paddingTop: '4px',
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

const CustomTableCell = withStyles({
  root: {
    fontSize: FONT_SIZE.text,
  },
})(TableCell);

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
    const environment = findOptionByValue(ENVIRONMENT_IMAGES, request.imageUri);
    const gcsInformation = this.getGcsInformation(request.inputNotebookGcsPath);
    const isRecurring = !!schedule;
    const jobLink = isRecurring
      ? `${SCHEDULES_LINK}?${projectParam}`
      : `${EXECUTIONS_LINK}?${projectParam}`;
    return (
      <div className={css.column}>
        <div className={classes(css.row, localStyles.message)}>
          <GreenCheck />
          <span>
            {isRecurring ? 'Schedule' : 'Execution'} successfully created!
          </span>
        </div>
        <div className={classes(css.row, localStyles.messageCaption)}>
          {!isRecurring && <span>Execution has been started</span>}
          {isRecurring && <span>{getNextExecutionDate(schedule)}</span>}
        </div>
        <TableContainer>
          <Table
            padding="none"
            aria-label="simple table"
            className={localStyles.table}
          >
            <TableBody>
              <TableRow key="notebookLink">
                <CustomTableCell
                  className={localStyles.tableHeader}
                  variant="head"
                >
                  Notebook
                </CustomTableCell>
                <CustomTableCell>{gcsInformation.basename}</CustomTableCell>
              </TableRow>
              <TableRow key="region">
                <CustomTableCell
                  className={localStyles.tableHeader}
                  variant="head"
                >
                  Region
                </CustomTableCell>
                <CustomTableCell>{region.text}</CustomTableCell>
              </TableRow>
              <TableRow key="scaleTier">
                <CustomTableCell
                  className={localStyles.tableHeader}
                  variant="head"
                >
                  Scale tier
                </CustomTableCell>
                <CustomTableCell>{scaleTier.text}</CustomTableCell>
              </TableRow>
              {scaleTier.value === CUSTOM && (
                <React.Fragment>
                  <TableRow key="masterType">
                    <CustomTableCell
                      className={localStyles.tableHeader}
                      variant="head"
                    >
                      Master type
                    </CustomTableCell>
                    <CustomTableCell>{masterType.text}</CustomTableCell>
                  </TableRow>
                  <TableRow key="acceleratorType">
                    <CustomTableCell
                      className={localStyles.tableHeader}
                      variant="head"
                    >
                      Accelerator type
                    </CustomTableCell>
                    <CustomTableCell>{acceleratorType.text}</CustomTableCell>
                  </TableRow>
                  {request.acceleratorCount && (
                    <TableRow key="acceleratorCount">
                      <CustomTableCell
                        className={localStyles.tableHeader}
                        variant="head"
                      >
                        Accelerator count
                      </CustomTableCell>
                      <CustomTableCell>
                        {request.acceleratorCount}
                      </CustomTableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              )}
              <TableRow key="environment">
                <CustomTableCell
                  className={localStyles.tableHeader}
                  variant="head"
                >
                  Environment
                </CustomTableCell>
                <CustomTableCell>
                  {environment ? environment.text : 'Custom container'}
                </CustomTableCell>
              </TableRow>
              {!environment && (
                <TableRow key="customContainerImageUri">
                  <CustomTableCell
                    className={localStyles.tableHeader}
                    variant="head"
                  >
                    Container image
                  </CustomTableCell>
                  <CustomTableCell>{request.imageUri}</CustomTableCell>
                </TableRow>
              )}
              <TableRow key="type">
                <CustomTableCell
                  className={localStyles.tableHeader}
                  variant="head"
                >
                  Type
                </CustomTableCell>
                <CustomTableCell>
                  {isRecurring
                    ? 'Schedule (recurring executions)'
                    : 'Execution'}
                </CustomTableCell>
              </TableRow>
              {isRecurring && (
                <TableRow key="schedule">
                  <CustomTableCell
                    className={localStyles.tableHeader}
                    variant="head"
                  >
                    Schedule
                  </CustomTableCell>
                  <CustomTableCell>
                    {getHumanReadableCron(schedule)}
                  </CustomTableCell>
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
              View the {isRecurring ? 'schedule' : 'execution'} in the Executor
              extension or in{' '}
              <LearnMoreLink text="Google Cloud console" href={jobLink} />
            </span>
          }
        >
          <Button onClick={onFormReset}>
            {isRecurring
              ? 'Create another schedule'
              : 'Create another execution'}
          </Button>
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
