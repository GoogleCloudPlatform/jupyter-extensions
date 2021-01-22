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
import { Button } from '@material-ui/core';
import { COLORS, css } from '../styles';

interface Props {
  actionPending: boolean;
  onClick: React.MouseEventHandler<HTMLButtonElement>;
  text: string;
}

const localStyles = stylesheet({
  submit: {
    backgroundColor: COLORS.white + '!important',
    color: COLORS.focus + '!important',
    border: 'none',
    $nest: {
      '&:disabled': {
        backgroundColor: 'var(--jp-layout-color3)',
      },
      '&:hover': {
        cursor: 'pointer',
      },
      '&:disabled:hover': { cursor: 'default' },
    },
  },
  disabled: {
    backgroundColor: COLORS.white,
    border: 'none',
    color: 'var(--jp-layout-color4)',
    cursor: 'not-allowed',
  },
});

/**
 * Function component for Submit Button that displays as a progress indicator.
 */
// tslint:disable-next-line:enforce-name-casing
export function SubmitButton(props: Props) {
  return (
    <Button
      className={classes(
        css.button,
        props.actionPending ? localStyles.disabled : localStyles.submit
      )}
      disabled={props.actionPending}
      onClick={props.onClick}
      color="primary"
    >
      {props.text}
    </Button>
  );
}
