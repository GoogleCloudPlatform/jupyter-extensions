import * as React from 'react';
import { Context } from '../../context';
import { Dataset } from '../../service/dataset';
import { BaseWidget } from '../base_widget';
import { DatasetComponent } from './dataset_component';

/** Widget to be registered in the left-side panel. */
export class DatasetWidget extends BaseWidget {
  id = 'dataset-widget';

  constructor(private readonly datasetMeta: Dataset, context: Context) {
    super(context);
    this.title.label = datasetMeta.displayName;
    this.title.caption = 'Dataset ' + datasetMeta.displayName;
    this.title.closable = true;
    this.title.iconClass =
      'jp-Icon jp-Icon-20 jp-UcaipIcon-' + datasetMeta.datasetType;
  }

  body() {
    return <DatasetComponent dataset={this.datasetMeta}></DatasetComponent>;
  }
}
