import { CircularProgress, Icon } from '@material-ui/core';
import ArrowDropDownIcon from '@material-ui/icons/ArrowDropDown';
import ArrowRightIcon from '@material-ui/icons/ArrowRight';
import TreeView from '@material-ui/lab/TreeView';
import TreeItem from '@material-ui/lab/TreeItem';
import * as csstips from 'csstips';
import React from 'react';
import { stylesheet } from 'typestyle';
import { Clipboard } from '@jupyterlab/apputils';
import { NotebookActions, INotebookTracker } from '@jupyterlab/notebook';

import {
  Project,
  Dataset,
  Table,
  Model,
  ListDatasetsService,
  ListTablesService,
  ListModelsService,
} from './service/list_items';
import { Context } from './list_tree_panel';
import { DatasetDetailsWidget } from '../details_panel/dataset_details_widget';
import { DatasetDetailsService } from '../details_panel/service/list_dataset_details';
import { TableDetailsWidget } from '../details_panel/table_details_widget';
import { TableDetailsService } from '../details_panel/service/list_table_details';
import { QueryEditorTabWidget } from '../query_editor/query_editor_tab/query_editor_tab_widget';
import { generateQueryId } from '../../reducers/queryEditorTabSlice';
import { WidgetManager } from '../../utils/widgetManager/widget_manager';
import { ViewDetailsWidget } from '../details_panel/view_details_widget';
import { ViewDetailsService } from '../details_panel/service/list_view_details';
import { ModelDetailsWidget } from '../details_panel/model_details_widget';
import { ModelDetailsService } from '../details_panel/service/list_model_details';

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
  resourceName: {
    fontFamily: 'var(--jp-ui-font-family)',
    fontSize: 'var(--jp-ui-font-size1)',
  },
  resourceIcons: {
    display: 'flex',
    alignContent: 'center',
    color: 'var(--jp-layout-color3)',
  },
  datasetName: {
    flexDirection: 'row',
    display: 'flex',
    alignItems: 'center',
  },
});

interface ResourceProps {
  context: Context;
  updateProject?: any;
  updateDataset?: any;
}

export interface ModelProps extends ResourceProps {
  model: Model;
}

export interface TableProps extends ResourceProps {
  table: Table;
}

export interface DatasetProps extends ResourceProps {
  dataset: Dataset;
  updateDataset?: any;
}

export interface ProjectProps extends ResourceProps {
  project: Project;
  updateProject: any;
  updateDataset: any;
  openSnackbar: any;
  removeProject: any;
  collapseAll?: boolean;
  updateCollapseAll?: any;
}

interface ResourceState {
  expanded: string[];
  loading: boolean;
}

export class Resource<T extends ResourceProps> extends React.Component<
  T,
  ResourceState
> {
  constructor(props) {
    super(props);
  }

  copyID = dataTreeItem => {
    Clipboard.copyToSystem(dataTreeItem.id);
  };

  copyBoilerplateQuery = dataTreeItem => {
    Clipboard.copyToSystem(`SELECT * FROM \`${dataTreeItem.id}\``);
  };

  getIcon = iconType => {
    return (
      <Icon className={localStyles.resourceIcons}>
        <div className={`jp-Icon jp-Icon-20 jp-${iconType}Icon`} />
      </Icon>
    );
  };
}

export class ModelResource extends Resource<ModelProps> {
  constructor(props: ModelProps) {
    super(props);
  }

  openModelDetails = (event, model) => {
    event.stopPropagation();
    const service = new ModelDetailsService();
    const widgetType = ModelDetailsWidget;
    this.props.context.manager.launchWidgetForId(
      model.id,
      widgetType,
      service,
      model.id,
      model.name
    );
  };

  contextMenuItems = [
    {
      label: 'Copy model ID',
      handler: dataTreeItem => this.copyID(dataTreeItem),
    },
  ];

  render() {
    const { model } = this.props;
    return (
      <TreeItem
        nodeId={model.id}
        icon={this.getIcon('Model')}
        label={
          <ContextMenu
            items={this.contextMenuItems.map(item => ({
              label: item.label,
              onClick: () => item.handler(model),
            }))}
          >
            <div className={localStyles.resourceName}>{model.name}</div>
          </ContextMenu>
        }
        onDoubleClick={event => this.openModelDetails(event, model)}
      />
    );
  }
}

export class TableResource extends Resource<TableProps> {
  constructor(props: TableProps) {
    super(props);
  }

