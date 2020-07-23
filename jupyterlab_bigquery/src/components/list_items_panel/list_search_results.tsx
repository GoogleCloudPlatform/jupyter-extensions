import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import ChevronRightIcon from '@material-ui/icons/ChevronRight';
import TreeView from '@material-ui/lab/TreeView';
import TreeItem from '@material-ui/lab/TreeItem';
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
    maxWidth: 400,
  },
  searchResultItem: {
    flexGrow: 1,
    borderBottom: 'var(--jp-border-width) solid var(--jp-border-color2)',
  },
  searchResultSubtitle: {
    fontSize: 12,
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

  const openViewDetails = view => {
    event.stopPropagation();
    // TODO: Create view widget
  };

  const renderTable = table => {
    const contextMenuItems = [
      {
        label: 'Copy Table ID',
        handler: dataTreeItem => copyID(dataTreeItem),
      },
    ];
    return (
      <ContextMenu
        items={contextMenuItems.map(item => ({
          label: item.label,
          onClick: () => item.handler(table),
        }))}
      >
        <TreeItem
          nodeId={table.id}
          label={
            <div>
              <div>{table.name}</div>
              <div className={localStyles.searchResultSubtitle}>
                Dataset: {table.parent}
              </div>
              <div className={localStyles.searchResultSubtitle}>
                Type: {table.type}
              </div>
            </div>
          }
          onDoubleClick={() => openTableDetails(table)}
          className={localStyles.searchResultItem}
        />
      </ContextMenu>
    );
  };

  const renderView = view => {
    const contextMenuItems = [
      {
        label: 'Copy View ID',
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
        <TreeItem
          nodeId={view.id}
          label={
            <div>
              <div>{view.name}</div>
              <div className={localStyles.searchResultSubtitle}>
                Dataset: {view.parent}
              </div>
              <div className={localStyles.searchResultSubtitle}>
                Type: {view.type}
              </div>
            </div>
          }
          onDoubleClick={() => openViewDetails(view)}
          className={localStyles.searchResultItem}
        />
      </ContextMenu>
    );
  };

  const renderModel = model => {
    const contextMenuItems = [
      {
        label: 'Copy Model ID',
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
        <TreeItem
          nodeId={model.id}
          label={
            <div>
              <div>{model.name}</div>
              <div className={localStyles.searchResultSubtitle}>
                Dataset: {model.parent}
              </div>
              <div className={localStyles.searchResultSubtitle}>
                Type: {model.type}
              </div>
            </div>
          }
          className={localStyles.searchResultItem}
        />
      </ContextMenu>
    );
  };

  const renderDataset = dataset => {
    const contextMenuItems = [
      {
        label: 'Copy Dataset ID',
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
        <TreeItem
          nodeId={dataset.id}
          label={
            <div>
              <div>{dataset.name}</div>
              <div className={localStyles.searchResultSubtitle}>
                Type: {dataset.type}
              </div>
            </div>
          }
          onDoubleClick={() => openDatasetDetails(dataset)}
          className={localStyles.searchResultItem}
        />
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
      <TreeView
        className={localStyles.root}
        defaultCollapseIcon={<ExpandMoreIcon />}
        defaultExpanded={['root']}
        defaultExpandIcon={<ChevronRightIcon />}
        key={result.id}
      >
        {BuildSearchResult(result, context)}
      </TreeView>
    ));
  }
}
