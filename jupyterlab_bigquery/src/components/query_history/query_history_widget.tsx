import QueryHistoryPanel from './query_history_panel';
import * as React from 'react';
import { ReduxReactWidget } from '../../utils/widgetManager/redux_react_widget';
import { QueryHistoryService } from './service/query_history';

export class QueryHistoryWidget extends ReduxReactWidget {
  id = 'query-history-tab';

  constructor(private readonly service: QueryHistoryService) {
    super();
    this.title.label = 'Query History';
    this.title.iconClass = 'jp-Icon jp-Icon-20 jp-BigQueryIcon';
    this.title.closable = true;
  }

  renderReact() {
    return <QueryHistoryPanel queryHistoryService={this.service} />;
  }
}
