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

import { CLOUD_FUNCTION_NAME, CLOUD_FUNCTION_REGION, GET, POST } from '../data';
import { ProjectStateService } from './project_state';
import { handleApiError, TransportService } from './transport';

const SERVICE_ACCOUNT_DOMAIN = 'appspot.gserviceaccount.com';
const IMMEDIATE_JOB_INDICATOR = 'jupyterlab_immediate_notebook';
const SCHEDULED_JOB_INDICATOR = 'jupyterlab_scheduled_notebook';

/**
 * Cloud Scheduler Job
 * https://cloud.google.com/scheduler/docs/reference/rest/v1/projects.locations.jobs#Job
 */
export interface CloudSchedulerJob {
  name: string;
  description: string;
  schedule: string;
  timeZone: string;
  httpTarget: {
    body: string;
    headers: { [name: string]: string };
    httpMethod: string;
    uri: string;
    oidcToken: { serviceAccountEmail: string };
  };
}

/** Message type describing an AI Platform training Job */
export interface RunNotebookRequest {
  imageUri: string;
  inputNotebookGcsPath: string;
  jobId: string;
  masterType: string;
  outputNotebookGcsPath: string;
  scaleTier: string;
  region: string;
}

/** List of Jobs returned from AI Platform. */
export type ListAiPlatformJobsResponse = gapi.client.ml.GoogleCloudMlV1__ListJobsResponse;

/** AI Platform Job. */
export type AiPlatformJob = gapi.client.ml.GoogleCloudMlV1__Job;

type StorageObject = gapi.client.storage.Object;

const AI_PLATFORM = 'https://ml.googleapis.com/v1';
const CLOUD_SCHEDULER = 'https://cloudscheduler.googleapis.com/v1';
const STORAGE_UPLOAD = 'https://www.googleapis.com/upload/storage/v1';

/**
 * Class to interact with GCP services.
 */
export class GcpService {
  private readonly serverSettings = ServerConnection.defaultSettings;
  private readonly runtimeUrl = `${this.serverSettings.baseUrl}gcp/v1/runtime`;

  constructor(
    private _transportService: TransportService,
    private _projectStateService: ProjectStateService
  ) {}

  get projectId() {
    return this._projectStateService.projectId;
  }

  set transportService(transportService: TransportService) {
    this._transportService = transportService;
  }

  /**
   * Uploads the specified Notebook JSON representation to the specified path.
   */
  async uploadNotebook(
    notebookContents: string,
    gcsPath: string
  ): Promise<StorageObject> {
    try {
      if (gcsPath.startsWith('gs://')) {
        gcsPath = gcsPath.slice(5);
      }
      const pathParts = gcsPath.split('/');
      const response = await this._transportService.submit<StorageObject>({
        path: `${STORAGE_UPLOAD}/b/${pathParts[0]}/o`,
        method: POST,
        headers: { 'Content-Type': 'application/json' },
        body: notebookContents,
        params: {
          name: pathParts.slice(1).join('/'),
          uploadType: 'media',
        },
      });
      return response.result;
    } catch (err) {
      console.error(`Unable to upload Notebook contents to ${gcsPath}`);
      handleApiError(err);
    }
  }

