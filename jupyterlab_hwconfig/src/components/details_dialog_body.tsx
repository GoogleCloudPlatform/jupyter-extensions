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
import Paper from '@material-ui/core/Paper';
import { makeStyles } from '@material-ui/core/styles';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableRow from '@material-ui/core/TableRow';
import { Badge } from 'gcp_jupyterlab_shared';
import * as React from 'react';
import { DetailsResponse, MAPPED_ATTRIBUTES } from '../data/data';
import { STYLES } from '../data/styles';
import { ActionBar } from './action_bar';

const useStyles = makeStyles({
  table: {
    minWidth: 350,
  },
  container: {
    boxShadow: 'none',
    elevation: 0,
    backgroundColor: 'var(--jp-layout-color1)',
  },
  textColor: {
    color: 'var(--jp-ui-font-color1)',
  },
});

function SimpleTable(details: DetailsResponse) {
  const tableClasses = useStyles();

  return (
    <TableContainer className={tableClasses.container} component={Paper}>
      <Table className={tableClasses.table} aria-label="simple table">
        <TableBody>
          {MAPPED_ATTRIBUTES.map(am => {
            const { label, mapper } = am;
            let value = mapper(details);
            if (label.endsWith('Utilization')) {
              value = value.split(': ').pop();
            }
            return (
              <TableRow key={label}>
                <TableCell
                  className={tableClasses.textColor}
                  component="th"
                  scope="row"
                >
                  {am.label}
                </TableCell>
                <TableCell className={tableClasses.textColor} align="right">
                  {value}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

interface Props {
  details: DetailsResponse;
  receivedError: boolean;
  onDialogClose: () => void;
  onUpdate: () => void;
}

function isLoadingDetails(details: boolean, receivedError: boolean): boolean {
  return !(details || receivedError);
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function DetailsDialogBody(props: Props) {
  const { details, receivedError, onDialogClose, onUpdate } = props;
  return (
    <div>
      <header className={STYLES.dialogHeader}>
        Notebook VM Details <Badge value="Alpha" />
      </header>
      <dl className={STYLES.containerPadding}>
        {isLoadingDetails(Boolean(details), receivedError) ? (
          <div className={STYLES.containerSize}>
            <p className={STYLES.paragraph}>Retrieving GCE VM details...</p>
          </div>
        ) : receivedError ? (
          <div className={STYLES.containerSize}>
            <p className={STYLES.paragraph}>
              Unable to retrieve GCE VM details, please check your server logs
            </p>
          </div>
        ) : (
          SimpleTable(details)
        )}
        <ActionBar
          primaryLabel="Modify hardware"
          secondaryLabel="Close"
          onPrimaryClick={onUpdate}
          onSecondaryClick={onDialogClose}
          primaryDisabled={
            receivedError || isLoadingDetails(Boolean(details), receivedError)
          }
        />
      </dl>
    </div>
  );
}
