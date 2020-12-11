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
import { classes, stylesheet } from 'typestyle';
import { Grid } from '@material-ui/core';
import { COLORS } from '../styles';
import { Progress } from './progress';
import { RedError, BlueInfo } from './icons';

interface Props {
  children?: React.ReactNode;
  asError?: boolean;
  asActivity?: boolean;
  text?: string;
}

const localStyles = stylesheet({
  error: {
    backgroundColor: COLORS.error,
    color: COLORS.base,
  },
  info: {
    backgroundColor: COLORS.secondary,
    color: COLORS.base,
  },
  message: {
    borderRadius: '3px',
    padding: '7px',
  },
});

/** Shared message component. */
export function Message(props: Props): JSX.Element {
  return (
    <Grid
      container
      spacing={1}
      className={classes(
        localStyles.message,
        props.asError ? localStyles.error : localStyles.info
      )}
    >
      <Grid item sm={1}>
        {props.asActivity ? (
          <Progress />
        ) : props.asError ? (
          <RedError />
        ) : (
          <BlueInfo />
        )}
      </Grid>
      <Grid item sm={10}>
        {props.children ? props.children : props.text}
      </Grid>
    </Grid>
  );
}
