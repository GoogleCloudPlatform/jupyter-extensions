import { ServerConnection } from '@jupyterlab/services';
import { URLExt } from '@jupyterlab/coreutils';

export interface ViewDetailsObject {
  id: string;
  name: string;
  description: string;
  labels: string[];
  date_created: string;
  expires: string;
  last_modified: string;
  project: string;
  link: string;
  query: string;
  legacy_sql: string;
}

export interface ViewDetails {
  details: ViewDetailsObject;
}

export class ViewDetailsService {
  async listViewDetails(viewId: string): Promise<ViewDetails> {
    return new Promise((resolve, reject) => {
      const serverSettings = ServerConnection.makeSettings();
      const requestUrl = URLExt.join(
        serverSettings.baseUrl,
        'bigquery/v1/viewdetails'
      );
      const body = { viewId: viewId };
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
            details: content.details,
          });
        });
      });
    });
  }
}
