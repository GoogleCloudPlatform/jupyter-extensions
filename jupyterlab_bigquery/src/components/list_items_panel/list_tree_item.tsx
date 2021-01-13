/**
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http=//www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { Clipboard } from '@jupyterlab/apputils';
import { INotebookTracker, NotebookActions } from '@jupyterlab/notebook';
import { CircularProgress, Icon } from '@material-ui/core';
import ArrowDropDownIcon from '@material-ui/icons/ArrowDropDown';
import ArrowRightIcon from '@material-ui/icons/ArrowRight';
import TreeItem from '@material-ui/lab/TreeItem';
import TreeView from '@material-ui/lab/TreeView';
import * as csstips from 'csstips';
import { ContextMenu } from 'gcp_jupyterlab_shared';
import React from 'react';
import { stylesheet } from 'typestyle';
import { ICONS } from '../../constants';
import { generateQueryId } from '../../reducers/queryEditorTabSlice';
import { getStarterQuery, QueryType } from '../../utils/starter_queries';
import { WidgetManager } from '../../utils/widgetManager/widget_manager';
import { DatasetDetailsWidget } from '../details_panel/dataset_details_widget';
import { ModelDetailsWidget } from '../details_panel/model_details_widget';
import { DatasetDetailsService } from '../details_panel/service/list_dataset_details';
import { ModelDetailsService } from '../details_panel/service/list_model_details';
import { TableDetailsService } from '../details_panel/service/list_table_details';
import { ViewDetailsService } from '../details_panel/service/list_view_details';
import { BigQueryService } from './service/bigquery_service';
import { TableDetailsWidget } from '../details_panel/table_details_widget';
import { ViewDetailsWidget } from '../details_panel/view_details_widget';
import { QueryEditorTabWidget } from '../query_editor/query_editor_tab/query_editor_tab_widget';
import { COPIED_AUTOHIDE_DURATION } from '../shared/snackbar';
import { gColor } from '../shared/styles';
import { Context } from './list_tree_panel';

import { Project, Dataset, Table, Model } from './service/list_items';

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
  openSnackbar?: any;
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
  bigQueryService: BigQueryService;
}

export interface ProjectProps extends ResourceProps {
  project: Project;
  updateProject: any;
  updateDataset: any;
  removeProject: any;
  collapseAll?: boolean;
  updateCollapseAll?: any;
  bigQueryService: BigQueryService;
}

interface ResourceState {
  expanded: string[];
  loading: boolean;
}

interface DataTreeItem {
  id: string;
  datasetId: string;
  name: string;
  type: QueryType;
  legacySql?: boolean;
}

export class Resource<T extends ResourceProps> extends React.Component<
  T,
  ResourceState
> {
  constructor(props) {
    super(props);
  }

  copyID = dataTreeItem => {
    this.props.openSnackbar({
      message: 'ID copied',
      autoHideDuration: COPIED_AUTOHIDE_DURATION,
    });
    Clipboard.copyToSystem(dataTreeItem.id);
  };

  copyBoilerplateQuery = dataTreeItem => {
    this.props.openSnackbar({
      message: 'Query copied',
      autoHideDuration: COPIED_AUTOHIDE_DURATION,
    });
    Clipboard.copyToSystem(getStarterQuery(dataTreeItem.type, dataTreeItem.id));
  };

  queryResource = (dataTreeItem: DataTreeItem): void => {
    const notebookTrack = this.props.context.notebookTrack as INotebookTracker;
    const query = getStarterQuery(
      dataTreeItem.type,
      dataTreeItem.id,
      dataTreeItem.legacySql
    );

    const curWidget = notebookTrack.currentWidget;

    const incellEnabled = WidgetManager.getInstance().getIncellEnabled();

    if (!incellEnabled || !curWidget || !curWidget.content.isVisible) {
      // no active notebook or not visible
      const queryId = generateQueryId();
      WidgetManager.getInstance().launchWidget(
        QueryEditorTabWidget,
        'main',
        queryId,
        undefined,
        [queryId, query, dataTreeItem.legacySql]
      );
    } else {
      // exist notebook and visible
      const notebook = curWidget.content;
      NotebookActions.insertBelow(notebook);
      const cell = notebookTrack.activeCell;
      const code =
        `%%bigquery_editor ${
          dataTreeItem.legacySql ? '--use_legacy_sql' : ''
        }\n\n` + query;
      cell.model.value.text = code;
    }
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
    event && event.stopPropagation();
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
      label: 'Open model details',
      handler: dataTreeItem => this.openModelDetails(null, dataTreeItem),
    },
    {
      label: 'Query model',
      handler: dataTreeItem => this.queryResource(dataTreeItem),
    },
    {
      label: 'Copy model ID',
      handler: dataTreeItem => this.copyID(dataTreeItem),
    },
    {
      label: 'Copy boilerplate query',
      handler: dataTreeItem => this.copyBoilerplateQuery(dataTreeItem),
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

  openTableDetails = (event, table: Table) => {
    event && event.stopPropagation();
    const service = new TableDetailsService();
    const widgetType = TableDetailsWidget;
    this.props.context.manager.launchWidgetForId(
      table.id,
      widgetType,
      service,
      table.id,
      table.name,
      table.partitioned
    );
  };

  openViewDetails = (event, view) => {
    event && event.stopPropagation();
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
      label: 'Open table details',
      handler: dataTreeItem => this.openTableDetails(null, dataTreeItem),
    },
    {
      label: 'Query table',
      handler: dataTreeItem => this.queryResource(dataTreeItem),
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
      label: 'Open view details',
      handler: dataTreeItem => this.openViewDetails(null, dataTreeItem),
    },
    {
      label: 'Query view',
      handler: dataTreeItem => this.queryResource(dataTreeItem),
    },
    {
      label: 'Copy view ID',
      handler: dataTreeItem => this.copyID(dataTreeItem),
    },
    {
      label: 'Copy boilerplate query',
      handler: dataTreeItem => this.copyBoilerplateQuery(dataTreeItem),
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
      loading: false,
    };
  }

  expandDataset = dataset => {
    this.getDatasetChildren(dataset, this.props.bigQueryService);
  };

  private async getDatasetChildren(dataset, bigQueryService: BigQueryService) {
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
      const tablesResult =
        bigQueryService
        .listTables(dataset.projectId, dataset.name)
        .then((data: Dataset) => {
          newDataset.tables = data.tables;
          newDataset.tableIds = data.tableIds;
        });

      const modelsResult =
        bigQueryService
        .listModels(dataset.projectId, dataset.name)
        .then((data: Dataset) => {
          newDataset.models = data.models;
          newDataset.modelIds = data.modelIds;
        });

      await tablesResult;
      await modelsResult;
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
      label: 'Open dataset details',
      handler: dataTreeItem => this.openDatasetDetails(null, dataTreeItem),
    },
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
                <Icon className={localStyles.resourceIcons}>
                  <div className={`jp-Icon jp-Icon-20 ${ICONS.dataset}`} />
                </Icon>
                <div className={localStyles.resourceName}>{dataset.name}</div>
              </div>
            </ContextMenu>
          }
          onDoubleClick={event => this.openDatasetDetails(event, dataset)}
          onLabelClick={event => event.preventDefault()}
          onIconClick={() => this.handleExpandDataset(dataset)}
          style={{ width: '100%' }}
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
                    openSnackbar={this.props.openSnackbar}
                  />
                </div>
              ))}
              {dataset.modelIds.map(modelId => (
                <div key={modelId}>
                  <ModelResource
                    context={this.props.context}
                    model={dataset.models[modelId]}
                    openSnackbar={this.props.openSnackbar}
                  />
                </div>
              ))}
            </ul>
          ) : (
            <CircularProgress
              size={20}
              className={localStyles.circularProgress}
              style={{ color: gColor('BLUE') }}
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

  handleOpenSnackbar = error => {
    this.props.openSnackbar({ message: error });
  };

  expandProject = project => {
    this.getDatasets(project, this.props.bigQueryService);
  };

  async getDatasets(project: Project, bigQueryService: BigQueryService) {
    const newProject = {
      id: project.id,
      name: project.name,
    };
    try {
      this.setState({ loading: true });
      await bigQueryService.listDatasets(project).then((data: Project) => {
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
                  openSnackbar={this.props.openSnackbar}
                  bigQueryService={this.props.bigQueryService}
                />
              </div>
            ))
          ) : project.error ? (
            <div>{project.error}</div>
          ) : (
            <CircularProgress
              size={20}
              className={localStyles.circularProgress}
              style={{ color: gColor('BLUE') }}
            />
          )}
        </TreeItem>
      </TreeView>
    );
  }
}
