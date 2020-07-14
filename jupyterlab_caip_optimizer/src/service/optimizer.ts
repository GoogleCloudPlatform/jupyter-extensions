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

import { TransportService, handleApiError } from 'gcp_jupyterlab_shared';
import {
  Study,
  MetadataFull,
  MetadataRequired,
  Trial,
  Measurement,
} from '../types';

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

export function prettifyOperationId(rawOperationId: string): string {
  return rawOperationId.replace(
    /projects\/.+\/locations\/.+\/operations\//,
    ''
  );
}

export function prettifyTrial(rawTrialName: string): string {
  return rawTrialName.replace(
    /projects\/.+\/locations\/.+\/studies\/.+\/trials\//,
    ''
  );
}

/**
 * Class to interact with Optimizer
 */
export class OptimizerService {
  private readonly serverSettings = ServerConnection.defaultSettings;

  constructor(private _transportService: TransportService) {}

  /** TODO: Remove hardcoded values and 'option' parameter before release.
   * Currently implemented this way because of ssh restrictions to GCP */
  async getMetaData(option = 'defaultMetadata'): Promise<MetadataRequired> {
    try {
      if (option === 'defaultMetadata') {
        const metadata_default: MetadataRequired = {
          projectId: 'jupyterlab-interns-sandbox',
          region: 'us-central1',
        };
        return metadata_default;
      }
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
    } catch (err) {
      console.error('Unable to fetch metadata');
      handleApiError(err);
    }
  }

  async createStudy(study: Study, metadata: MetadataRequired): Promise<Study> {
    try {
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
    } catch (err) {
      /** TODO: Add different error messages depending on the HTTP status code.
       * Currently there is no troubleshooting documentation for Optimizer API
       * https://cloud.google.com/ai-platform/optimizer/docs/getting-support
       * https://cloud.google.com/ai-platform/optimizer/docs/reference/rest/v1/projects.locations.studies/create */
      console.error('Unable to create study');
      handleApiError(err);
    }
  }

  async listStudy(metadata: MetadataRequired): Promise<Study[]> {
    try {
      const ENDPOINT = `https://${metadata.region}-ml.googleapis.com/v1`;
      const response = await this._transportService.submit<{
        studies: Study[];
      }>({
        path: `${ENDPOINT}/projects/${metadata.projectId}/locations/${metadata.region}/studies`,
        method: 'GET',
      });
      return response.result.studies;
    } catch (err) {
      console.error('Unable to fetch study list');
      handleApiError(err);
    }
  }

  async deleteStudy(
    rawStudyName: string,
    metadata: MetadataRequired
  ): Promise<boolean> {
    try {
      const ENDPOINT = `https://${metadata.region}-ml.googleapis.com/v1`;
      await this._transportService.submit<undefined>({
        path: `${ENDPOINT}/projects/${metadata.projectId}/locations/${
          metadata.region
        }/studies/${encodeURI(prettifyStudyName(rawStudyName))}`,
        method: 'DELETE',
      });
      return true;
    } catch (err) {
      console.error(`Unable to delete study with name "${rawStudyName}"`);
      handleApiError(err);
    }
  }

  async getStudy(
    rawStudyName: string,
    metadata: MetadataRequired
  ): Promise<Study> {
    try {
      const ENDPOINT = `https://${metadata.region}-ml.googleapis.com/v1`;
      const response = await this._transportService.submit<Study>({
        path: `${ENDPOINT}/projects/${metadata.projectId}/locations/${
          metadata.region
        }/studies/${encodeURI(prettifyStudyName(rawStudyName))}`,
        method: 'GET',
      });
      return response.result;
    } catch (err) {
      console.error(`Unable to fetch study with name "${rawStudyName}"`);
      handleApiError(err);
    }
  }

  // Trials

