import { ServerConnection } from '@jupyterlab/services';

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

  async get() {
    try {
      const response = await ServerConnection.makeRequest(
        this.url,
        {},
        this.serverSettings
      );
      if (!response.ok) {
        return { ok: false };
      }
      const data = await response.json();
      return { data, ok: true };
    } catch (e) {
      return { ok: false, err: e };
    }
  }
}
