import { UseSignal } from '@jupyterlab/apputils';
import { Signal } from '@phosphor/signaling';
import * as React from 'react';
import { JupyterFrontEnd } from '@jupyterlab/application';
// import { Contents } from '@jupyterlab/services';

import { ReduxReactWidget } from '../../utils/ReduxReactWidget';
import { ListProjectsService } from './service/list_items';
import { WidgetManager } from '../../utils/widget_manager';
import ListItemsPanel from './list_tree_panel';
// import { IIterator, ArrayIterator, find } from '@phosphor/algorithm';

export interface Context {
  app: JupyterFrontEnd;
  manager: WidgetManager;
}

/** Widget to be registered in the left-side panel. */
export default class ListItemsWidget extends ReduxReactWidget {
  id = 'listitems';
  // private _items: Contents.IModel[] = [];
  private visibleSignal = new Signal<ListItemsWidget, boolean>(this);

  constructor(
    private readonly listProjectsService: ListProjectsService,
    private context: Context
  ) {
    super();
    this.title.iconClass = 'jp-Icon jp-Icon-20 jp-BigQueryIcon';
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
