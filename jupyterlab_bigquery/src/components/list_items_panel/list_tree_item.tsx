import { LinearProgress, Typography, Icon } from '@material-ui/core';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import ChevronRightIcon from '@material-ui/icons/ChevronRight';
import TreeView from '@material-ui/lab/TreeView';
import TreeItem from '@material-ui/lab/TreeItem';
import * as csstips from 'csstips';
import React from 'react';
import { connect } from 'react-redux';
import { stylesheet } from 'typestyle';
import { Clipboard } from '@jupyterlab/apputils';

import { DataTree } from './service/list_items';
import { Context } from './list_tree_panel';
import { DatasetDetailsWidget } from '../details_panel/dataset_details_widget';
import { DatasetDetailsService } from '../details_panel/service/list_dataset_details';
import { TableDetailsWidget } from '../details_panel/table_details_widget';
import { TableDetailsService } from '../details_panel/service/list_table_details';

import '../../../style/index.css';

import { ContextMenu } from 'gcp_jupyterlab_shared';

const localStyles = stylesheet({
  item: {
    alignItems: 'center',
    listStyle: 'none',
    height: '40px',
    paddingRight: '8px',
    ...csstips.horizontal,
  },
  dataset: {
    flexDirection: 'row',
    ...csstips.horizontal,
  },
  details: {
    alignItems: 'center',
    paddingLeft: '4px',
    ...csstips.horizontal,
    ...csstips.flex,
  },
  icon: {
    padding: '0 0 0 5px',
  },
  list: {
    margin: '0',
    padding: '0',
    ...csstips.flex,
  },
  root: {
    height: 216,
    flexGrow: 1,
    maxWidth: 400,
  },
});

interface ProjectProps {
  context: Context;
  data: DataTree;
}

interface State {
  expanded: boolean;
}

export function BuildTree(project, context) {
  const copyID = dataTreeItem => {
    Clipboard.copyToSystem(dataTreeItem.id);
  };

  const openDatasetDetails = (event, dataset) => {
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

  const openTableDetails = (event, table) => {
    event.stopPropagation();
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

  const renderTables = table => {
    const contextMenuItems = [
      {
        label: 'Copy Table ID',
        handler: dataTreeItem => copyID(dataTreeItem),
      },
    ];
    return (
      <TreeItem
        nodeId={table.id}
        label={
          <ContextMenu
            items={contextMenuItems.map(item => ({
              label: item.label,
              onClick: () => item.handler(table),
            }))}
          >
            <Icon style={{ display: 'flex', alignContent: 'center' }}>
              <div className={'jp-Icon jp-Icon-20 jp-TableIcon'} />
            </Icon>
            <Typography>{table.name}</Typography>
          </ContextMenu>
        }
        onDoubleClick={event => openTableDetails(event, table)}
      />
    );
  };

  const renderModels = model => {
    const contextMenuItems = [
      {
        label: 'Copy Model ID',
        handler: dataTreeItem => copyID(dataTreeItem),
      },
    ];
    return (
      <TreeItem
        nodeId={model.id}
        label={
          <ContextMenu
            items={contextMenuItems.map(item => ({
              label: item.label,
              onClick: () => item.handler(model),
            }))}
          >
            <Icon style={{ display: 'flex', alignContent: 'center' }}>
              <div className={'jp-Icon jp-Icon-20 jp-ModelIcon'} />
            </Icon>
            <Typography>{model.name}</Typography>
          </ContextMenu>
        }
      />
    );
  };

  const renderDatasets = dataset => {
    const contextMenuItems = [
      {
        label: 'Copy Dataset ID',
        handler: dataTreeItem => copyID(dataTreeItem),
      },
    ];

    return (
      <div className={localStyles.dataset}>
        <Icon style={{ display: 'flex', alignContent: 'center' }}>
          <div className={'jp-Icon jp-Icon-20 jp-DatasetIcon'} />
        </Icon>
        <TreeItem
          nodeId={dataset.id}
          label={
            <ContextMenu
              items={contextMenuItems.map(item => ({
                label: item.label,
                onClick: () => item.handler(dataset),
              }))}
            >
              <Typography>{dataset.name}</Typography>
            </ContextMenu>
          }
          onDoubleClick={event => openDatasetDetails(event, dataset)}
          onLabelClick={event => event.preventDefault()}
        >
          {Array.isArray(dataset.tables)
            ? dataset.tables.map(table => (
                <div key={table.id}>{renderTables(table)}</div>
              ))
            : null}
          {Array.isArray(dataset.models)
            ? dataset.models.map(model => (
                <div key={model.id}>{renderModels(model)}</div>
              ))
            : null}
        </TreeItem>
      </div>
    );
  };

  const renderProjects = (id, name, datasets) => (
    <TreeItem nodeId={id} label={name}>
      {Array.isArray(datasets)
        ? datasets.map(dataset => (
            <div key={dataset.id}>{renderDatasets(dataset)}</div>
          ))
        : null}
    </TreeItem>
  );

  return (
    <TreeView
      className={localStyles.root}
      defaultCollapseIcon={<ExpandMoreIcon />}
      defaultExpanded={['root']}
      defaultExpandIcon={<ChevronRightIcon />}
    >
      {renderProjects(project.id, project.name, project.datasets)}
    </TreeView>
  );
}

class ListProjectItem extends React.Component<ProjectProps, State> {
  constructor(props: ProjectProps) {
    super(props);
  }

  render() {
    const { data, context } = this.props;
    if (data.projects.length > 0) {
      return data.projects.map(p => (
        <div key={p.id}>{BuildTree(p, context)}</div>
      ));
    } else {
      return <LinearProgress />;
    }
  }
}

const mapStateToProps = state => {
  const data = state.dataTree.data;
  return { data };
};

export default connect(mapStateToProps, null)(ListProjectItem);
