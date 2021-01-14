import { requestAPI } from './api_request';

export interface DataTree {
  projects: { [key: string]: Project };
  projectIds: string[];
}

export interface Project {
  id: string;
  name: string;
  datasets?: {};
  datasetIds?: string[];
  error?: string;
}

export interface Dataset {
  id: string;
  name: string;
  tables: {};
  tableIds: string[];
  models: {};
  modelIds: string[];
  projectId: string;
  parent: string;
  type: string;
}

export interface Table {
  id: string;
  name: string;
  type: string;
  datasetId: string;
  parent: string;
  partitioned: boolean;
}

export interface Model {
  id: string;
  name: string;
  datasetId: string;
  parent: string;
  type: string;
}

export class ListProjectsService {
  async listProjects(projectId: string): Promise<DataTree> {
    const body = { projectId: projectId };
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

export class GetProjectService {
  async getProject(projectId: string): Promise<Project> {
    const body = { projectId: projectId };
    const requestInit: RequestInit = {
      body: JSON.stringify(body),
      method: 'POST',
    };
    const data = await requestAPI<Project>('v1/getProject', requestInit);
    return data;
  }
}
