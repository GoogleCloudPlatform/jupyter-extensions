import { ServerConnection } from '@jupyterlab/services';
import { URLExt } from '@jupyterlab/coreutils';

export interface TableDetailsObject {
  id: string;
  name: string;
  description: string;
  labels: string[];
  date_created: string;
  expiration: string;
  location: string;
  last_modified: string;
  project: string;
  dataset: string;
  link: string;
  num_rows: number;
  num_bytes: number;
  schema: SchemaField[];
}

export interface SchemaField {
  name: string;
  type: string;
  mode: string;
  description: string;
}

export interface TableDetails {
  details: TableDetailsObject;
}

export interface TablePreview {
  rows: any[];
  fields: string[];
}

export class TableDetailsService {
  async listTableDetails(tableId: string): Promise<TableDetails> {
    return new Promise((resolve, reject) => {
      const serverSettings = ServerConnection.makeSettings();
      const requestUrl = URLExt.join(
        serverSettings.baseUrl,
        'bigquery/v1/tabledetails'
      );
      const body = { tableId: tableId };
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

  async getTablePreview(tableId: string): Promise<TablePreview> {
    return new Promise((resolve, reject) => {
      const serverSettings = ServerConnection.makeSettings();
      const requestUrl = URLExt.join(
        serverSettings.baseUrl,
        'bigquery/v1/tablepreview'
      );
      const body = { tableId: tableId };
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
            fields: content.fields,
            rows: content.rows,
          });
        });
      });
    });
  }
}
