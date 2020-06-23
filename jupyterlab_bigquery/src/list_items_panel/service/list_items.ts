import { ServerConnection } from '@jupyterlab/services';
import { URLExt } from '@jupyterlab/coreutils';

export interface Projects {
  projects: Project[];
}

export interface Project {
  id: string;
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
  async listProjects(num_items: number): Promise<Projects> {
    return new Promise((resolve, reject) => {
      const serverSettings = ServerConnection.makeSettings();
      const requestUrl = URLExt.join(
        serverSettings.baseUrl,
        'bigquery/v1/list'
      );
      const body = { num_items: num_items };
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
                datasets: p.datasets,
              };
            }),
          });
        });
      });
    });
  }
}
