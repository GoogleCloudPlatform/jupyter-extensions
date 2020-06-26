import { ReactWidget, UseSignal } from '@jupyterlab/apputils';
import { Signal } from '@phosphor/signaling';
import * as React from 'react';

import { DatasetDetailsService } from './service/list_dataset_details';
import DatasetDetailsPanel from './dataset_details_panel';

/** Widget to be registered in the main panel. */
export class DatasetDetailsWidget extends ReactWidget {
  id = 'dataset-details-widget';
  private visibleSignal = new Signal<DatasetDetailsWidget, boolean>(this);

  constructor(
    private readonly service: DatasetDetailsService,
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
            <DatasetDetailsPanel
              isVisible={isVisible}
              dataset_id={this.dataset_id}
              datasetDetailsService={this.service}
            />
          );
        }}
      </UseSignal>
    );
  }
}