  queryTable = dataTreeItem => {
    const notebookTrack = this.props.context.notebookTrack as INotebookTracker;
    const query = `SELECT * FROM \`${dataTreeItem.id}\` LIMIT 100`;

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

  openTableDetails = (event, table) => {
    event.stopPropagation();
    const service = new TableDetailsService();
    const widgetType = TableDetailsWidget;
    this.props.context.manager.launchWidgetForId(
      table.id,
      widgetType,
      service,
      table.id,
      table.name
    );
  };

  openViewDetails = (event, view) => {
    event.stopPropagation();
    const service = new ViewDetailsService();
    const widgetType = ViewDetailsWidget;
    this.props.context.manager.launchWidgetForId(
      view.id,
      widgetType,
      service,
      view.id,
      view.name
    );
  };

  getTableIcon = table => {
    if (table.partitioned) {
      return this.getIcon('PartitionedTable');
    } else {
      return this.getIcon('Table');
    }
  };

  tableContextMenuItems = [
    {
      label: 'Query table',
      handler: dataTreeItem => this.queryTable(dataTreeItem),
    },
    {
      label: 'Copy table ID',
      handler: dataTreeItem => this.copyID(dataTreeItem),
    },
    {
      label: 'Copy boilerplate query',
      handler: dataTreeItem => this.copyBoilerplateQuery(dataTreeItem),
    },
  ];

  public viewContextMenuItems = [
    {
      label: 'Copy view ID',
      handler: dataTreeItem => this.copyID(dataTreeItem),
    },
  ];

  render() {
    const { table } = this.props;
    return (
      <div>
        {table.type === 'TABLE' ? (
          <TreeItem
            nodeId={table.id}
            icon={this.getTableIcon(table)}
            label={
              <ContextMenu
                items={this.tableContextMenuItems.map(item => ({
                  label: item.label,
                  onClick: () => item.handler(table),
                }))}
              >
                <div className={localStyles.resourceName}>{table.name}</div>
              </ContextMenu>
            }
            onDoubleClick={event => this.openTableDetails(event, table)}
          />
        ) : table.type === 'VIEW' ? (
          <TreeItem
            nodeId={table.id}
            icon={this.getIcon('View')}
            label={
              <ContextMenu
                items={this.viewContextMenuItems.map(item => ({
                  label: item.label,
                  onClick: () => item.handler(table),
                }))}
              >
                <div className={localStyles.resourceName}>{table.name}</div>
              </ContextMenu>
            }
            onDoubleClick={event => this.openViewDetails(event, table)}
          />
        ) : (
          <div>Table references an external data source</div>
        )}
      </div>
    );
  }
}

export class DatasetResource extends Resource<DatasetProps> {
  constructor(props: DatasetProps) {
    super(props);
    this.state = {
      expanded: [],
      loading: true,
    };
  }

  listTablesService = new ListTablesService();
  listModelsService = new ListModelsService();

  expandDataset = dataset => {
    this.getDatasetChildren(
      dataset,
      this.listTablesService,
      this.listModelsService
    );
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
      this.setState({ loading: true });
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
    } finally {
      this.setState({ loading: false });
    }
  }

  handleExpandDataset = dataset => {
    if (!Array.isArray(dataset.tableIds) || !Array.isArray(dataset.modelIds)) {
      this.expandDataset(dataset);
    }
  };

  private async handleRefreshDataset(dataset) {
    await this.expandDataset(dataset);
  }

  openDatasetDetails = (event, dataset) => {
    const service = new DatasetDetailsService();
    const widgetType = DatasetDetailsWidget;
    this.props.context.manager.launchWidgetForId(
      dataset.id,
      widgetType,
      service,
      dataset.id,
      dataset.name
    );
  };

  contextMenuItems = [
    {
      label: 'Copy dataset ID',
      handler: dataTreeItem => this.copyID(dataTreeItem),
    },
    {
      label: 'Refresh dataset',
      handler: () => this.handleRefreshDataset(this.props.dataset),
    },
  ];

