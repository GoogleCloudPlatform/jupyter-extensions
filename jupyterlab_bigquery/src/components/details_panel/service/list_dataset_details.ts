import { ServerConnection } from '@jupyterlab/services';
import { URLExt } from '@jupyterlab/coreutils';

export interface DatasetDetailsObject {
  id: string;
  name: string;
  description: string;
  labels: string[];
  date_created: string;
  default_expiration: number;
  location: string;
  last_modified: string;
  project: string;
  link: string;
}

export interface DatasetDetails {
  details: DatasetDetailsObject;
}

export class DatasetDetailsService {
  async listDatasetDetails(datasetId: string): Promise<DatasetDetails> {
    return new Promise((resolve, reject) => {
      const serverSettings = ServerConnection.makeSettings();
      const requestUrl = URLExt.join(
        serverSettings.baseUrl,
        'bigquery/v1/datasetdetails'
      );
      const body = { datasetId: datasetId };
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
