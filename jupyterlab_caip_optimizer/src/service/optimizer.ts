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
  ApiRequest,
  ApiResponse,
  TransportService,
  GET,
  POST,
} from 'gcp_jupyterlab_shared';
import { StateDB } from '@jupyterlab/coreutils';
import { Study, MetadataFull, MetadataRequired } from '../types';

const AI_PLATFORM = 'https://ml.googleapis.com/v1';

function zoneToRegion(zone: string): string {
  const divider = '-';
  const region = zone
    .split(divider)
    .slice(0, 2)
    .join(divider);
  return region;
}

/**
 * Class to interact with Optimizer
 */
export class OptimizerService {
  private readonly serverSettings = ServerConnection.defaultSettings;

  constructor(
    private _transportService: TransportService,
    public projectID: string, // TODO: clarify - right way to get projectID?
    public location: string // TODO: clarify - right way to get location?
  ) {}

  set transportService(transportService: TransportService) {
    this._transportService = transportService;
  }

  async getMetaData(): Promise<MetadataRequired> {
    const metadata_path = `${this.serverSettings.baseUrl}gcp/v1/metadata`;

    const response = await this._transportService.submit<MetadataFull>({
      path: metadata_path,
      method: 'GET',
    });
    const metadata_response: MetadataRequired = {
      projectId: response.result.project,
      region: zoneToRegion(response.result.zone),
    };
    return metadata_response;
  }

  async createStudy(study: Study, metadata: MetadataRequired): Promise<Study> {
    const body = JSON.stringify(study);
    const response = await this._transportService.submit<Study>({
      path: `${this.serverSettings.baseUrl}gcp/v1/projects/${metadata.projectId}/locations/${metadata.region}/studies?study_id=${study.name}`,
      method: 'POST',
      body,
    });
    return response.result;
  }

  async listStudy(metadata: MetadataRequired): Promise<Study[]> {
    const response = await this._transportService.submit<Study[]>({
      path: `${this.serverSettings.baseUrl}gcp/v1/projects/${metadata.projectId}/locations/${metadata.region}/studies`,
      method: 'GET',
    });
    return response.result;
  }
}
