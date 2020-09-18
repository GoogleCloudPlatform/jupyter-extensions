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
import { style } from 'typestyle';

import { css } from 'gcp_jupyterlab_shared';
import { OnDialogClose } from './dialog';

interface Props {
  children?: React.ReactNode;
  closeLabel?: string;
  onDialogClose: OnDialogClose;
}

const actionBar = style({
  paddingTop: '16px',
  paddingRight: '2px',
  $nest: {
    '&>*': {
      marginLeft: '16px',
    },
  },
  ...csstips.horizontal,
  ...csstips.endJustified,
});

/** Funtional Component for defining an action bar with buttons. */
export function ActionBar(props: Props) {
  return (
    <div className={actionBar}>
      <button
        type="button"
        className={css.button}
        onClick={props.onDialogClose}
      >
        {props.closeLabel || 'Close'}
      </button>
      {props.children}
    </div>
  );
}
