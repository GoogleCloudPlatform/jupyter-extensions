import * as csstips from 'csstips';
import React from 'react';
import { stylesheet } from 'typestyle';

import { SearchResult } from './service/search_items';
import { Context } from './list_tree_panel';

import {
  DatasetResource,
  ModelResource,
  TableResource,
} from './list_tree_item';

import { ContextMenu } from 'gcp_jupyterlab_shared';
import { BigQueryService } from './service/bigquery_service';

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
  bigQueryService: BigQueryService;
}

interface State {
  expanded: boolean;
}

export function BuildSearchResult(result, context, bigQueryService) {
  return (
    <div>
      {result.type === 'dataset' ? (
        <DatasetSearchResult
          context={context}
          dataset={result}
          bigQueryService={bigQueryService}
        />
      ) : result.type === 'model' ? (
        <ModelSearchResult context={context} model={result} />
      ) : result.type === 'table' ? (
        <TableSearchResult context={context} table={result} />
      ) : (
        <ViewSearchResult context={context} table={result} />
      )}
    </div>
  );
}

export class DatasetSearchResult extends DatasetResource {
  contextMenuItems = [
    {
      label: 'Copy dataset ID',
      handler: dataTreeItem => this.copyID(dataTreeItem),
    },
  ];

  render() {
    const { dataset } = this.props;
    return (
      <ContextMenu
        items={this.contextMenuItems.map(item => ({
          label: item.label,
          onClick: () => item.handler(dataset),
        }))}
      >
        <div
          onDoubleClick={event => this.openDatasetDetails(event, dataset)}
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
  }
}

export class ModelSearchResult extends ModelResource {
  render() {
    const { model } = this.props;
    return (
      <ContextMenu
        items={this.contextMenuItems.map(item => ({
          label: item.label,
          onClick: () => item.handler(model),
        }))}
      >
        <div
          onDoubleClick={event => this.openModelDetails(event, model)}
          className={localStyles.searchResultItem}
        >
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
  }
}

export class TableSearchResult extends TableResource {
  render() {
    const { table } = this.props;
    return (
      <ContextMenu
        items={this.tableContextMenuItems.map(item => ({
          label: item.label,
          onClick: () => item.handler(table),
        }))}
      >
        <div
          onDoubleClick={event => this.openTableDetails(event, table)}
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
  }
}

export class ViewSearchResult extends TableResource {
  render() {
    const { table } = this.props;
    return (
      <ContextMenu
        items={this.viewContextMenuItems.map(item => ({
          label: item.label,
          onClick: () => item.handler(table),
        }))}
      >
        <div
          onDoubleClick={event => this.openViewDetails(event, table)}
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
  }
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
    if (searchResults.length > 0) {
      return searchResults.map(result => (
        <div key={result.id} className={localStyles.root}>
          {BuildSearchResult(result, context, this.props.bigQueryService)}
        </div>
      ));
    } else {
      return <div>No items match your search.</div>;
    }
  }
}
