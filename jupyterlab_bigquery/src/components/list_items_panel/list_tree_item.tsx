import {
  LinearProgress,
  Typography,
  CircularProgress,
  Icon,
} from '@material-ui/core';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import ChevronRightIcon from '@material-ui/icons/ChevronRight';
import TreeView from '@material-ui/lab/TreeView';
import TreeItem from '@material-ui/lab/TreeItem';
import * as csstips from 'csstips';
import React from 'react';
import { connect } from 'react-redux';
import { stylesheet } from 'typestyle';
import { Clipboard } from '@jupyterlab/apputils';
import { NotebookActions, INotebookTracker } from '@jupyterlab/notebook';
import { generateQueryId } from '../../reducers/queryEditorTabSlice';
import { QueryEditorTabWidget } from '../query_editor/query_editor_tab/query_editor_tab_widget';

import {
  DataTree,
  Project,
  Dataset,
  ListDatasetsService,
  ListTablesService,
  ListModelsService,
} from './service/list_items';
import { Context } from './list_tree_panel';
import { DatasetDetailsWidget } from '../details_panel/dataset_details_widget';
import { DatasetDetailsService } from '../details_panel/service/list_dataset_details';
import { TableDetailsWidget } from '../details_panel/table_details_widget';
import { TableDetailsService } from '../details_panel/service/list_table_details';
import { ViewDetailsWidget } from '../details_panel/view_details_widget';
import { ViewDetailsService } from '../details_panel/service/list_view_details';
import { updateProject, updateDataset } from '../../reducers/dataTreeSlice';
import { openSnackbar } from '../../reducers/snackbarSlice';

import '../../../style/index.css';

import { ContextMenu } from 'gcp_jupyterlab_shared';
import { WidgetManager } from '../../utils/widgetManager/widget_manager';

const localStyles = stylesheet({
  item: {
    alignItems: 'center',
    listStyle: 'none',
    height: '40px',
    paddingRight: '8px',
    ...csstips.horizontal,
  },
  itemName: {
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
    flexGrow: 1,
  },
  circularProgress: {
    padding: 5,
  },
});

interface ProjectProps {
  context: Context;
  dataTree: DataTree;
  updateProject: any;
  updateDataset: any;
  listDatasetsService: ListDatasetsService;
  listTablesService: ListTablesService;
  listModelsService: ListModelsService;
  openSnackbar: any;
}

interface State {
  expanded: boolean;
}

