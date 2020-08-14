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
import { COLORS } from 'gcp_jupyterlab_shared';
import Button from '@material-ui/core/Button';
import { withStyles, createStyles } from '@material-ui/core/styles';

interface Props {
  primaryLabel: string;
  secondaryLabel?: string;
  onPrimaryClick: () => void;
  onSecondaryClick?: () => void;
  primaryButtonProps?: React.ButtonHTMLAttributes<HTMLButtonElement>;
  secondaryButtonProps?: React.ButtonHTMLAttributes<HTMLButtonElement>;
}

const STYLES = stylesheet({
  actionBar: {
    marginTop: '25px',
    display: 'block',
    ...csstips.horizontal,
    ...csstips.endJustified,
  },
});

const SecondaryButton = withStyles(() =>
  createStyles({
    root: {
      marginRight: '10px',
      textTransform: 'capitalize',
      fontFamily: 'var(--jp-ui-font-family)',
    },
  })
)(Button);

const PrimaryButton = withStyles(() =>
  createStyles({
    root: {
      textTransform: 'capitalize',
      fontFamily: 'var(--jp-ui-font-family)',
      backgroundColor: COLORS.blue,
      '&:hover': {
        backgroundColor: '#1a62e8',
      },
    },
  })
)(Button);

/** Funtional Component for defining an action bar with buttons. */
export function ActionBar(props: Props) {
  return (
    <div className={STYLES.actionBar}>
      {props.secondaryLabel && (
        <SecondaryButton
          variant="contained"
          size="small"
          disableRipple={true}
          disableElevation={true}
          onClick={props.onSecondaryClick}
          {...props.secondaryButtonProps}
        >
          {props.secondaryLabel}
        </SecondaryButton>
      )}
      <PrimaryButton
        variant="contained"
        color="primary"
        size="small"
        disableRipple={true}
        disableElevation={true}
        onClick={props.onPrimaryClick}
        {...props.primaryButtonProps}
      >
        {props.primaryLabel}
      </PrimaryButton>
    </div>
  );
}
