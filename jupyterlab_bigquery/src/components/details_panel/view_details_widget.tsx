import { ReactWidget } from '@jupyterlab/apputils';
import * as React from 'react';

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
    this.title.iconClass = 'jp-Icon jp-Icon-20 jp-ViewIcon';
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
