import { ServerConnection } from '@jupyterlab/services';
import { URLExt } from '@jupyterlab/coreutils';
import ServiceBase from './ServiceBase';

export interface QueryResult {
  content: Array<Array<unknown>>;
  labels: Array<string>;
}

export const QUERY_HANDLER_ENDPOINT = 'query';

export class QueryService extends ServiceBase {
  async query(
    query: string,
    jobConfig?: Record<string, unknown>
  ): Promise<QueryResult> {
    return new Promise((resolve, reject) => {
      const serverSettings = ServerConnection.makeSettings();
      const requestUrl = URLExt.join(
        serverSettings.baseUrl,
        'bigquery/v1/' + QUERY_HANDLER_ENDPOINT
      );

      const body = {
        query,
        jobConfig: jobConfig === undefined ? {} : jobConfig,
      };

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
          const err = content.error;
          if (err !== undefined) {
            console.error(err);
            reject(err);
            return;
          }

          for (const key in content) {
            content[key] = JSON.parse(content[key]);
          }

          resolve(content);
        });
      });
    });
  }
}
