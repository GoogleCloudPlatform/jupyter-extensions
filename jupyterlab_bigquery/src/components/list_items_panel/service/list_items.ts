// import { ServerConnection } from '@jupyterlab/services';
// import { URLExt } from '@jupyterlab/coreutils';
import { requestAPI } from './api_request';

export interface DataTree {
  projects: {};
  projectIds: [];
}

export interface Project {
  id: string;
  name: string;
  datasets: {};
  datasetIds: [];
}

export interface Dataset {
  id: string;
  name: string;
  tables: {};
  tableIds: [];
  models: {};
  modelIds: [];
  projectId: string;
}

export interface Table {
  id: string;
  name: string;
  datasetId: string;
}

export interface Model {
  id: string;
}

export class ListProjectsService {
  async listProjects(params: number): Promise<DataTree> {
    const body = { params: params };
    const requestInit: RequestInit = {
      body: JSON.stringify(body),
      method: 'POST',
    };
    const data = await requestAPI<DataTree>('v1/listProjects', requestInit);
    const fetchedProjects = {};
    for (const project in data.projects) {
      fetchedProjects[project] = data.projects[project];
    }

    return {
      projects: fetchedProjects,
      projectIds: data.projectIds,
    };
  }
}

export class ListDatasetsService {
  async listDatasets(project: Project): Promise<Project> {
    const body = { projectId: project.id };
    const requestInit: RequestInit = {
      body: JSON.stringify(body),
      method: 'POST',
    };
    const data = await requestAPI<Project>('v1/listDatasets', requestInit);
    const fetchedDatasets = {};
    for (const dataset in data.datasets) {
      fetchedDatasets[dataset] = data.datasets[dataset];
    }
    return {
      ...project,
      datasets: fetchedDatasets,
      datasetIds: data.datasetIds,
    };
  }
}

export class ListTablesService {
  async listTables(datasetId: string): Promise<Dataset> {
    const body = { datasetId: datasetId };
    const requestInit: RequestInit = {
      body: JSON.stringify(body),
      method: 'POST',
    };
    const data = await requestAPI<Dataset>('v1/listTables', requestInit);
    return data;
  }
}

export class ListModelsService {
  async listModels(datasetId: string): Promise<Model[]> {
    const body = { datasetId: datasetId };
    const requestInit: RequestInit = {
      body: JSON.stringify(body),
      method: 'POST',
    };
    const data = await requestAPI<Model[]>('v1/listModels', requestInit);
    return data;
  }
}
