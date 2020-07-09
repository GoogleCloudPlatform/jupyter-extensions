// import { LinearProgress } from '@material-ui/core';
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
import { Context } from './list_tree_item_widget';
import { DatasetDetailsWidget } from '../details_panel/dataset_details_widget';
import { DatasetDetailsService } from '../details_panel/service/list_dataset_details';
import { TableDetailsWidget } from '../details_panel/table_details_widget';
import { TableDetailsService } from '../details_panel/service/list_table_details';

import { ContextMenu } from 'gcp_jupyterlab_shared';

//import { COLORS, css } from '../styles';

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
  details: {
    alignItems: 'center',
    paddingLeft: '4px',
    ...csstips.horizontal,
    ...csstips.flex,
  },
  wordTime: {
    color: 'var(--jp-content-font-color2)',
    fontSize: '9px',
    textAlign: 'right',
    ...csstips.flex,
  },
  viewLink: {
    backgroundImage: 'var(--jp-icon-notebook)',
    backgroundRepeat: 'no-repeat',
    marginLeft: '5px',
    padding: '0 6px',
    textDecoration: 'none',
  },
  icon: {
    padding: '0 0 0 5px',
  },
  list: {
    margin: '0',
    // overflowY: 'scroll',
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

  const renderTables = table => {
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
          label={table.name}
          onDoubleClick={() => openTableDetails(table)}
        />
      </ContextMenu>
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
      <ContextMenu
        items={contextMenuItems.map(item => ({
          label: item.label,
          onClick: () => item.handler(model),
        }))}
      >
        <TreeItem nodeId={model.id} label={model.name} />
      </ContextMenu>
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
      <div>
        <ContextMenu
          items={contextMenuItems.map(item => ({
            label: item.label,
            onClick: () => item.handler(dataset),
          }))}
        >
          <TreeItem
            nodeId={dataset.id}
            label={dataset.name}
            onDoubleClick={() => openDatasetDetails(dataset)}
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
        </ContextMenu>
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

class ListSearchResults extends React.Component<ProjectProps, State> {
  constructor(props: ProjectProps) {
    super(props);
  }

  render() {
    // const { data, context } = this.props;
    // if (data.projects.length > 0) {
    //   return data.projects.map(p => (
    //     <div key={p.id}>{BuildTree(p, context)}</div>
    //   ));
    // } else {
    //   return <LinearProgress />;
    // }
    return <div>Display results here</div>;
  }
}

const mapStateToProps = state => {
  const data = state.dataTree.data;
  return { data };
};

export default connect(mapStateToProps, null)(ListSearchResults);
