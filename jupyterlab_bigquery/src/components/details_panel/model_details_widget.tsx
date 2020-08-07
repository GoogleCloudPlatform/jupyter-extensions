import { ReactWidget } from '@jupyterlab/apputils';
import * as React from 'react';

import { ModelDetailsService } from './service/list_model_details';
import ModelDetailsPanel from './model_details_panel';

/** Widget to be registered in the main panel. */
export class ModelDetailsWidget extends ReactWidget {
  id = 'model-details-widget';

  constructor(
    private readonly service: ModelDetailsService,
    private readonly model_id: string,
    private readonly name: string
  ) {
    super();
    this.title.iconClass = 'jp-Icon jp-Icon-20 jp-BigQueryIcon';
    this.title.caption = `Model Details for ${this.model_id}`;
    this.title.label = this.name;
    this.title.closable = true;
  }

  render() {
    return (
      <ModelDetailsPanel
        isVisible={this.isVisible}
        modelId={this.model_id}
        modelName={this.name}
        modelDetailsService={this.service}
      />
    );
  }
}