export function BuildTree(project, context, expandProject, expandDataset) {
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

  const getIcon = iconType => {
    return (
      <Icon style={{ display: 'flex', alignContent: 'center' }}>
        <div className={`jp-Icon jp-Icon-20 jp-${iconType}Icon`} />
      </Icon>
    );
  };

  const queryTable = dataTreeItem => {
    const notebookTrack = context.notebookTrack as INotebookTracker;
    const query = `SELECT * FROM ${dataTreeItem.id} LIMIT 100`;

    const curWidget = notebookTrack.currentWidget;

    if (!curWidget || !curWidget.content.isVisible) {
      // no active notebook or not visible
      const queryId = generateQueryId();
      WidgetManager.getInstance().launchWidget(
        QueryEditorTabWidget,
        'main',
        queryId,
        undefined,
        [queryId, query]
      );
    } else {
      // exist notebook and visible
      const notebook = curWidget.content;
      NotebookActions.insertBelow(notebook);
      const cell = notebookTrack.activeCell;
      const code = '%%bigquery_editor\n\n' + query;
      cell.model.value.text = code;
    }
  };

  const renderTables = table => {
    const tableContextMenuItems = [
      {
        label: 'Copy Table ID',
        handler: dataTreeItem => copyID(dataTreeItem),
      },
      {
        label: 'Query Table',
        handler: queryTable,
      },
    ];

    const viewContextMenuItems = [
      {
        label: 'Copy View ID',
        handler: dataTreeItem => copyID(dataTreeItem),
      },
    ];

    return (
      <div>
        {table.type === 'TABLE' ? (
          <TreeItem
            nodeId={table.id}
            icon={getIcon('Table')}
            label={
              <ContextMenu
                items={tableContextMenuItems.map(item => ({
                  label: item.label,
                  onClick: () => item.handler(table),
                }))}
              >
                <Typography>{table.name}</Typography>
              </ContextMenu>
            }
            onDoubleClick={event => openTableDetails(event, table)}
          />
        ) : table.type === 'VIEW' ? (
          <TreeItem
            nodeId={table.id}
            icon={getIcon('View')}
            label={
              <ContextMenu
                items={viewContextMenuItems.map(item => ({
                  label: item.label,
                  onClick: () => item.handler(table),
                }))}
              >
                <Typography>{table.name}</Typography>
              </ContextMenu>
            }
            onDoubleClick={event => openViewDetails(event, table)}
          />
        ) : (
          <div>Table references an external data source</div>
        )}
      </div>
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
        icon={getIcon('Model')}
        label={
          <ContextMenu
            items={contextMenuItems.map(item => ({
              label: item.label,
              onClick: () => item.handler(model),
            }))}
          >
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
      <div className={localStyles.itemName}>
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
          onIconClick={() => expandDataset(dataset)}
        >
          {Array.isArray(dataset.tableIds) &&
          Array.isArray(dataset.modelIds) ? (
            <div>
              {dataset.tableIds.map(tableId => (
                <div key={tableId}>{renderTables(dataset.tables[tableId])}</div>
              ))}
              {dataset.modelIds.map(modelId => (
                <div key={modelId}>{renderModels(dataset.models[modelId])}</div>
              ))}
            </div>
          ) : (
            <CircularProgress
              size={20}
              className={localStyles.circularProgress}
            />
          )}
        </TreeItem>
      </div>
    );
  };

  const renderProjects = project => (
    <TreeItem
      nodeId={project.id}
      label={project.name}
      onIconClick={expandProject(project)}
    >
      {Array.isArray(project.datasetIds) ? (
        project.datasetIds.map(datasetId => (
          <div key={datasetId}>
            {renderDatasets(project.datasets[datasetId])}
          </div>
        ))
      ) : project.error ? (
        <div>{project.error}</div>
      ) : (
        <CircularProgress size={20} className={localStyles.circularProgress} />
      )}
    </TreeItem>
  );

  return (
    <TreeView
      className={localStyles.root}
      defaultCollapseIcon={<ExpandMoreIcon />}
      defaultExpanded={['root']}
      defaultExpandIcon={<ChevronRightIcon />}
    >
      {renderProjects(project)}
    </TreeView>
  );
}

class ListProjectItem extends React.Component<ProjectProps, State> {
  constructor(props: ProjectProps) {
    super(props);
  }

  expandProject = project => {
    if (project.error) {
      this.handleOpenSnackbar(project.error);
    } else if (!Array.isArray(project.datasetIds)) {
      this.getDatasets(project, this.props.listDatasetsService);
    }
  };

  private async getDatasets(project, listDatasetsService) {
    const newProject = {
      id: project.id,
      name: project.name,
    };
    try {
      await listDatasetsService.listDatasets(project).then((data: Project) => {
        if (data.datasetIds.length === 0) {
          newProject[
            'error'
          ] = `No datasets available for ${project.name}. Check your permissions for this project.`;
        } else {
          newProject['datasets'] = data.datasets;
          newProject['datasetIds'] = data.datasetIds;
        }
      });
    } catch (err) {
      const fullError = err.response.statusText;
      console.warn('Error retrieving datasets: ', fullError);
      const errorMessage =
        fullError.split('datasets: ')[1] ||
        'The project does not exist or does not have BigQuery enabled.';
      newProject['error'] = `Error: ${errorMessage}`;
    } finally {
      this.props.updateProject(newProject);
    }
  }

  expandDataset = dataset => {
    if (!Array.isArray(dataset.tableIds) || !Array.isArray(dataset.modelIds)) {
      this.getDatasetChildren(
        dataset,
        this.props.listTablesService,
        this.props.listModelsService
      );
    }
  };

  private async getDatasetChildren(
    dataset,
    listTablesService,
    listModelsService
  ) {
    const newDataset = {
      id: dataset.id,
      name: dataset.name,
      projectId: dataset.projectId,
      tables: {},
      tableIds: [],
      models: {},
      modelIds: [],
    };
    try {
      await listTablesService.listTables(dataset.id).then((data: Dataset) => {
        newDataset.tables = data.tables;
        newDataset.tableIds = data.tableIds;
      });
      await listModelsService.listModels(dataset.id).then((data: Dataset) => {
        newDataset.models = data.models;
        newDataset.modelIds = data.modelIds;
      });
      this.props.updateDataset(newDataset);
    } catch (err) {
      console.warn('Error retrieving dataset children', err);
    }
  }

  handleOpenSnackbar = error => {
    this.props.openSnackbar(error);
  };

  render() {
    const { dataTree, context } = this.props;
    if (Array.isArray(dataTree.projectIds)) {
      return dataTree.projectIds.map(projectId => (
        <div key={projectId}>
          {BuildTree(
            dataTree.projects[projectId],
            context,
            this.expandProject,
            this.expandDataset
          )}
        </div>
      ));
    } else {
      return <LinearProgress />;
    }
  }
}

const mapStateToProps = state => {
  const dataTree = state.dataTree.data;
  return { dataTree };
};
const mapDispatchToProps = {
  updateProject,
  updateDataset,
  openSnackbar,
};

export default connect(mapStateToProps, mapDispatchToProps)(ListProjectItem);
