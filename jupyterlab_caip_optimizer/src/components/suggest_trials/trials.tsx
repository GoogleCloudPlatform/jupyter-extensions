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

import * as React from 'react';
import { useDispatch } from 'react-redux';
import AddIcon from '@material-ui/icons/Add';
import DeleteIcon from '@material-ui/icons/Delete';
import { tableIcons } from '../../utils/table_icons';
import MaterialTable, { MTableBodyRow } from 'material-table';
import { Trial, StudyConfig } from '../../types';
import { prettifyTrial } from '../../service/optimizer';
import {
  trialToData,
  parametersToColumns,
  metricToColumn,
  trialStateValue,
} from './utils';
import { deleteTrial } from '../../store/studies';

interface Props {
  studyName: string;
  studyConfig: StudyConfig;
  trials: Trial[];
  openTrial: (trial: string) => void;
}

export const Trials: React.FC<Props> = ({
  studyName,
  studyConfig,
  trials = [],
  openTrial,
}) => {
  const dispatch = useDispatch();
  const trialData = trials.map(trialToData);
  const parameterSpecColumns = React.useMemo(
    () => parametersToColumns(studyConfig.parameters),
    [studyConfig.parameters]
  );
  const metricSpecColumns = React.useMemo(
    () => studyConfig.metrics.map(metricToColumn),
    [studyConfig.metrics]
  );

  return (
    <MaterialTable
      title="Trials"
      icons={tableIcons}
      columns={[
        {
          title: 'Name',
          field: 'name',
          render: rowData => prettifyTrial(rowData.name),
        },
        {
          title: 'State',
          field: 'state',
          defaultSort: 'desc',
          customSort: (a, b) =>
            trialStateValue(a.state) - trialStateValue(b.state),
        },
        {
          title: 'Infeasible',
          field: 'trialInfeasible',
          type: 'boolean',
        },
        ...parameterSpecColumns,
        ...metricSpecColumns,
      ]}
      data={trialData}
      actions={[
        rowData => {
          if (!Array.isArray(rowData)) {
            return {
              icon: () => (
                <div
                  data-testid="addMeasurement"
                  onClick={() => openTrial(rowData.name)}
                >
                  <AddIcon />
                </div>
              ),
              // Don't use material-table onClick. It does not work well with react-testing-library
              // eslint-disable-next-line @typescript-eslint/no-empty-function
              onClick: () => {},
              disabled: rowData.state !== 'ACTIVE',
            };
          }
        },
        rowData => ({
          icon: () => (
            <div
              data-testid="deleteTrial"
              onClick={() =>
                dispatch(deleteTrial({ trialName: rowData.name, studyName }))
              }
            >
              <DeleteIcon />
            </div>
          ),
          // eslint-disable-next-line @typescript-eslint/no-empty-function
          onClick: () => {},
        }),
      ]}
      options={{
        actionsColumnIndex: -1,
      }}
      style={{ fontFamily: 'Roboto, sans-serif' }}
      components={{
        Row: props => <MTableBodyRow {...props} data-testid="trialRow" />,
      }}
    />
  );
};
