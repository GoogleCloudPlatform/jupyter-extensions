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

/**
 * Global styles configured with typestyle.
 * JupyterLab CSS Variables can be found at
 * https://github.com/jupyterlab/jupyterlab/blob/master/packages/theme-light-extension/style/variables.css
 */
import * as csstips from 'csstips';
import { cssRaw, stylesheet, types } from 'typestyle';

// Imports Roboto 400 and 500 weight
cssRaw(
  `@import url('https://fonts.googleapis.com/css?family=Roboto:400,500');`
);
const ROBOTO_FONT = '"Roboto", "Helvetica Neue", sans-serif';

/** Theme colors. */
export const COLORS = {
  base: 'var(--jp-ui-font-color1, #3c4043)',
  blue: '#1a73e8',
  border: 'var(--jp-border-color0, #bdc1c6)',
  green: 'var(--jp-success-color1, #1e8e3e)',
  input: '#f5f5f5',
  link: 'var(--jp-content-link-color, #3367d6)',
  red: 'var(--jp-error-color1, #d93025)',
  white: 'var(--jp-layout-color1, white)',
};

/** Base extension font style */
export const BASE_FONT: types.CSSProperties = {
  color: COLORS.base,
  fontFamily: ROBOTO_FONT,
  fontSize: 'var(--jp-ui-font-size1, 13px)',
};

/** Global styles that are useful across components */
export const css = stylesheet({
  column: csstips.vertical,
  row: csstips.horizontal,
  bold: {
    fontWeight: 500,
  },
  button: {
    color: COLORS.base,
    backgroundColor: COLORS.white,
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: COLORS.border,
    fontFamily: ROBOTO_FONT,
    fontWeight: 500,
    cursor: 'pointer',
    ...csstips.padding('4px', '16px'),
  },
  inputContainer: {
    paddingBottom: '10px',
    ...csstips.vertical,
    $nest: {
      '&.error': {
        paddingBottom: '2px',
      },
    },
  },
  input: {
    backgroundColor: COLORS.input,
    borderColor: COLORS.border,
    borderWidth: '1px',
    fontSize: '12px',
    fontFamily: 'Arial', // forces date/time inputs to be consistent
    marginTop: '4px',
    ...csstips.padding('5px', '4px'),
    $nest: {
      '&.error': {
        borderColor: COLORS.red,
        borderStyle: 'solid',
      },
    },
  },
  link: {
    color: COLORS.link,
    textDecoration: 'underline',
    $nest: {
      '&:active': {
        color: COLORS.link,
      },
      '&:hover': {
        color: COLORS.link,
      },
      '&:visited': {
        color: COLORS.link,
      },
    },
  },
  paragraph: { marginTop: '16px' },
  noTopMargin: { marginTop: 0 },
  serviceStatuses: {
    ...csstips.vertical,
    ...csstips.padding('16px', 0),
  },
  serviceStatusItem: {
    alignItems: 'center',
    letterSpacing: '0.09px',
    lineHeight: '20px',
    ...csstips.horizontal,
    $nest: {
      '&>*': { paddingRight: '4px' },
    },
  },
  scheduleBuilderRow: {
    $nest: {
      '&>*': {
        marginRight: '16px',
      },
      '&>*:last-child': {
        marginRight: '0px',
      },
    },
    ...csstips.horizontal,
    ...csstips.center,
  },
  flexQuarter: {
    flexBasis: '25%',
  },
  flex1: {
    ...csstips.flex1,
  },
  flex2: {
    ...csstips.flex2,
  },
  flex3: {
    ...csstips.flex3,
  },
  errorRow: {
    marginTop: '8px',
  },
  primaryTextColor: {
    color: 'var(--jp-ui-font-color1)',
  },
  primaryBackgroundColor: {
    backgroundColor: 'var(--jp-layout-color1)',
  },
  secondaryTextColor: {
    color: 'var(--jp-ui-font-color2)',
  },
  secondaryBackgroundColor: {
    backgroundColor: 'var(--jp-layout-color2)',
  },
});
