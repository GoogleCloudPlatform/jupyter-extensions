import { ReactWidget } from '@jupyterlab/apputils';
import * as React from 'react';
import { Model } from '../service/model';
import { ModelComponent } from './model_component';

/** Widget to be registered in the left-side panel. */
export class ModelWidget extends ReactWidget {
  id = 'model-widget';

  constructor(private readonly modelMeta: Model) {
    super();
    this.title.label = modelMeta.displayName;
    this.title.caption = 'Cloud AI Model';
    this.title.closable = true;
    this.title.iconClass = 'jp-Icon jp-Icon-20 jp-AutoMLIcon-model';
  }

  render() {
    return <ModelComponent model={this.modelMeta}></ModelComponent>;
  }
}
