import { ReactWidget } from '@jupyterlab/apputils';
import * as React from 'react';

import { DatasetDetailsService } from './service/list_dataset_details';
import DatasetDetailsPanel from './dataset_details_panel';

/** Widget to be registered in the main panel. */
export class DatasetDetailsWidget extends ReactWidget {
  id = 'dataset-details-widget';

  constructor(
    private readonly service: DatasetDetailsService,
    private readonly dataset_id: string,
    private readonly name: string
  ) {
    super();
    this.title.iconClass = 'jp-Icon jp-Icon-20 jp-BigQueryIcon';
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
