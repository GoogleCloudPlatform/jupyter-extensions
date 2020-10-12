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

import {
  getMetadata,
  TransportService,
  handleApiError,
  InstanceMetadata,
} from 'gcp_jupyterlab_shared';
import {
  Study,
  Trial,
  Measurement,
  Operation,
  SuggestTrialOperation,
} from '../types';
import { createTrialUrl, addMeasurementTrialUrl } from '../utils/urls';

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
 * Class to interact with Vizier
 */
export class VizierService {
  private metadataPromise?: Promise<InstanceMetadata>;

  constructor(private _transportService: TransportService) {}

  private getRegionFromZone(zone: string): string {
    return zone
      .split('/')
      .pop()
      .split('-', 2)
      .join('-');
  }

  /**
   * Retrieves the VM Metadata from the server
   */
  private _getMetadata(): Promise<InstanceMetadata> {
    if (this.metadataPromise) {
      return this.metadataPromise;
    }
    this.metadataPromise = getMetadata().catch(err => {
      console.error('Unable to obtain VM Metadata');
      throw err;
    });
    return this.metadataPromise;
  }

  async createStudy(study: Study): Promise<Study> {
    try {
      const { project, zone } = await this._getMetadata();
      const region = this.getRegionFromZone(zone);
      const body = JSON.stringify(study);
      const ENDPOINT = `https://${region}-ml.googleapis.com/v1`;
      const response = await this._transportService.submit<Study>({
        path: `${ENDPOINT}/projects/${project}/locations/${region}/studies?study_id=${encodeURI(
          study.name
        )}`,
        method: 'POST',
        body,
      });
      return response.result;
    } catch (err) {
      /** TODO: Add different error messages depending on the HTTP status code.
       * Currently there is no troubleshooting documentation for Vizier API
       * https://cloud.google.com/ai-platform/optimizer/docs/getting-support
       * https://cloud.google.com/ai-platform/optimizer/docs/reference/rest/v1/projects.locations.studies/create */
      console.error('Unable to create study');
      console.error(err);
      handleApiError(err);
    }
  }

  async listStudy(): Promise<Study[]> {
    try {
      const { project, zone } = await this._getMetadata();
      const region = this.getRegionFromZone(zone);
      const ENDPOINT = `https://${region}-ml.googleapis.com/v1`;
      const response = await this._transportService.submit<{
        studies: Study[];
      }>({
        path: `${ENDPOINT}/projects/${project}/locations/${region}/studies`,
        method: 'GET',
      });
      return response.result.studies;
    } catch (err) {
      console.error('Unable to fetch study list');
      handleApiError(err);
    }
  }

  async deleteStudy(rawStudyName: string): Promise<boolean> {
    try {
      const { project, zone } = await this._getMetadata();
      const region = this.getRegionFromZone(zone);
      const ENDPOINT = `https://${region}-ml.googleapis.com/v1`;
      await this._transportService.submit<undefined>({
        path: `${ENDPOINT}/projects/${project}/locations/${region}/studies/${encodeURI(
          prettifyStudyName(rawStudyName)
        )}`,
        method: 'DELETE',
      });
      return true;
    } catch (err) {
      console.error(`Unable to delete study with name "${rawStudyName}"`);
      handleApiError(err);
    }
  }

