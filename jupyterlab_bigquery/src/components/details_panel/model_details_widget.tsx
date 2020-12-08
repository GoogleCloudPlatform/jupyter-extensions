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
import ModelDetailsPanel from './model_details_panel';
import { ModelDetailsService } from './service/list_model_details';

/** Widget to be registered in the main panel. */
export class ModelDetailsWidget extends ReactWidget {
  id = 'model-details-widget';

  constructor(
    private readonly service: ModelDetailsService,
    private readonly model_id: string,
    private readonly name: string
  ) {
    super();
    this.title.iconClass = `jp-Icon jp-Icon-20 ${ICONS.model}`;
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
