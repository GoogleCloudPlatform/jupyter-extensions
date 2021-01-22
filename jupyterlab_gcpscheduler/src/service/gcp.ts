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
  IMPORT_DIRECTORY,
  AI_PLATFORM_LINK,
  DOWNLOAD_LINK_BASE,
  VIEWER_LINK_BASE,
  BUCKET_LINK_BASE,
  SCHEDULES_DETAILS_LINK,
} from '../data';
import { ProjectStateService } from './project_state';
import {
  handleApiError,
  TransportService,
  GET,
  POST,
  ApiResponse,
} from 'gcp_jupyterlab_shared';
import {
  ExecuteNotebookRequest,
  Buckets,
  Executions,
  Schedules,
  CloudStorageApiBucket,
  CloudStorageApiBuckets,
  Bucket,
  Execution,
  Schedule,
  Operation,
  CreateScheduleResponse,
  CreateExecutionResponse,
  ListSchedulesResponse,
  ListExecutionsResponse,
  NotebooksApiExecution,
  NotebooksApiSchedule,
  NotebooksApiExecutionTemplate,
  NotebooksApiSchedulerAcceleratorConfig,
} from '../interfaces';
import { IDocumentManager } from '@jupyterlab/docmanager';
import { Notebook } from '@jupyterlab/notebook';

export const NOTEBOOKS_API_BASE =
  'https://autopush-notebooks.sandbox.googleapis.com/v1';
