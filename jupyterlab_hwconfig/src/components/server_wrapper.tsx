/**
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { ServerConnection } from '@jupyterlab/services';
import { Details } from '../data/data';

export class ServerWrapper {
  private readonly serverSettings: ServerConnection.ISettings;
  private readonly url: string;
  constructor(
    serverSettings: ServerConnection.ISettings = ServerConnection.defaultSettings
  ) {
    this.serverSettings = serverSettings;
    this.url = this.serverSettings.baseUrl + `gcp/v1/details`;
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
