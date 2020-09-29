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
import { style } from 'typestyle';
import { Badge } from 'gcp_jupyterlab_shared';

const header = style({
  borderBottom: 'var(--jp-border-width) solid var(--jp-border-color2)',
  fontWeight: 600,
  fontSize: 'var(--jp-ui-font-size0, 11px)',
  letterSpacing: '1px',
  margin: 0,
  padding: '8px 12px',
  textTransform: 'uppercase',
  backgroundColor: 'white',
});

export class PanelHeader extends ReactWidget {
  render() {
    return (
      <div className={header}>
        Google Cloud Storage <Badge value="Alpha" />
      </div>
    );
  }
}