const STORAGE = 'https://storage.googleapis.com/storage/v1';
const STORAGE_UPLOAD = 'https://storage.googleapis.com/upload/storage/v1';
const POLL_INTERVAL = 2000;
const POLL_RETRIES = 5;

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
  ): Promise<boolean> {
    try {
      const { bucket, object } = this._getGcsPathParts(gcsPath);
      const response = await this._transportService.submit<
        CloudStorageApiBucket
      >({
        path: `${STORAGE_UPLOAD}/b/${bucket}/o`,
        method: POST,
        headers: { 'Content-Type': 'application/json' },
        body: notebookContents,
        params: {
          name: object,
          uploadType: 'media',
        },
      });
      return response.result ? true : false;
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
        path: `${STORAGE}/b/${bucket}/o/${encodeURIComponent(object)}`,
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
   * @param zone
   * @param schedule
   */
  async scheduleNotebook(
    request: ExecuteNotebookRequest,
    schedule: string
  ): Promise<CreateScheduleResponse> {
    try {
      const projectId = await this.projectId;
      const requestPath = `projects/${projectId}/locations/${request.region}/schedules?schedule_id=${request.name}`;
      const response = await this._transportService.submit<Operation>({
        path: `${NOTEBOOKS_API_BASE}/${requestPath}`,
        method: POST,
        body: this._buildCreateScheduleRequest(request, schedule),
      });
      return await this._pollAndParseOperation(response);
    } catch (err) {
      console.error('Unable to schedule Notebook');
      handleApiError(err);
    }
  }

  /**
   * Submits a Notebook for immediate execution on AI Platform.
   * @param cloudFunctionUrl
   * @param request
   */
  async executeNotebook(
    request: ExecuteNotebookRequest
  ): Promise<CreateExecutionResponse> {
    try {
      const projectId = await this.projectId;
      const requestPath = `projects/${projectId}/locations/${request.region}/executions?execution_id=${request.name}`;
      const response = await this._transportService.submit<Operation>({
        path: `${NOTEBOOKS_API_BASE}/${requestPath}`,
        method: POST,
        body: this._buildCreateExecutionRequest(request),
      });
      return await this._pollAndParseOperation(response);
    } catch (err) {
      console.error('Unable to execute Notebook');
      handleApiError(err);
    }
  }

  /**
   * Gets list of AiPlatform Executions
   * @param cloudFunctionUrl
   * @param request
   */
  async listExecutions(
    filter = '',
    pageSize?: number,
    pageToken?: string
  ): Promise<Executions> {
    try {
      const projectId = await this.projectId;
      const params: { [k: string]: string } = { filter };
      //TODO: change to createTime when that works
      params['orderBy'] = 'name desc';
      if (pageSize) {
        params['pageSize'] = String(pageSize);
      }
      if (pageToken) {
        params['pageToken'] = pageToken;
      }
      const response = await this._transportService.submit<
        ListExecutionsResponse
      >({
        path: `${NOTEBOOKS_API_BASE}/projects/${projectId}/locations/-/executions`,
        params,
      });
      if (
        response.result &&
        response.result.unreachable &&
        !response.result.executions
      ) {
        throw {
          result: {
            error: {
              status: 'UNREACHABLE',
              message: response.result.unreachable.join(', '),
            },
          },
        };
      }
      return {
        // sort by update time
        executions: (response.result.executions || []).map(execution =>
          this.createExecution(execution, projectId)
        ),
        pageToken: response.result.nextPageToken,
      };
    } catch (err) {
      console.error('Unable to list Notebook Executions');
      handleApiError(err);
    }
  }
  /**
   * Gets list of AiPlatformSchedules
   * @param cloudFunctionUrl
   * @param request
   */
  async listSchedules(
    pageSize?: number,
    pageToken?: string
  ): Promise<Schedules> {
    try {
      const projectId = await this.projectId;
      const params: { [k: string]: string } = {};
      //TODO: change to createTime when that works
      params['orderBy'] = 'name desc';
      if (pageSize) {
        params['pageSize'] = String(pageSize);
      }
      if (pageToken) {
        params['pageToken'] = pageToken;
      }
      const response = await this._transportService.submit<
        ListSchedulesResponse
      >({
        path: `${NOTEBOOKS_API_BASE}/projects/${projectId}/locations/-/schedules`,
        params,
      });
      const schedules = [];
      if (
        response.result &&
        response.result.unreachable &&
        !response.result.schedules
      ) {
        throw {
          result: {
            error: {
              status: 'UNREACHABLE',
              message: response.result.unreachable.join(', '),
            },
          },
        };
      }
      if (response.result && response.result.schedules) {
        const promises: Promise<Execution>[] = [];
        for (const notebooksApiSchedule of response.result.schedules) {
          promises.push(
            this.getLatestExecutionForSchedule(notebooksApiSchedule.displayName)
          );
        }
        await Promise.all(promises).then(values => {
          for (let i = 0; i < response.result.schedules.length; i += 1) {
            schedules.push(
              this.createSchedule(
                response.result.schedules[i],
                projectId,
                values[i]
              )
            );
          }
        });
      }
      return {
        //TODO: sort by update time
        schedules,
        pageToken: response.result.nextPageToken,
      };
    } catch (err) {
      console.error('Unable to list Notebook Schedules');
      handleApiError(err);
    }
  }

  async getImageUri(): Promise<string> {
    const runtimeEnv = await this._getRuntimeEnv();
    return !runtimeEnv || runtimeEnv === 'unknown' ? '' : runtimeEnv;
  }

  async createUniformAccessBucket(name: string): Promise<Bucket> {
    try {
      const params: { [k: string]: string } = {};
      params['project'] = await this.projectId;
      const response = await this._transportService.submit<
        CloudStorageApiBucket
      >({
        path: `${STORAGE}/b`,
        params,
        method: POST,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          iamConfiguration: {
            uniformBucketLevelAccess: {
              enabled: true,
            },
          },
        }),
      });
      if (!response.result.id) {
        throw 'Unable to create bucket';
      }
      return this.createBucket(response.result);
    } catch (err) {
      console.error('Unable to list Cloud Storage CloudStorageApiBuckets');
      handleApiError(err);
    }
  }

  async listBuckets(): Promise<Buckets> {
    try {
      const params: { [k: string]: string } = {};
      params['project'] = await this.projectId;
      params['projection'] = 'noACL';
      const response = await this._transportService.submit<
        CloudStorageApiBuckets
      >({
        path: `${STORAGE}/b`,
        params,
      });
      return {
        buckets: (response.result.items || []).map(item =>
          this.createBucket(item)
        ),
      };
    } catch (err) {
      console.error('Unable to list Cloud Storage CloudStorageApiBuckets');
      handleApiError(err);
    }
  }

  // This catches all errors to prevent a Promise.all from failing.
  private async getLatestExecutionForSchedule(
    scheduleId: string
  ): Promise<Execution | undefined> {
    try {
      const latestExecutionResponse = await this.listExecutions(
        `execution_template.labels.schedule_id="${scheduleId}"`,
        undefined,
        undefined
      );
      if (latestExecutionResponse.executions.length !== 0) {
        return latestExecutionResponse.executions[0];
      }
    } catch (err) {
      console.log('Unable to find executions for schedule id ', scheduleId);
    }
    return undefined;
  }

  private async _pollAndParseOperation(response: ApiResponse<Operation>) {
    if (response.result.error) {
      return {
        error: `${response.result.error.code}: ${response.result.error.message}`,
      };
    }
    if (!response.result.done) {
      const operationName = response.result.name;
      const pollOperationsResponse = await this._pollOperation(
        `${NOTEBOOKS_API_BASE}/${operationName}`
      );
      if (pollOperationsResponse.error) {
        return {
          error: `${pollOperationsResponse.error.code}: ${pollOperationsResponse.error.message}`,
        };
      }
    }
    return {};
  }

  //TODO: Refactor into a common library
  /** Polls the provided Operation at 1s intervals until it has completed. */
  private async _pollOperation(path: string): Promise<Operation> {
    let attempt = 0;
    return new Promise((resolve, reject) => {
      const interval = setInterval(async () => {
        try {
          const response = await this._transportService.submit<Operation>({
            path,
          });
          const { result } = response;
          if (!result.done) {
            console.info(
              `Operation ${path} is still running, polling again in ${POLL_INTERVAL /
                1000}s`
            );
            return;
          }

          clearInterval(interval);
          if (result.response) {
            resolve(result);
          } else {
            console.error(`Error returned from Operation ${path}`);
            // Build a response compatible with handleApiError
            const errorResponse = {
              result: {
                error: result.error,
              },
            };
            reject(errorResponse);
          }
        } catch (err) {
          if (++attempt === POLL_RETRIES) {
            console.error(
              `Unable to retrieve Operation status from ${path} after ${attempt} attempts`
            );
            clearInterval(interval);
            reject(err);
          }
        }
      }, POLL_INTERVAL);
    });
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

  private _buildCreateExecutionRequest(
    request: ExecuteNotebookRequest
  ): NotebooksApiExecution {
    return {
      description: 'Execution for ' + request.name,
      executionTemplate: {
        scaleTier: request.scaleTier,
        masterType: this.convertEmptyStringToUndefined(request.masterType),
        acceleratorConfig:
          request.scaleTier === 'CUSTOM'
            ? ({
                type: this.convertEmptyStringToUndefined(
                  request.acceleratorType
                ),
                coreCount: this.convertEmptyStringToUndefined(
                  request.acceleratorCount
                ),
              } as NotebooksApiSchedulerAcceleratorConfig)
            : undefined,
        inputNotebookFile: request.inputNotebookGcsPath,
        outputNotebookFolder: request.outputNotebookFolder,
        containerImageUri: request.imageUri,
      } as NotebooksApiExecutionTemplate,
    };
  }

  private _buildCreateScheduleRequest(
    request: ExecuteNotebookRequest,
    cronSchedule: string
  ): NotebooksApiSchedule {
    let timeZone = 'America/New_York';
    try {
      timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch (err) {
      console.warn('Unable to determine timezone');
    }
    return {
      description: 'Schedule for ' + request.name,
      cronSchedule,
      timeZone,
      state: 'STATE_UNSPECIFIED',
      executionTemplate: {
        scaleTier: request.scaleTier,
        masterType: this.convertEmptyStringToUndefined(request.masterType),
        acceleratorConfig:
          request.scaleTier === 'CUSTOM'
            ? ({
                type: this.convertEmptyStringToUndefined(
                  request.acceleratorType
                ),
                coreCount: this.convertEmptyStringToUndefined(
                  request.acceleratorCount
                ),
              } as NotebooksApiSchedulerAcceleratorConfig)
            : undefined,
        inputNotebookFile: request.inputNotebookGcsPath,
        outputNotebookFolder: request.outputNotebookFolder,
        containerImageUri: request.imageUri,
      } as NotebooksApiExecutionTemplate,
    };
  }

  private convertEmptyStringToUndefined(value: string) {
    if (!value || value === '') return undefined;
    return value;
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

  private createExecution(
    notebooksApiExecution: NotebooksApiExecution,
    projectId: string
  ): Execution {
    const gcsFile =
      notebooksApiExecution.outputNotebookFile &&
      notebooksApiExecution.outputNotebookFile.slice(5);
    const [bucket, name, ...object] = gcsFile.split('/');
    const encodedObjectPath = [name, ...object]
      .map(p => encodeURIComponent(p))
      .join('/');
    const viewerLink = `${VIEWER_LINK_BASE}/${bucket}/${encodedObjectPath}?project=${projectId}`;
    const downloadLink = `${DOWNLOAD_LINK_BASE}/${gcsFile}`;
    const bucketLink = `${BUCKET_LINK_BASE}/${bucket};tab=permissions`;
    const type =
      notebooksApiExecution.executionTemplate &&
      notebooksApiExecution.executionTemplate.labels &&
      notebooksApiExecution.executionTemplate.labels['schedule_id']
        ? 'Scheduled Execution'
        : 'Execution';
    return {
      id: notebooksApiExecution.name,
      name: notebooksApiExecution.displayName,
      updateTime: notebooksApiExecution.updateTime,
      createTime: notebooksApiExecution.createTime,
      gcsFile,
      state: notebooksApiExecution.state,
      link: `${AI_PLATFORM_LINK}/${notebooksApiExecution.displayName}?project=${projectId}`,
      viewerLink,
      downloadLink,
      type,
      bucketLink,
    };
  }

  private createSchedule(
    notebooksApiSchedule: NotebooksApiSchedule,
    projectId: string,
    latestExecution?: Execution
  ): Schedule {
    // TODO: view latest execution
    // TODO: need output file?
    const gcsFile =
      notebooksApiSchedule.executionTemplate &&
      notebooksApiSchedule.executionTemplate.inputNotebookFile &&
      notebooksApiSchedule.executionTemplate.inputNotebookFile.slice(5);
    const link = `${SCHEDULES_DETAILS_LINK}/${notebooksApiSchedule.displayName}?project=${projectId}`;
    const downloadLink = `${DOWNLOAD_LINK_BASE}/${gcsFile}`;
    return {
      id: notebooksApiSchedule.name,
      name: notebooksApiSchedule.displayName,
      updateTime: notebooksApiSchedule.updateTime,
      createTime: notebooksApiSchedule.createTime,
      gcsFile: latestExecution?.gcsFile || gcsFile,
      state: notebooksApiSchedule.state,
      link,
      viewerLink: latestExecution?.viewerLink,
      downloadLink: latestExecution?.downloadLink || downloadLink,
      schedule: notebooksApiSchedule.cronSchedule,
      hasExecutions: latestExecution !== undefined,
    };
  }

  private createBucket(bucket: CloudStorageApiBucket): Bucket {
    return {
      name: bucket.id,
      accessLevel: bucket.iamConfiguration?.uniformBucketLevelAccess?.enabled
        ? 'uniform'
        : 'fine',
    };
  }
}