  /**
   * Lists the trials associated with a study.
   * https://cloud.google.com/ai-platform/optimizer/docs/reference/rest/v1/projects.locations.studies.trials/list
   * @param suggestionCount The number of wanted suggested trials.
   * @param studyName Raw study name.
   * @param metadata The region and project id associated with the study.
   */
  async listTrials(
    studyName: string,
    metadata: MetadataRequired
  ): Promise<Trial[]> {
    try {
      const ENDPOINT = `https://${metadata.region}-ml.googleapis.com/v1`;
      const response = await this._transportService.submit<{
        trials?: Trial[];
      }>({
        path: `${ENDPOINT}/projects/${metadata.projectId}/locations/${
          metadata.region
        }/studies/${encodeURI(prettifyStudyName(studyName))}/trials`,
        method: 'GET',
      });
      if (Array.isArray(response.result.trials)) {
        return response.result.trials;
      } else {
        return [];
      }
    } catch (err) {
      console.error(
        `Unable to fetch trials for study with name "${prettifyStudyName(
          studyName
        )}"`
      );
      handleApiError(err);
    }
  }

  /**
   * Adds one or more trials to a study, with parameter values suggested by AI Platform Optimizer.
   * https://cloud.google.com/ai-platform/optimizer/docs/reference/rest/v1/projects.locations.studies.trials/suggest
   * @param suggestionCount The number of wanted suggested trials.
   * @param studyName Raw study name.
   * @param metadata The region and project id associated with the study.
   * @returns A long-running operation associated with the generation of trial suggestions.
   */
  async suggestTrials(
    suggestionCount: number,
    studyName: string,
    metadata: MetadataRequired
  ): Promise<SuggestTrialOperation> {
    try {
      const ENDPOINT = `https://${metadata.region}-ml.googleapis.com/v1`;
      const response = await this._transportService.submit<
        SuggestTrialOperation
      >({
        path: `${ENDPOINT}/projects/${metadata.projectId}/locations/${
          metadata.region
        }/studies/${encodeURI(prettifyStudyName(studyName))}/trials:suggest`,
        method: 'POST',
        body: { suggestionCount, clientId: 'optimizer-extension' },
      });
      return response.result;
    } catch (err) {
      console.error(
        `Unable to fetch suggested trials for study with name "${prettifyStudyName(
          studyName
        )}"`
      );
      handleApiError(err);
    }
  }

  /**
   * Marks a trial as complete.
   * https://cloud.google.com/ai-platform/optimizer/docs/reference/rest/v1/projects.locations.studies.trials/complete
   * @param trialName Raw trial name.
   * @param studyName Raw study name.
   * @param metadata The region and project id associated with the trial.
   */
  async completeTrial(
    trialName: string,
    studyName: string,
    finalMeasurement: Measurement,
    metadata: MetadataRequired
  ): Promise<Trial> {
    try {
      const ENDPOINT = `https://${metadata.region}-ml.googleapis.com/v1`;
      const response = await this._transportService.submit<Trial>({
        path: `${ENDPOINT}/projects/${metadata.projectId}/locations/${
          metadata.region
        }/studies/${encodeURI(prettifyStudyName(studyName))}/trials/${encodeURI(
          prettifyTrial(trialName)
        )}:complete`,
        method: 'POST',
        body: {
          finalMeasurement,
        },
      });
      return response.result;
    } catch (err) {
      console.error(
        `Unable to complete trial with name "${prettifyTrial(trialName)}"`
      );
      handleApiError(err);
    }
  }

  /**
   * Deletes a trial.
   * https://cloud.google.com/ai-platform/optimizer/docs/reference/rest/v1/projects.locations.studies.trials/delete
   * @param trialName Raw trial name.
   * @param studyName Raw study name.
   * @param metadata The region and project id associated with the trial.
   */
  async deleteTrial(
    trialName: string,
    studyName: string,
    metadata: MetadataRequired
  ): Promise<void> {
    try {
      const ENDPOINT = `https://${metadata.region}-ml.googleapis.com/v1`;
      await this._transportService.submit({
        path: `${ENDPOINT}/projects/${metadata.projectId}/locations/${
          metadata.region
        }/studies/${encodeURI(prettifyStudyName(studyName))}/trials/${encodeURI(
          prettifyTrial(trialName)
        )}`,
        method: 'DELETE',
      });
    } catch (err) {
      console.error(
        `Unable to delete trial with name "${prettifyTrial(trialName)}"`
      );
      handleApiError(err);
    }
  }
}
