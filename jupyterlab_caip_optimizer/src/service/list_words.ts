import { ServerConnection } from '@jupyterlab/services';
import { URLExt } from '@jupyterlab/coreutils';

export interface Word {
  id: number;
  word: string;
}

export interface Words {
  words: Word[];
}

export class ListWordsService {
  async listWords(num_items: number): Promise<Words> {
    return new Promise((resolve, reject) => {
      const serverSettings = ServerConnection.makeSettings();
      const requestUrl = URLExt.join(
        serverSettings.baseUrl,
        'optimizer/v1/list'
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
            words: content.words.map((w: any) => {
              return {
                id: w.id,
                word: w.name,
              };
            }),
          });
        });
      });
    });
  }
}
