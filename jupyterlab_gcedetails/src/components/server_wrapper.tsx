import { ServerConnection } from '@jupyterlab/services';
import { Details } from '../data';

export class ServerWrapper {
  private readonly serverSettings: ServerConnection.ISettings;
  private readonly url: string;
  constructor(
    endpoint: string,
    serverSettings: ServerConnection.ISettings = ServerConnection.defaultSettings
  ) {
    this.serverSettings = serverSettings;
    this.url = this.serverSettings.baseUrl + endpoint;
  }

  async getUtilizationData(): Promise<Details> {
    const response = await ServerConnection.makeRequest(
      this.url,
      {},
      this.serverSettings
    );
    if (!response.ok) {
      throw new Error();
    }
    const data = await response.json();
    return { ...data };
  }
}
