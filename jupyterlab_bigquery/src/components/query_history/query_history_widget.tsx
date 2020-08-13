import QueryHistoryPanel from './query_history_panel';
import * as React from 'react';
import { ReduxReactWidget } from '../../utils/widgetManager/redux_react_widget';
import { stylesheet } from 'typestyle';
import { QueryHistoryService } from './service/query_history';

const localStyles = stylesheet({
  panel: {
    backgroundColor: 'white',
    height: '100%',
  },
});

export class QueryHistoryWidget extends ReduxReactWidget {
  id = 'query-history-tab';

  constructor(private readonly service: QueryHistoryService) {
    super();
    this.title.label = 'Query History';
    this.title.closable = true;
  }

  renderReact() {
    return (
      <div className={localStyles.panel}>
        <QueryHistoryPanel queryHistoryService={this.service} />
      </div>
    );
  }
}
