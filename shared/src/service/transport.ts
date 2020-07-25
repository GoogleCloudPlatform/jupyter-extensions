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

/** Transport layer for API requests to GCP. */
import { ServerConnection } from '@jupyterlab/services';
import { GET } from './data';

/** Request object. */
export interface ApiRequest {
  path: string;
  method?: 'DELETE' | 'GET' | 'POST' | 'PUT' | 'PATCH';
  params?: { [k: string]: any };
  headers?: { [k: string]: any };
  body?: any;
}

/** Response object. */
export interface ApiResponse<T> {
  result: T;
}

/** TransportService interface definition defining a submit method. */
export interface TransportService {
  /** Submit the Google API request and resolve its response. */
  submit<T>(request: ApiRequest): Promise<ApiResponse<T>>;
}

/**
 * Handles any error, and if it's a Google API error, returns a friendlier
 * string.
 * @param err
 */
export function handleApiError(err: any) {
  // Check for Google API Error structure
  // https://cloud.google.com/apis/design/errors#error_codes
  if (err.result && err.result.error) {
    const status = err.result.error.status || err.result.error.code;
    throw `${status}: ${err.result.error.message}`;
  }
  throw err;
}

/**
 * TransportService implementation that proxies all requests to the JupyterLab
 * server.
 */
export class ServerProxyTransportService implements TransportService {
  private readonly serverSettings = ServerConnection.defaultSettings;
  private readonly proxyUrl = `${this.serverSettings.baseUrl}gcp/v1/proxy/`;

  async submit<T>(request: ApiRequest): Promise<ApiResponse<T>> {
    let url = request.path;
    if (request.params) {
      const params = Object.entries(request.params).map(
        ([k, v]) => `${k}=${encodeURIComponent(v)}`
      );
      url += `?${params.join('&')}`;
    }
    // Encode the entire GCP URL when issuing the request to JupyterLab
    const body =
      typeof request.body === 'string'
        ? request.body
        : JSON.stringify(request.body);
    const response = await ServerConnection.makeRequest(
      `${this.proxyUrl}${btoa(url)}`,
      {
        body,
        headers: request.headers,
        method: request.method || GET,
      },
      this.serverSettings
    );
    const responseBody = await response.json();
    if (!response.ok) {
      throw { result: responseBody };
    }
    return { result: responseBody as T };
  }
}

/**
 * TransportService implementation that uses the Gapi client-side library with
 * end-user credentials.
 */
export class ClientTransportService implements TransportService {
  private gapiLoadedPromise: Promise<void>;
  private gapiLoaded = false;
  private authenticatedPromise: Promise<void>;
  private authenticated = false;

  constructor(private clientId: string) {}

  async submit<T>(request: ApiRequest): Promise<ApiResponse<T>> {
    await this.initializeClient();
    return gapi.client.request(request);
  }

  private async _authenticateClient(): Promise<void> {
    try {
      await gapi.client.init({
        clientId: this.clientId,
        scope: 'https://www.googleapis.com/auth/cloud-platform',
      });
    } catch (err) {
      throw `Unable to initialize to Google API client: ${err.details}`;
    }

    if (gapi.auth2.getAuthInstance().isSignedIn.get()) {
      this.authenticated = true;
      return;
    }

    try {
      await gapi.auth2.getAuthInstance().signIn();
    } catch (err) {
      throw `Unable to authenticate to GCP: "${err.error}"`;
    }
    this.authenticated = true;
  }

  private _loadGapi(): Promise<void> {
    return new Promise<void>(resolve => {
      const script = document.createElement('script');
      script.src = 'https://apis.google.com/js/api.js';
      script.type = 'text/javascript';
      script.defer = true;
      script.async = true;
      script.onload = () => {
        gapi.load('client:auth2', () => {
          this.gapiLoaded = true;
          resolve();
        });
      };
      document.body.appendChild(script);
    });
  }

  private async initializeClient(): Promise<void> {
    if (!this.gapiLoaded) {
      if (!this.gapiLoadedPromise) {
        this.gapiLoadedPromise = this._loadGapi();
      }
      // Await and then clear the promise (so it can be retried if rejected)
      try {
        await this.gapiLoadedPromise;
      } finally {
        this.gapiLoadedPromise = undefined;
      }
    }

    if (!this.authenticated) {
      if (!this.authenticatedPromise) {
        this.authenticatedPromise = this._authenticateClient();
      }
      // Await and then clear the promise (so it can be retried if rejected)
      try {
        await this.authenticatedPromise;
      } finally {
        this.authenticatedPromise = undefined;
      }
    }
  }
}
