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
  CLOUD_FUNCTION_NAME,
  CLOUD_FUNCTION_REGION,
  IMPORT_DIRECTORY,
} from '../data';
import { ProjectStateService } from './project_state';
import {
  handleApiError,
  TransportService,
  GET,
  POST,
} from 'gcp_jupyterlab_shared';
import { IDocumentManager } from '@jupyterlab/docmanager';
import { Notebook } from '@jupyterlab/notebook';

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
  acceleratorType: string;
  acceleratorCount: string;
}

/** List of Jobs returned from AI Platform. */
export type ListAiPlatformJobsResponse = gapi.client.ml.GoogleCloudMlV1__ListJobsResponse;

/** Enum to represent the type of the JobRow */
export enum JobRowType {
  SCHEDULED = 'SCHEDULED',
  IMMEDIATE = 'IMMEDIATE'
}

export type JobState =
    'STATE_UNSPECIFIED'|'ENABLED'|'PAUSED'|'DISABLED'|'UPDATE_FAILED';

/** UI interface used to represent a Scheduled Notebook Job */
export interface ScheduleNotebookJob {
  id?: string;
  jobType: JobRowType;
  name: string;
  schedule: string;
  timeZone?: string;
  createdTime: string;
  aiPlatformJobId: string;
  containerImage: string;
  region: string;
  scaleTier: string;
  machineType?: string;
  acceleratorType?: string;
  acceleratorCount?: string;
  notebook: string;
  serviceAccountEmail?: string;
  state?: JobState;
  status?: string;
  nextScheduledTime?: string;
  lastAttemptTime: string;
}

interface ListLocationsResponse {
  locations?: Array<Location>;
  nextPageToken?: string;
}

interface Location {
  name?: string;
  locationId?: string;
  displayName?: string;
  labels?: ApiClientObjectMap<string>;
  metadata?: ApiClientObjectMap<any>;
}

interface ApiClientObjectMap<T> { [key: string]: T; }

/** AI Platform Job. */
export type AiPlatformJob = gapi.client.ml.GoogleCloudMlV1__Job;

type StorageObject = gapi.client.storage.Object;

const AI_PLATFORM = 'https://ml.googleapis.com/v1';
const CLOUD_SCHEDULER = 'https://cloudscheduler.googleapis.com/v1';
const STORAGE_DOWNLOAD = 'https://storage.googleapis.com/storage/v1';
const STORAGE_UPLOAD = 'https://storage.googleapis.com/upload/storage/v1';
/**
 * Class to interact with GCP services.
 */
export class GcpService {
  private readonly serverSettings = ServerConnection.defaultSettings;
  private readonly runtimeUrl = `${this.serverSettings.baseUrl}gcp/v1/runtime`;

  constructor(
    private _transportService: TransportService,
    private _projectStateService: ProjectStateService,
    private _documentManager: IDocumentManager
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
      const { bucket, object } = this._getGcsPathParts(gcsPath);
      const response = await this._transportService.submit<StorageObject>({
        path: `${STORAGE_UPLOAD}/b/${bucket}/o`,
        method: POST,
        headers: { 'Content-Type': 'application/json' },
        body: notebookContents,
        params: {
          name: object,
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
   * Downloads the notebook located at the gcsPath provided and retrieves the file name from the
   * JSON. Creates a new import directory and attempts to rename it, if it fails then creates
   * the notebook in the already-existing directory and deletes the new directory.
   *
   * @param gcsPath Path to the notebook we want to create.
   */
  async importNotebook(gcsPath: string): Promise<Notebook> {
    const contents = await this.downloadNotebook(gcsPath);

    const retrievedName = JSON.parse(contents)
      .metadata?.papermill?.input_path?.split('/')
      .slice(-1)[0];
    const fileName = retrievedName ? retrievedName : 'untitled.ipynb';

    const newDirectory = await this._documentManager.newUntitled({
      type: 'directory',
    });

    try {
      await this._documentManager.rename(newDirectory.path, IMPORT_DIRECTORY);
    } catch (err) {
      // Expect a 409 error if directory exists. Otherwise throw the error
      if (err.message.indexOf('409') === -1) {
        throw err;
      }
      this._documentManager.deleteFile(newDirectory.path);
    }

    return this.createNotebook(fileName, contents);
  }

  private createNotebook(fileName: string, contents: string): Notebook {
    const widget = this._documentManager.createNew(
      IMPORT_DIRECTORY + fileName,
      'Notebook'
    ) as Notebook;
    widget.model.fromString(contents);
    return widget;
  }

  async downloadNotebook(gcsPath: string): Promise<string> {
    try {
      const { bucket, object } = this._getGcsPathParts(gcsPath);
      const response = await this._transportService.submit<string>({
        path: `${STORAGE_DOWNLOAD}/b/${bucket}/o/${encodeURIComponent(object)}`,
        params: {
          alt: 'media',
        },
      });
      return typeof response.result === 'string'
        ? response.result
        : JSON.stringify(response.result);
    } catch (err) {
      console.error(`Unable to download Notebook contents at ${gcsPath}`);
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

  /**
   * Gets list of AiPlatformSchedules
   * @param cloudFunctionUrl
   * @param request
   */
  async listSchedules(pageToken?:string): Promise<ListAiPlatformJobsResponse> {
    try{
      const filter = `labels.job_type=${SCHEDULED_JOB_INDICATOR}`;
      const projectId = await this.projectId;
      const location = await this._getSchedulerLocation();
      const params: { [k: string]: string } = { filter };
      if (pageToken) {
        params['pageToken'] = pageToken;
      }
      const response = await this._transportService.submit<
        ListAiPlatformJobsResponse
      >({
        path: `${AI_PLATFORM}/projects/${projectId}/locations/${location}/jobs`,
        params,
      });
      return response.result;
    } catch (err) {
      console.error('Unable to list AI Platform Notebook schedules');
      handleApiError(err);
    }
  }

  private async _getSchedulerLocation(): Promise<string> {
    try {
      const projectId = await this.projectId;
      const params: { [k: string]: string } = {};
      const response = await this._transportService.submit<
      ListLocationsResponse
      >({
        path: `${AI_PLATFORM}/projects/${projectId}/locations`,
        params,
      });
      return response.result.locations![0].name!;
    } catch (err) {
      console.error('Unable to get scheduler location');
      handleApiError(err);
    }
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
        masterConfig: {
          imageUri: request.imageUri,
          acceleratorConfig: {
            count: request.acceleratorCount || undefined,
            type: request.acceleratorType || undefined,
          },
        },
        masterType: request.masterType || undefined,
        region: request.region,
        scaleTier: request.scaleTier,
      },
    } as AiPlatformJob;
  }

  private _getGcsPathParts(
    gcsPath: string
  ): { bucket: string; object: string } {
    if (gcsPath.startsWith('gs://')) {
      gcsPath = gcsPath.slice(5);
    }
    const pathParts = gcsPath.split('/');
    return {
      bucket: pathParts[0],
      object: pathParts.slice(1).join('/'),
    };
  }
}
