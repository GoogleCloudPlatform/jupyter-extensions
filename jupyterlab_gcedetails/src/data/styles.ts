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
import { stylesheet } from 'typestyle';
import { BASE_FONT } from 'gcp_jupyterlab_shared';

/* Class names applied to the component. */
export const STYLES = stylesheet({
  container: {
    color: 'var(--jp-ui-font-color1)',
    fontFamily: 'var(--jp-ui-font-family)',
    fontSize: 'var(--jp-ui-font-size1, 13px)',
    lineHeight: '24px',
    alignItems: 'center',
    ...csstips.horizontal,
  },
  containerPadding: {
    margin: '0px',
    padding: '35px 30px',
    backgroundColor: 'var(--jp-layout-color1)',
  },
  containerSize: {
    width: 468,
  },
  heading: {
    fontSize: '22px',
    paddingBottom: '10px',
    fontWeight: 400,
    fontFamily: 'var(--jp-ui-font-family)',
    color: 'var(--jp-ui-font-color1)',
    display: 'block',
  },
  subheading: {
    fontFamily: 'var(--jp-ui-font-family)',
    color: 'var(--jp-ui-font-color1)',
    fontWeight: 700,
    fontSize: '15px',
    paddingTop: '20px',
    paddingBottom: '5px',
    display: 'block',
  },
  paragraph: {
    fontSize: '14px',
    paddingTop: '2px',
    display: 'block',
    fontWeight: 400,
    fontFamily: 'var(--jp-ui-font-family)',
    color: 'var(--jp-ui-font-color1)',
  },
  attribute: {
    marginRight: '4px',
  },
  interactiveHover: {
    $nest: {
      '&:hover': {
        backgroundColor: '#8a8a8a',
      },
    },
  },
  dt: {
    display: 'table-cell',
    fontWeight: 'bold',
    lineHeight: '20px',
    padding: '2px',
    verticalAlign: 'top',
    color: 'var(--jp-ui-font-color1)',
  },
  dd: {
    padding: '2px 2px 2px 24px',
    verticalAlign: 'top',
    color: 'var(--jp-ui-font-color1)',
  },
  icon: {
    display: 'inline-block',
    height: '18px',
    marginRight: '4px',
    width: '18px',
  },
  listRow: {
    display: 'table-row',
    boxShadow: 'inset 0 -1px 0 0 var(--jp-border-color1)',
  },
  infoMessage: {
    marginTop: '20px',
  },
});

export const TEXT_STYLE = {
  fontFamily: BASE_FONT.fontFamily as string,
  fontSize: BASE_FONT.fontSize as number,
  color: 'var(--jp-ui-font-color1)',
};
