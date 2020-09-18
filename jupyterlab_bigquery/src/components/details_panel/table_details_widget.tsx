import { ReactWidget } from '@jupyterlab/apputils';
import * as React from 'react';

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
      ? 'jp-Icon jp-Icon-20 jp-PartitionedTableIcon'
      : 'jp-Icon jp-Icon-20 jp-TableIcon';
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
