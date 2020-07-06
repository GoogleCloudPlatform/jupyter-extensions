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
import { ReactWidget } from '@jupyterlab/apputils';
import { Provider, connect } from 'react-redux';
import {
  Box,
  Button,
  Table,
  TableHead,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Typography,
  CircularProgress,
} from '@material-ui/core';
import { RootState, AppDispatch } from '../store/store';
import { Study } from '../types';
import { setView } from '../store/view';
import { Store } from 'redux';
import { prettifyStudyName } from '../service/optimizer';

const mapStateToProps = (state: RootState) => ({
  loading: state.studies.loading,
  error: state.studies.error,
  studies: state.studies.data,
});

const mapDispatchToProps = (dispatch: AppDispatch) => ({
  openDashboard: () => dispatch(setView({ view: 'dashboard' })),
  openStudy: (studyName: string) =>
    dispatch(setView({ view: 'studyDetails', studyId: studyName })),
});

interface SidebarProps {
  error?: string;
  loading: boolean;
  studies?: Study[];
  openDashboard: () => void;
  openStudy: (studyName: string) => void;
}

export const Sidebar = ({
  studies,
  error,
  loading,
  openDashboard,
  openStudy,
}: SidebarProps) => {
  return (
    <Box
      height={1}
      width={1}
      bgcolor="white"
      borderRadius={0}
      display="flex"
      flexDirection="column"
    >
      <Box display="flex">
        <Box mx="auto">
          <Typography variant="h4" gutterBottom>
            Optimizer
          </Typography>

          <Button color="primary" onClick={() => openDashboard()}>
            Main Dashboard
          </Button>
        </Box>
      </Box>

      {!!error && <Typography color="error">{error}</Typography>}
      {loading && <CircularProgress />}
      {!!studies && studies.length > 0 && (
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Studies</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {studies.map(study => (
                <TableRow
                  key={study.name}
                  onClick={() => openStudy(study.name)}
                >
                  <TableCell>{prettifyStudyName(study.name)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};

const WrappedSidebar = connect(mapStateToProps, mapDispatchToProps)(Sidebar);

/** Top-level widget exposed to JupyterLab and connects to redux store */
export class SidebarWidget extends ReactWidget {
  constructor(private readonly reduxStore: Store) {
    super();
    this.id = 'optimizer-sidebar';
    this.title.iconClass = 'jp-Icon jp-Icon-20 jp-optimizer-icon';
    this.title.caption = 'GCP Optimizer';
  }

  render() {
    return (
      <Provider store={this.reduxStore}>
        <WrappedSidebar />
      </Provider>
    );
  }
}
