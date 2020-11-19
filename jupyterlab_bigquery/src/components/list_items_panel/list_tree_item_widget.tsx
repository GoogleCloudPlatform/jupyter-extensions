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
import { UseSignal } from '@jupyterlab/apputils';
import { Signal } from '@phosphor/signaling';
import * as React from 'react';
import { ICONS } from '../../constants';
import { ReduxReactWidget } from '../../utils/widgetManager/redux_react_widget';
import ListItemsPanel from './list_tree_panel';
import { Context } from './list_tree_panel';
import { ListProjectsService } from './service/list_items';

/** Widget to be registered in the left-side panel. */
export default class ListItemsWidget extends ReduxReactWidget {
  id = 'listitems';
  private visibleSignal = new Signal<ListItemsWidget, boolean>(this);

  constructor(
    private readonly listProjectsService: ListProjectsService,
    private context: Context
  ) {
    super();
    this.title.iconClass = `jp-Icon jp-Icon-20 ${ICONS.bigQuery}`;
    this.title.caption = 'BigQuery In Notebooks';
  }

  onAfterHide() {
    this.visibleSignal.emit(false);
  }

  onAfterShow() {
    this.visibleSignal.emit(true);
  }

  renderReact() {
    return (
      <UseSignal signal={this.visibleSignal}>
        {(_, isVisible) => (
          <ListItemsPanel
            isVisible={isVisible}
            listProjectsService={this.listProjectsService}
            context={this.context}
          />
        )}
      </UseSignal>
    );
  }
}
