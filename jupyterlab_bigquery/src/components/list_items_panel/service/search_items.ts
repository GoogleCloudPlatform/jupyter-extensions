import { ServerConnection } from '@jupyterlab/services';
import { URLExt } from '@jupyterlab/coreutils';

export interface SearchResults {
  searchResults: SearchResult[];
}

export interface SearchResult {
  type: string;
  parent: string;
  id: string;
  name: string;
}

export class SearchProjectsService {
  async searchProjects(
    searchKey: string,
    projectId: string
  ): Promise<SearchResults> {
    return new Promise((resolve, reject) => {
      const serverSettings = ServerConnection.makeSettings();
      const requestUrl = URLExt.join(
        serverSettings.baseUrl,
        'bigquery/v1/search'
      );
      const body = { searchKey: searchKey, projectId: projectId };
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
            searchResults: content.results.map((result: any) => {
              return {
                type: result.type,
                parent: result.parent,
                id: result.id,
                name: result.name,
              };
            }),
          });
        });
      });
    });
  }
}