  render() {
    const { dataset } = this.props;
    const { loading } = this.state;
    return (
      <div className={localStyles.itemName}>
        <TreeItem
          nodeId={dataset.id}
          label={
            <ContextMenu
              items={this.contextMenuItems.map(item => ({
                label: item.label,
                onClick: () => item.handler(dataset),
              }))}
            >
              <div className={localStyles.datasetName}>
                <Icon style={{ display: 'flex', alignContent: 'center' }}>
                  <div className={'jp-Icon jp-Icon-20 jp-DatasetIcon'} />
                </Icon>
                <div className={localStyles.resourceName}>{dataset.name}</div>
              </div>
            </ContextMenu>
          }
          onDoubleClick={event => this.openDatasetDetails(event, dataset)}
          onLabelClick={event => event.preventDefault()}
          onIconClick={() => this.handleExpandDataset(dataset)}
        >
          {Array.isArray(dataset.tableIds) &&
          Array.isArray(dataset.modelIds) &&
          !loading ? (
            <ul>
              {dataset.tableIds.map(tableId => (
                <div key={tableId}>
                  <TableResource
                    context={this.props.context}
                    table={dataset.tables[tableId]}
                  />
                </div>
              ))}
              {dataset.modelIds.map(modelId => (
                <div key={modelId}>
                  <ModelResource
                    context={this.props.context}
                    model={dataset.models[modelId]}
                  />
                </div>
              ))}
            </ul>
          ) : (
            <CircularProgress
              size={20}
              className={localStyles.circularProgress}
            />
          )}
        </TreeItem>
      </div>
    );
  }
}

export class ProjectResource extends Resource<ProjectProps> {
  constructor(props: ProjectProps) {
    super(props);
    this.state = {
      expanded: [],
      loading: true,
    };
  }

  listDatasetsService = new ListDatasetsService();

  handleOpenSnackbar = error => {
    this.props.openSnackbar(error);
  };

  expandProject = project => {
    this.getDatasets(project, this.listDatasetsService);
  };

  async getDatasets(project, listDatasetsService) {
    const newProject = {
      id: project.id,
      name: project.name,
    };
    try {
      this.setState({ loading: true });
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
      if (newProject['error']) {
        this.handleOpenSnackbar(newProject['error']);
      }
      this.props.updateProject(newProject);
      this.setState({ loading: false });
    }
  }

  handleExpandProject = project => {
    this.props.updateCollapseAll(false);
    if (!Array.isArray(project.datasetIds) && !project.error) {
      this.setState({ loading: true });
      this.expandProject(project);
    }
    this.setState({ loading: false });
  };

  private async handleRefreshProject(project) {
    await this.expandProject(project);
    this.setState({ expanded: [project.id] });
  }

  async handleUnpinProject(project) {
    await this.props.removeProject(project);
  }

  handleToggle = (event, nodeIds) => {
    this.setState({ expanded: nodeIds });
  };

  contextMenuItems = [
    {
      label: 'Copy Project ID',
      handler: dataTreeItem => this.copyID(dataTreeItem),
    },
    {
      label: 'Refresh project',
      handler: () => this.handleRefreshProject(this.props.project),
    },
    {
      label: 'Unpin project',
      handler: () => this.handleUnpinProject(this.props.project),
    },
  ];

  componentDidUpdate() {
    if (this.props.collapseAll && this.state.expanded.length > 0) {
      this.setState({ expanded: [] });
    }
  }

  render() {
    const { project } = this.props;
    const { loading, expanded } = this.state;
    return (
      <TreeView
        className={localStyles.root}
        defaultCollapseIcon={<ArrowDropDownIcon fontSize="small" />}
        defaultExpanded={['root']}
        defaultExpandIcon={<ArrowRightIcon fontSize="small" />}
        expanded={expanded}
        onNodeToggle={this.handleToggle}
      >
        <TreeItem
          nodeId={project.id}
          label={
            <ContextMenu
              items={this.contextMenuItems.map(item => ({
                label: item.label,
                onClick: () => item.handler(project),
              }))}
            >
              <div className={localStyles.resourceName}>{project.name}</div>
            </ContextMenu>
          }
          onIconClick={() => this.handleExpandProject(project)}
          onLabelClick={event => event.preventDefault()}
        >
          {Array.isArray(project.datasetIds) && !loading ? (
            project.datasetIds.map(datasetId => (
              <div key={datasetId}>
                <DatasetResource
                  context={this.props.context}
                  dataset={project.datasets[datasetId]}
                  updateDataset={this.props.updateDataset}
                />
              </div>
            ))
          ) : project.error ? (
            <div>{project.error}</div>
          ) : (
            <CircularProgress
              size={20}
              className={localStyles.circularProgress}
            />
          )}
        </TreeItem>
      </TreeView>
    );
  }
}
