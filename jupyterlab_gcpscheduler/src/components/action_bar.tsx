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

import * as csstips from 'csstips';
import * as React from 'react';
import { stylesheet } from 'typestyle';

import { Button, Grid } from '@material-ui/core';
import { OnDialogClose } from './dialog';
import { COLORS } from 'gcp_jupyterlab_shared';

interface Props {
  children?: React.ReactNode;
  closeLabel?: string;
  displayMessage?: React.ReactNode;
  closeOnRight?: boolean;
  onDialogClose: OnDialogClose;
}

export const STYLES = stylesheet({
  actionBar: {
    $nest: {
      '&>*': {
        marginLeft: '16px',
      },
    },
    ...csstips.horizontal,
    ...csstips.endJustified,
  },
  actionBarContainer: {
    paddingTop: '16px',
  },
  actionBarDisplayMessage: {
    marginLeft: '5px',
    ...csstips.horizontal,
    color: COLORS.caption,
    fontSize: '12px',
  },
});

/** Funtional Component for defining an action bar with buttons. */
export function ActionBar(props: Props) {
  return (
    <Grid container spacing={1} className={STYLES.actionBarContainer}>
      {props.displayMessage && (
        <Grid item sm={12}>
          <span className={STYLES.actionBarDisplayMessage}>
            {props.displayMessage}
          </span>
        </Grid>
      )}
      <Grid item sm={12}>
        <div className={STYLES.actionBar}>
          {props.closeOnRight && props.children}
          <Button onClick={props.onDialogClose}>
            {props.closeLabel || 'Close'}
          </Button>
          {!props.closeOnRight && props.children}
        </div>
      </Grid>
    </Grid>
  );
}
