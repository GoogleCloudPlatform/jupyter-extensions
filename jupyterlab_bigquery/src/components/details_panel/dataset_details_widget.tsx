/**
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http=//www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { ReactWidget } from '@jupyterlab/apputils';
import * as React from 'react';
import { ICONS } from '../../constants';
import DatasetDetailsPanel from './dataset_details_panel';
import { DatasetDetailsService } from './service/list_dataset_details';

/** Widget to be registered in the main panel. */
export class DatasetDetailsWidget extends ReactWidget {
  id = 'dataset-details-widget';

  constructor(
    private readonly service: DatasetDetailsService,
    private readonly dataset_id: string,
    private readonly name: string
  ) {
    super();
    this.title.iconClass = `jp-Icon jp-Icon-20 ${ICONS.dataset}`;
    this.title.caption = `Dataset Details for ${this.dataset_id}`;
    this.title.label = this.name;
    this.title.closable = true;
  }

  render() {
    return (
      <DatasetDetailsPanel
        isVisible={this.isVisible}
        dataset_id={this.dataset_id}
        datasetDetailsService={this.service}
      />
    );
  }
}
