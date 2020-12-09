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
import { ViewDetailsService } from './service/list_view_details';
import ViewDetailsPanel from './view_details_panel';

/** Widget to be registered in the main panel. */
export class ViewDetailsWidget extends ReactWidget {
  id = 'view-details-widget';

  constructor(
    private readonly service: ViewDetailsService,
    private readonly view_id: string,
    private readonly name: string
  ) {
    super();
    this.title.iconClass = `jp-Icon jp-Icon-20 ${ICONS.view}`;
    this.title.caption = `View Details for ${this.view_id}`;
    this.title.label = this.name;
    this.title.closable = true;
  }

  render() {
    return (
      <ViewDetailsPanel
        isVisible={this.isVisible}
        view_id={this.view_id}
        view_name={this.name}
        viewDetailsService={this.service}
      />
    );
  }
}
