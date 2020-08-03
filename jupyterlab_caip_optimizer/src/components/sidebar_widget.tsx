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
import { Provider, connect, useDispatch } from 'react-redux';
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
  ButtonGroup,
  Link,
} from '@material-ui/core';
import { RootState, AppDispatch } from '../store/store';
import { Study } from '../types';
import { setView } from '../store/view';
import { Store } from 'redux';
import { prettifyStudyName } from '../service/optimizer';
import { style } from 'typestyle';
import { styles } from '../utils/styles';
import { Loading } from './loading';
import AddIcon from '@material-ui/icons/Add';

const rowStyle = style({
  $nest: {
    '&:hover': {
      cursor: 'pointer',
    },
  },
});

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
  const dispatch = useDispatch();
  return (
    <Box
      className={styles.root}
      height={1}
      width={1}
      bgcolor="white"
      borderRadius={0}
      display="flex"
      flexDirection="column"
    >
      <Box
        display="flex"
        alignItems="center"
        flexWrap="wrap"
        pt={2}
        px={1}
        style={{ justifyContent: 'center' }}
      >
        <Typography variant="h6" gutterBottom>
          Optimizer
        </Typography>

        {/* Spacing Element */}
        <Box style={{ flexGrow: 1 }} />

        <Box>
          <ButtonGroup color="primary" variant="contained">
            <Button onClick={() => openDashboard()}>Main Dashboard</Button>
            <Button
              onClick={() =>
                dispatch(
                  setView({
                    view: 'createStudy',
                  })
                )
              }
              startIcon={<AddIcon />}
            >
              Create Study
            </Button>
          </ButtonGroup>
        </Box>
      </Box>

      <Box my={2} px={1}>
        <Typography variant="body2">
          AI Platform Optimizer is a black-box optimization service that helps
          you tune hyperparameters in complex machine learning (ML) models
          through studies.{' '}
          <Link
            href="https://cloud.google.com/ai-platform/optimizer/docs"
            color="primary"
            variant="body2"
            rel="noopener"
            target="_blank"
          >
            Learn more
          </Link>
        </Typography>
      </Box>

      {!!error && (
        <Box display="flex" pt={2}>
          <Box mx="auto">
            <Typography color="error">{error}</Typography>
          </Box>
        </Box>
      )}
      {loading && <Loading />}
      {!!studies && studies.length > 0 ? (
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
                  data-testid="studyRow"
                  onClick={() => openStudy(study.name)}
                  className={rowStyle}
                >
                  <TableCell>{prettifyStudyName(study.name)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <Box display="flex" pt={2}>
          <Box mx="auto">
            <Typography>No studies found.</Typography>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export const WrappedSidebar = connect(
  mapStateToProps,
  mapDispatchToProps
)(Sidebar);

/** Top-level widget exposed to JupyterLab and connects to redux store */
export class SidebarWidget extends ReactWidget {
  constructor(private readonly reduxStore: Store) {
    super();
    this.id = 'optimizer-sidebar';
    this.title.iconClass =
      'jp-Icon jp-Icon-20 jp-optimizer-icon jp-optimizer-icon-rotate';
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
