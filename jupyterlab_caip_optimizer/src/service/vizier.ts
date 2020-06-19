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

/* eslint-disable @typescript-eslint/camelcase */
import { ServerConnection } from '@jupyterlab/services';

import {
    handleApiError,
    TransportService,
    GET,
    POST,
  } from 'gcp-jupyterlab-shared';

const AI_PLATFORM = 'https://ml.googleapis.com/v1';

export interface StudyConfig {
    // TODO: set interface for study config. below taken from Optimizer documentation
    // metrics: [
    //     {
    //       object (MetricSpec)
    //     }
    //   ],
    //   parameters: [
    //     {
    //       object (ParameterSpec)
    //     }
    //   ],
    //   algorithm: enum (Algorithm),
    //   automatedStoppingConfig: {
    //     object (AutomatedStoppingConfig)
    //   }
}

export interface Study {
    // TODO: set interface for Study
    // name: string,
    // studyConfig: StudyConfig,
    // state: enum (State),
    // createTime: string,
    // inactiveReason: string
}

/**
 * Class to interact with Vizier
 */
export class VizierService {
    private readonly serverSettings = ServerConnection.defaultSettings;
    private readonly runtimeUrl = `${this.serverSettings.baseUrl}gcp/v1/runtime`;

    constructor(
        private _transportService: TransportService;
    ) {}

    set transportService(transportService: TransportService) {
      this._transportService = transportService;
    }

    async defaultAPICall(requestUrl: string): Promise<string> {
      try {
        const response = await ServerConnection.makeRequest(
          this.runtimeUrl.concat(requestUrl),
          { method: GET },
          this.serverSettings
        );
        return await response.text();
      } catch (err) {
        console.warn('Unable to process API call');
        return '';
      }
    }

}