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
import { TableDetailsService } from './service/list_table_details';
import TableDetailsTabs from './table_details_tabs';

/** Widget to be registered in the main panel. */
export class TableDetailsWidget extends ReactWidget {
  id = 'table-details-widget';

  constructor(
    private readonly service: TableDetailsService,
    private readonly table_id: string,
    private readonly name: string,
    private readonly partitioned: boolean
  ) {
    super();
    this.title.iconClass = this.partitioned
      ? `jp-Icon jp-Icon-20 ${ICONS.partitionedTable}`
      : `jp-Icon jp-Icon-20 ${ICONS.table}`;
    this.title.caption = `Table Details for ${this.table_id}`;
    this.title.label = this.name;
    this.title.closable = true;
  }

  render() {
    return (
      <TableDetailsTabs
        isVisible={this.isVisible}
        table_id={this.table_id}
        table_name={this.name}
        partitioned={this.partitioned}
        tableDetailsService={this.service}
      />
    );
  }
}
