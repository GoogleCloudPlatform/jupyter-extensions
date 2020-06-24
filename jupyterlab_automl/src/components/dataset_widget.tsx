import { ReactWidget } from '@jupyterlab/apputils';
import * as React from 'react';
import { Dataset } from '../service/dataset';
import { DatasetComponent } from './dataset_component';

/** Widget to be registered in the left-side panel. */
export class DatasetWidget extends ReactWidget {
  id = 'dataset-widget';

  constructor(private readonly datasetMeta: Dataset) {
    super();
    this.title.label = datasetMeta.displayName;
    this.title.caption = 'AutoML Dataset';
    this.title.closable = true;
    this.title.iconClass =
      'jp-Icon jp-Icon-20 jp-AutoMLIcon-' + datasetMeta.datasetType;
  }

  render() {
    return <DatasetComponent dataset={this.datasetMeta}></DatasetComponent>;
  }
}