  async getStudy(rawStudyName: string): Promise<Study> {
    try {
      const { project, zone } = await this._getMetadata();
      const region = this.getRegionFromZone(zone);
      const ENDPOINT = `https://${region}-ml.googleapis.com/v1`;
      const response = await this._transportService.submit<Study>({
        path: `${ENDPOINT}/projects/${project}/locations/${region}/studies/${encodeURI(
          prettifyStudyName(rawStudyName)
        )}`,
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
  async listTrials(studyName: string): Promise<Trial[]> {
    try {
      const { project, zone } = await this._getMetadata();
      const region = this.getRegionFromZone(zone);
      const ENDPOINT = `https://${region}-ml.googleapis.com/v1`;
      const response = await this._transportService.submit<{
        trials?: Trial[];
      }>({
        path: `${ENDPOINT}/projects/${project}/locations/${region}/studies/${encodeURI(
          prettifyStudyName(studyName)
        )}/trials`,
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
   * Adds a measurement of the objective metrics to a trial. This measurement is assumed to have been taken before the trial is complete.
   * https://cloud.google.com/ai-platform/optimizer/docs/reference/rest/v1/projects.locations.studies.trials/addMeasurement
   * @param measurement The measurement to add.
   * @param trialName Raw trial name.
   * @param studyName Raw study name.
   * @param metadata The region and project id associated with the trial.
   */
  async addMeasurement(
    measurement: Measurement,
    trialName: string,
    studyName: string
  ): Promise<Trial> {
    try {
      const { project, zone } = await this._getMetadata();
      const region = this.getRegionFromZone(zone);
      const response = await this._transportService.submit<Trial>({
        path: addMeasurementTrialUrl({
          projectId: project,
          region: region,
          cleanStudyName: prettifyStudyName(studyName),
          cleanTrialName: prettifyTrial(trialName),
        }),
        method: 'POST',
        body: { measurement },
      });
      return response.result;
    } catch (err) {
      console.error(
        `Unable to add a measurement to the trial with then name "${prettifyStudyName(
          prettifyTrial(trialName)
        )}"`
      );
      handleApiError(err);
    }
  }

  /**
   * Adds one or more trials to a study, with parameter values suggested by AI Platform Vizier.
   * https://cloud.google.com/ai-platform/optimizer/docs/reference/rest/v1/projects.locations.studies.trials/suggest
   * @param suggestionCount The number of wanted suggested trials.
   * @param studyName Raw study name.
   * @param metadata The region and project id associated with the study.
   * @returns A long-running operation associated with the generation of trial suggestions.
   */
  async suggestTrials(
    suggestionCount: number,
    studyName: string
  ): Promise<SuggestTrialOperation> {
    try {
      const { project, zone } = await this._getMetadata();
      const region = this.getRegionFromZone(zone);
      const ENDPOINT = `https://${region}-ml.googleapis.com/v1`;
      const response = await this._transportService.submit<
        SuggestTrialOperation
      >({
        path: `${ENDPOINT}/projects/${project}/locations/${region}/studies/${encodeURI(
          prettifyStudyName(studyName)
        )}/trials:suggest`,
        method: 'POST',
        body: { suggestionCount, clientId: 'vizier-extension' },
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
   * @param Details The completion details.
   * @param metadata The region and project id associated with the trial.
   */
  async completeTrial(
    trialName: string,
    studyName: string,
    details: {
      finalMeasurement?: Measurement;
      trialInfeasible?: boolean;
      infeasibleReason?: string;
    }
  ): Promise<Trial> {
    try {
      const { project, zone } = await this._getMetadata();
      const region = this.getRegionFromZone(zone);
      const ENDPOINT = `https://${region}-ml.googleapis.com/v1`;
      const response = await this._transportService.submit<Trial>({
        path: `${ENDPOINT}/projects/${project}/locations/${region}/studies/${encodeURI(
          prettifyStudyName(studyName)
        )}/trials/${encodeURI(prettifyTrial(trialName))}:complete`,
        method: 'POST',
        body: {
          finalMeasurement: details.finalMeasurement,
          trialInfeasible: details.trialInfeasible,
          infeasibleReason: details.infeasibleReason,
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
   * Adds a user provided trial to a study.
   * https://cloud.google.com/ai-platform/optimizer/docs/reference/rest/v1/projects.locations.studies.trials/create
   * @param trialName The trial details.
   * @param studyName Raw study name.
   * @param metadata The region and project id associated with the trial.
   */
  async createTrial(trial: Trial, studyName: string): Promise<Trial> {
    try {
      const { project, zone } = await this._getMetadata();
      const region = this.getRegionFromZone(zone);
      const response = await this._transportService.submit<Trial>({
        path: createTrialUrl({
          projectId: project,
          region: region,
          cleanStudyName: prettifyStudyName(studyName),
        }),
        method: 'POST',
        body: trial,
      });
      return response.result;
    } catch (err) {
      console.error(
        `Unable to create trial for study with name "${prettifyStudyName(
          studyName
        )}"`
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
  async deleteTrial(trialName: string, studyName: string): Promise<void> {
    try {
      const { project, zone } = await this._getMetadata();
      const region = this.getRegionFromZone(zone);
      const ENDPOINT = `https://${region}-ml.googleapis.com/v1`;
      await this._transportService.submit({
        path: `${ENDPOINT}/projects/${project}/locations/${region}/studies/${encodeURI(
          prettifyStudyName(studyName)
        )}/trials/${encodeURI(prettifyTrial(trialName))}`,
        method: 'DELETE',
      });
    } catch (err) {
      console.error(
        `Unable to delete trial with name "${prettifyTrial(trialName)}"`
      );
      handleApiError(err);
    }
  }

  // Operations

  /**
   * Gets the latest state of a long-running operation.
   * Clients can use this method to poll the operation result at intervals as recommended by the API service.
   * https://cloud.google.com/ai-platform/optimizer/docs/reference/rest/v1/projects.locations.operations/get
   * @param operationId The full length opeartion id.
   * @param metadata The region and project id associated with the operation.
   */
  async getOperation<BODY = {}, METADATA = {}>(
    operationId: string
  ): Promise<Operation<BODY, METADATA>> {
    try {
      const { project, zone } = await this._getMetadata();
      const region = this.getRegionFromZone(zone);
      const ENDPOINT = `https://${region}-ml.googleapis.com/v1`;
      const response = await this._transportService.submit<
        Operation<BODY, METADATA>
      >({
        path: `${ENDPOINT}/projects/${project}/locations/${region}/operations/${prettifyOperationId(
          operationId
        )}`,
        method: 'GET',
      });
      return response.result;
    } catch (err) {
      console.error(`Unable to fetch operation with id "${operationId}"`);
      handleApiError(err);
    }
  }

  /**
   * Starts asynchronous cancellation on a long-running operation.
   * https://cloud.google.com/ai-platform/optimizer/docs/reference/rest/v1/projects.locations.operations/cancel
   * @param operationId The full length opeartion id.
   * @param metadata The region and project id associated with the operation.
   */
  async cancelOperation(operationId: string): Promise<void> {
    try {
      const { project, zone } = await this._getMetadata();
      const region = this.getRegionFromZone(zone);
      const ENDPOINT = `https://${region}-ml.googleapis.com/v1`;
      await this._transportService.submit({
        path: `${ENDPOINT}/projects/${project}/locations/${region}/operations/${prettifyOperationId(
          operationId
        )}:cancel`,
        method: 'POST',
      });
    } catch (err) {
      console.error(`Unable to cancel operation with id "${operationId}"`);
      handleApiError(err);
    }
  }
}
