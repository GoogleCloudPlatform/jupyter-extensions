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

import { TransportService } from 'gcp_jupyterlab_shared';
import { Study, MetadataFull, MetadataRequired } from '../types';

// const AI_PLATFORM = 'https://ml.googleapis.com/v1';

function zoneToRegion(zone: string): string {
  const divider = '-';
  const region = zone
    .split(divider)
    .slice(0, 2)
    .join(divider);
  return region;
}

export function prettifyStudyName(studyName: string): string {
  // projects/project-name/locations/us-central1/studies/study-name -> study-name
  return studyName.replace(/projects\/.+\/locations\/.+\/studies\//, '');
}

/**
 * Class to interact with Optimizer
 */
export class OptimizerService {
  private readonly serverSettings = ServerConnection.defaultSettings;

  constructor(private _transportService: TransportService) {}

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
    const ENDPOINT = `https://${metadata.region}-ml.googleapis.com/v1`;
    const response = await this._transportService.submit<Study>({
      path: `${ENDPOINT}/projects/${metadata.projectId}/locations/${
        metadata.region
      }/studies?study_id=${encodeURI(study.name)}`,
      method: 'POST',
      body,
    });
    return response.result;
  }

  async listStudy(metadata: MetadataRequired): Promise<Study[]> {
    const ENDPOINT = `https://${metadata.region}-ml.googleapis.com/v1`;
    const response = await this._transportService.submit<{ studies: Study[] }>({
      path: `${ENDPOINT}/projects/${metadata.projectId}/locations/${metadata.region}/studies`,
      method: 'GET',
    });
    return response.result.studies;
  }
}
