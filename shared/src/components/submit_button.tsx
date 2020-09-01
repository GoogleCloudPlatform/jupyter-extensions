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

import { COLORS, css } from '../styles';

interface Props {
  actionPending: boolean;
  onClick: React.MouseEventHandler<HTMLButtonElement>;
  text: string;
  style?: any;
}

const localStyles = stylesheet({
  submit: {
    backgroundColor: COLORS.blue,
    color: COLORS.white,
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
    backgroundColor: 'var(--jp-border-color2)',
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
    <button
      className={classes(
        css.button,
        props.actionPending ? localStyles.disabled : localStyles.submit
      )}
      type="button"
      disabled={props.actionPending}
      onClick={props.onClick}
      style={props.style}
    >
      {props.text}
    </button>
  );
}