  /**
   * Submits a Notebook for recurring scheduled execution on AI Platform via a
   * new Cloud Scheduler job.
   * @param request
   * @param regionName
   * @param serviceAccountEmail
   * @param schedule
   */
  async scheduleNotebook(
    request: RunNotebookRequest,
    regionName: string,
    schedule: string
  ): Promise<CloudSchedulerJob> {
    let timeZone = 'America/New_York';
    try {
      timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch (err) {
      console.warn('Unable to determine timezone');
    }

    try {
      const projectId = await this.projectId;
      const locationPrefix = `projects/${projectId}/locations/${regionName}/jobs`;
      const requestBody: CloudSchedulerJob = {
        name: `${locationPrefix}/${request.jobId}`,
        description: SCHEDULED_JOB_INDICATOR,
        schedule,
        timeZone,
        httpTarget: {
          body: btoa(
            JSON.stringify(this._buildAiPlatformJobRequest(request, true))
          ),
          headers: { 'Content-Type': 'application/json' },
          httpMethod: POST,
          oidcToken: {
            serviceAccountEmail: `${projectId}@${SERVICE_ACCOUNT_DOMAIN}`,
          },
          uri: `https://${CLOUD_FUNCTION_REGION}-${projectId}.cloudfunctions.net/${CLOUD_FUNCTION_NAME}`,
        },
      };
      const response = await this._transportService.submit<CloudSchedulerJob>({
        path: `${CLOUD_SCHEDULER}/${locationPrefix}`,
        method: POST,
        body: requestBody,
      });
      return response.result;
    } catch (err) {
      console.error('Unable to create Cloud Scheduler job');
      handleApiError(err);
    }
  }

  /**
   * Submits a Notebook for immediate execution on AI Platform.
   * @param cloudFunctionUrl
   * @param request
   */
  async runNotebook(request: RunNotebookRequest): Promise<AiPlatformJob> {
    try {
      const projectId = await this.projectId;
      const response = await this._transportService.submit<AiPlatformJob>({
        path: `${AI_PLATFORM}/projects/${projectId}/jobs`,
        method: POST,
        body: this._buildAiPlatformJobRequest(request),
      });
      return response.result;
    } catch (err) {
      console.error('Unable to submit Notebook to AI Platform');
      handleApiError(err);
    }
  }

  /**
   * Gets list of AiPlatformJobs
   * @param cloudFunctionUrl
   * @param request
   */
  async listNotebookJobs(
    pageToken?: string
  ): Promise<ListAiPlatformJobsResponse> {
    try {
      const filter = [SCHEDULED_JOB_INDICATOR, IMMEDIATE_JOB_INDICATOR]
        .map(v => `labels.job_type=${v}`)
        .join(' OR ');
      const projectId = await this.projectId;
      const params: { [k: string]: string } = { filter };
      if (pageToken) {
        params['pageToken'] = pageToken;
      }
      const response = await this._transportService.submit<
        ListAiPlatformJobsResponse
      >({
        path: `${AI_PLATFORM}/projects/${projectId}/jobs`,
        params,
      });
      return response.result;
    } catch (err) {
      console.error('Unable to list AI Platform Notebook jobs');
      handleApiError(err);
    }
  }

  async getImageUri(): Promise<string> {
    // TODO need to check if image exist
    const imageUriPrefix = 'gcr.io/deeplearning-platform-release/';
    const runtimeEnv = await this._getRuntimeEnv();
    if (!runtimeEnv) return '';

    const lastDotIndex = runtimeEnv.lastIndexOf('.');
    return `${imageUriPrefix}${runtimeEnv.substr(0, lastDotIndex)}`;
  }

  private async _getRuntimeEnv(): Promise<string> {
    try {
      const response = await ServerConnection.makeRequest(
        this.runtimeUrl,
        { method: GET },
        this.serverSettings
      );
      return await response.text();
    } catch (err) {
      console.warn('Unable to obtain runtime environment');
      return '';
    }
  }

  private _buildAiPlatformJobRequest(
    request: RunNotebookRequest,
    isScheduled = false
  ): AiPlatformJob {
    return {
      jobId: request.jobId,
      labels: {
        job_type: isScheduled
          ? SCHEDULED_JOB_INDICATOR
          : IMMEDIATE_JOB_INDICATOR,
      },
      trainingInput: {
        args: [
          'nbexecutor',
          '--input-notebook',
          request.inputNotebookGcsPath,
          '--output-notebook',
          request.outputNotebookGcsPath,
        ],
        masterConfig: { imageUri: request.imageUri },
        masterType: request.masterType || undefined,
        region: request.region,
        scaleTier: request.scaleTier,
      },
    } as AiPlatformJob;
  }
}
