import * as csstips from 'csstips';
import React from 'react';
import { stylesheet } from 'typestyle';
import { Clipboard } from '@jupyterlab/apputils';

import { SearchResult } from './service/search_items';
import { Context } from './list_tree_panel';
import { DatasetDetailsWidget } from '../details_panel/dataset_details_widget';
import { DatasetDetailsService } from '../details_panel/service/list_dataset_details';
import { TableDetailsWidget } from '../details_panel/table_details_widget';
import { TableDetailsService } from '../details_panel/service/list_table_details';
import { ViewDetailsWidget } from '../details_panel/view_details_widget';
import { ViewDetailsService } from '../details_panel/service/list_view_details';
import { QueryEditorTabWidget } from '../query_editor/query_editor_tab/query_editor_tab_widget';
import { generateQueryId } from '../../reducers/queryEditorTabSlice';
import { WidgetManager } from '../../utils/widgetManager/widget_manager';

import { ContextMenu } from 'gcp_jupyterlab_shared';

const localStyles = stylesheet({
  item: {
    alignItems: 'center',
    listStyle: 'none',
    height: '40px',
    paddingRight: '8px',
    ...csstips.horizontal,
  },
  childItem: {
    alignItems: 'center',
    borderBottom: 'var(--jp-border-width) solid var(--jp-border-color2)',
    listStyle: 'none',
    height: '40px',
    paddingRight: '8px',
    paddingLeft: '30px',
    ...csstips.horizontal,
  },
  root: {
    flexGrow: 1,
  },
  searchResultItem: {
    flexGrow: 1,
    borderBottom: 'var(--jp-border-width) solid var(--jp-border-color2)',
    '&:hover': {
      cursor: 'pointer',
      backgroundColor: 'rgba(0,0,0,0.05)',
    },
  },
  searchResultTitle: {
    fontFamily: 'var(--jp-ui-font-family)',
    fontSize: 'var(--jp-ui-font-size1)',
  },
  searchResultSubtitle: {
    fontFamily: 'var(--jp-ui-font-family)',
    fontSize: 'var(--jp-ui-font-size0)',
    color: 'gray',
  },
});

interface SearchProps {
  context: Context;
  searchResults: SearchResult[];
}

interface State {
  expanded: boolean;
}

export function BuildSearchResult(result, context) {
  const copyID = dataTreeItem => {
    Clipboard.copyToSystem(dataTreeItem.id);
  };

  const openDatasetDetails = dataset => {
    const service = new DatasetDetailsService();
    const widgetType = DatasetDetailsWidget;
    context.manager.launchWidgetForId(
      dataset.id,
      widgetType,
      service,
      dataset.id,
      dataset.name
    );
  };

  const openTableDetails = table => {
    const service = new TableDetailsService();
    const widgetType = TableDetailsWidget;
    context.manager.launchWidgetForId(
      table.id,
      widgetType,
      service,
      table.id,
      table.name
    );
  };

  const openViewDetails = (event, view) => {
    event.stopPropagation();
    const service = new ViewDetailsService();
    const widgetType = ViewDetailsWidget;
    context.manager.launchWidgetForId(
      view.id,
      widgetType,
      service,
      view.id,
      view.name
    );
  };

  const queryResource = dataTreeItem => {
    const queryId = generateQueryId();
    WidgetManager.getInstance().launchWidget(
      QueryEditorTabWidget,
      'main',
      queryId,
      undefined,
      [queryId, `SELECT * FROM \`${dataTreeItem.id}\``]
    );
  };

  const copyBoilerplateQuery = dataTreeItem => {
    Clipboard.copyToSystem(`SELECT * FROM \`${dataTreeItem.id}\``);
  };

  const renderTable = table => {
    const contextMenuItems = [
      {
        label: 'Query table',
        handler: dataTreeItem => queryResource(dataTreeItem),
      },
      {
        label: 'Copy table ID',
        handler: dataTreeItem => copyID(dataTreeItem),
      },
      {
        label: 'Copy boilerplate query',
        handler: dataTreeItem => copyBoilerplateQuery(dataTreeItem),
      },
    ];
    return (
      <ContextMenu
        items={contextMenuItems.map(item => ({
          label: item.label,
          onClick: () => item.handler(table),
        }))}
      >
        <div
          onDoubleClick={() => openTableDetails(table)}
          className={localStyles.searchResultItem}
        >
          <div>
            <div className={localStyles.searchResultTitle}>{table.name}</div>
            <div className={localStyles.searchResultSubtitle}>
              Dataset: {table.parent}
            </div>
            <div className={localStyles.searchResultSubtitle}>
              Type: {table.type}
            </div>
          </div>
        </div>
      </ContextMenu>
    );
  };

  const renderView = view => {
    const contextMenuItems = [
      {
        label: 'Copy view ID',
        handler: dataTreeItem => copyID(dataTreeItem),
      },
    ];
    return (
      <ContextMenu
        items={contextMenuItems.map(item => ({
          label: item.label,
          onClick: () => item.handler(view),
        }))}
      >
        <div
          onDoubleClick={event => openViewDetails(event, view)}
          className={localStyles.searchResultItem}
        >
          <div>
            <div className={localStyles.searchResultTitle}>{view.name}</div>
            <div className={localStyles.searchResultSubtitle}>
              Dataset: {view.parent}
            </div>
            <div className={localStyles.searchResultSubtitle}>
              Type: {view.type}
            </div>
          </div>
        </div>
      </ContextMenu>
    );
  };

  const renderModel = model => {
    const contextMenuItems = [
      {
        label: 'Copy model ID',
        handler: dataTreeItem => copyID(dataTreeItem),
      },
    ];
    return (
      <ContextMenu
        items={contextMenuItems.map(item => ({
          label: item.label,
          onClick: () => item.handler(model),
        }))}
      >
        <div className={localStyles.searchResultItem}>
          <div>
            <div className={localStyles.searchResultTitle}>{model.name}</div>
            <div className={localStyles.searchResultSubtitle}>
              Dataset: {model.parent}
            </div>
            <div className={localStyles.searchResultSubtitle}>
              Type: {model.type}
            </div>
          </div>
        </div>
      </ContextMenu>
    );
  };

  const renderDataset = dataset => {
    const contextMenuItems = [
      {
        label: 'Copy dataset ID',
        handler: dataTreeItem => copyID(dataTreeItem),
      },
    ];
    return (
      <ContextMenu
        items={contextMenuItems.map(item => ({
          label: item.label,
          onClick: () => item.handler(dataset),
        }))}
      >
        <div
          onDoubleClick={() => openDatasetDetails(dataset)}
          className={localStyles.searchResultItem}
        >
          <div>
            <div className={localStyles.searchResultTitle}>{dataset.name}</div>
            <div className={localStyles.searchResultSubtitle}>
              Type: {dataset.type}
            </div>
          </div>
        </div>
      </ContextMenu>
    );
  };

  return (
    <div>
      {result.type === 'dataset'
        ? renderDataset(result)
        : result.type === 'model'
        ? renderModel(result)
        : result.type === 'table'
        ? renderTable(result)
        : renderView(result)}
    </div>
  );
}

export default class ListSearchResults extends React.Component<
  SearchProps,
  State
> {
  constructor(props: SearchProps) {
    super(props);
  }

  render() {
    const { context, searchResults } = this.props;
    return searchResults.map(result => (
      <div key={result.id} className={localStyles.root}>
        {BuildSearchResult(result, context)}
      </div>
    ));
  }
}
