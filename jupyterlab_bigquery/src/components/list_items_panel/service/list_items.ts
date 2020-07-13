import { ServerConnection } from '@jupyterlab/services';
import { URLExt } from '@jupyterlab/coreutils';

export interface DataTree {
  projects: Project[];
}

export interface Project {
  id: string;
  name: string;
  datasets: Dataset[];
}

export interface Dataset {
  id: string;
  name: string;
  tables: Table[];
  models: Model[];
}

export interface Table {
  id: string;
  name: string;
}

export interface Model {
  id: string;
}

export class ListProjectsService {
  async listProjects(numItems: number): Promise<DataTree> {
    return new Promise((resolve, reject) => {
      const serverSettings = ServerConnection.makeSettings();
      const requestUrl = URLExt.join(
        serverSettings.baseUrl,
        'bigquery/v1/list'
      );
      const body = { numItems: numItems };
      const requestInit: RequestInit = {
        body: JSON.stringify(body),
        method: 'POST',
      };
      ServerConnection.makeRequest(
        requestUrl,
        requestInit,
        serverSettings
      ).then(response => {
        response.json().then(content => {
          if (content.error) {
            console.error(content.error);
            reject(content.error);
            return [];
          }
          resolve({
            projects: content.projects.map((p: any) => {
              return {
                id: p.id,
                name: p.name,
                datasets: p.datasets,
              };
            }),
          });
        });
      });
    });
  }
}
