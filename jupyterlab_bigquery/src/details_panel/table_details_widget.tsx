import { ReactWidget, UseSignal } from '@jupyterlab/apputils';
import { Signal } from '@phosphor/signaling';
import * as React from 'react';

import { TableDetailsService } from './service/list_table_details';
import TableDetailsPanel from './table_details_panel';

/** Widget to be registered in the main panel. */
export class TableDetailsWidget extends ReactWidget {
  id = 'table-details-widget';
  private visibleSignal = new Signal<TableDetailsWidget, boolean>(this);

  constructor(
    private readonly service: TableDetailsService,
    private readonly dataset_id: string,
    private readonly name: string
  ) {
    super();
    console.log('dataset id: ', this.dataset_id);
    this.title.iconClass = 'jp-Icon jp-Icon-20 jp-BigQueryIcon';
    this.title.caption = `Dataset Details for ${this.dataset_id}`;
    this.title.label = this.name;
    this.title.closable = true;
  }

  onAfterHide() {
    this.visibleSignal.emit(false);
  }

  onAfterShow() {
    this.visibleSignal.emit(true);
  }

  render() {
    return (
      <UseSignal signal={this.visibleSignal}>
        {(_, isVisible) => {
          return (
            <TableDetailsPanel
              isVisible={isVisible}
              table_id={this.dataset_id}
              tableDetailsService={this.service}
            />
          );
        }}
      </UseSignal>
    );
  }
}
