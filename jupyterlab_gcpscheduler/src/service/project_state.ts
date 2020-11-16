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
  handleApiError,
  TransportService,
  POST,
  InstanceMetadata,
  getMetadata,
} from 'gcp_jupyterlab_shared';
import {
  CLOUD_FUNCTION_NAME,
  CLOUD_FUNCTION_REGION,
  BUCKET_NAME_SUFFIX,
  removeFromList,
  CLOUD_FUNCTION_ARCHIVE,
} from '../data';

const POLL_INTERVAL = 5000;
const POLL_RETRIES = 3;

interface Service {
  endpoint: string;
  name: string;
  documentation: string;
  isOptional: boolean;
}

interface Function {
  name: string;
  httpsTrigger: { url: string };
  status: string;
}

interface Location {
  name: string;
  locationId: string;
}

interface ListCloudSchedulerLocationsResponse {
  locations: Location[];
}

interface TestIamPermissionsResponse {
  permissions: string[];
}

/** API service status */
export interface ServiceStatus {
  service: Service;
  enabled: boolean;
}

/** Project initialization state. */
export interface ProjectState {
  allServicesEnabled: boolean;
  requiredServicesEnabled: boolean;
  hasGcsBucket: boolean;
  hasCloudFunction: boolean;
  projectId: string;
  schedulerRegion: string;
  serviceStatuses: ServiceStatus[];
  canSubmitImmediateJobs: boolean;
  canSubmitScheduledJobs: boolean;
}

/* Provides list of missing permissions required to perform the action */
export interface GetPermissionsResponse {
  toInitialize: string[];
  toExecute: string[];
  toSchedule: string[];
}

type Operation = gapi.client.servicemanagement.Operation;
type Bucket = gapi.client.storage.Bucket;
type ListServicesResponse = gapi.client.servicemanagement.ListServicesResponse;

const AI_PLATFORM_SERVICE = 'ml.googleapis.com';
const CLOUD_FUNCTIONS = 'https://cloudfunctions.googleapis.com/v1';
const CLOUD_SCHEDULER = 'https://cloudscheduler.googleapis.com/v1';
const CLOUD_STORAGE = 'https://www.googleapis.com/storage/v1';
const SERVICE_MANAGER = 'https://servicemanagement.googleapis.com/v1';
const RESOURCE_MANAGER = 'https://cloudresourcemanager.googleapis.com/v1';

const BUCKET_CREATE_PERMISSION = 'storage.buckets.create';
const OBJECT_CREATE_PERMISSION = 'storage.objects.create';

// Static list of GCP services used by the extension
const SERVICES: ReadonlyArray<Service> = [
  {
    name: 'Cloud Storage API',
    endpoint: 'storage-api.googleapis.com',
    documentation: 'https://cloud.google.com/storage/',
    isOptional: false,
  },
  {
    name: 'AI Platform Training API',
    endpoint: AI_PLATFORM_SERVICE,
    documentation: 'https://cloud.google.com/ai-platform/',
    isOptional: false,
  },
  {
    name: 'Cloud Scheduler API',
    endpoint: 'cloudscheduler.googleapis.com',
    documentation: 'https://cloud.google.com/scheduler',
    isOptional: true,
  },
  {
    name: 'Cloud Build API',
    endpoint: 'cloudbuild.googleapis.com',
    documentation: 'https://cloud.google.com/cloud-build/',
    isOptional: true,
  },
  {
    name: 'Cloud Functions API',
    endpoint: 'cloudfunctions.googleapis.com',
    documentation: 'https://cloud.google.com/functions/',
    isOptional: true,
  },
];

const INITIALIZE_PERMISSIONS: ReadonlySet<string> = new Set([
  'appengine.applications.create',
  'cloudfunctions.functions.create',
  'serviceusage.services.enable',
  BUCKET_CREATE_PERMISSION,
]);
const EXECUTE_PERMISSIONS: ReadonlySet<string> = new Set([
  BUCKET_CREATE_PERMISSION,
  OBJECT_CREATE_PERMISSION,
  'ml.jobs.create',
]);
const SCHEDULE_PERMISSIONS: ReadonlySet<string> = new Set([
  BUCKET_CREATE_PERMISSION,
  OBJECT_CREATE_PERMISSION,
  'cloudscheduler.jobs.create',
]);

/**
 * Determines the state of the project with respect to the two primary features:
 *  1) Immediate execution on AI Platform
 *  2) Recurring scheduled execution on AI Platform via Cloud Scheduler
 */
export class ProjectStateService {
  private projectIdPromise?: Promise<string>;
  private metadataPromise?: Promise<InstanceMetadata>;

  constructor(private _transportService: TransportService, projectId?: string) {
    if (projectId) {
      this.projectIdPromise = Promise.resolve(projectId);
    }
  }

  get projectId() {
    return this._getProject();
  }

  set projectId(projectIdPromise: string | Promise<string>) {
    if (typeof projectIdPromise === 'string') {
      this.projectIdPromise = Promise.resolve(projectIdPromise);
    } else {
      this.projectIdPromise = projectIdPromise;
    }
  }

  set transportService(transportService: TransportService) {
    this._transportService = transportService;
  }

  /**
   * Retrieves all necessary details about the user's project to allow the
   * extension to know whether or not Notebooks can be scheduled.
   */
  async getProjectState(): Promise<ProjectState> {
    try {
      const projectId = await this.projectId;
      const state: ProjectState = {
        allServicesEnabled: false,
        requiredServicesEnabled: false,
        schedulerRegion: '',
        hasGcsBucket: false,
        hasCloudFunction: false,
        projectId,
        serviceStatuses: [],
        canSubmitImmediateJobs: false,
        canSubmitScheduledJobs: false,
      };

      state.serviceStatuses = await this._getServiceStatuses();
      const aiPlatformStatus = state.serviceStatuses.find(
        s => s.service.endpoint === AI_PLATFORM_SERVICE
      );
      state.requiredServicesEnabled = state.serviceStatuses
        .filter(s => !s.service.isOptional)
        .every(s => s.enabled);
      state.allServicesEnabled =
        state.requiredServicesEnabled &&
        state.serviceStatuses.every(s => s.enabled);
      const [
        appEngineLocation,
        hasGcsBucket,
        hasCloudFunction,
      ] = await Promise.all([
        this._getCloudSchedulerLocation().catch(() => ''),
        this._hasGcsBucket().catch(),
        this._hasCloudFunction(CLOUD_FUNCTION_REGION),
      ]);
      state.schedulerRegion = appEngineLocation;
      state.hasGcsBucket = hasGcsBucket;
      state.hasCloudFunction = hasCloudFunction;
      state.canSubmitImmediateJobs =
        aiPlatformStatus && aiPlatformStatus.enabled && hasGcsBucket;
      state.canSubmitScheduledJobs =
        state.allServicesEnabled &&
        hasGcsBucket &&
        hasCloudFunction &&
        !!appEngineLocation;
      return state;
    } catch (err) {
      console.error('Unable to determine project status', err);
      throw err;
    }
  }

  /**
   * Enables each of the services specified returning a Promise for the
   * complete operation.
   */
  async enableServices(serviceNames: string[]): Promise<Operation[]> {
    try {
      const projectId = await this.projectId;
      const pendingOperations = await Promise.all(
        serviceNames.map(s => {
          return this._transportService.submit<Operation>({
            path: `${SERVICE_MANAGER}/services/${s}:enable`,
            method: POST,
            body: { consumerId: `project:${projectId}` },
          });
        })
      );
      return await Promise.all(
        pendingOperations.map(o =>
          this._pollOperation(`${SERVICE_MANAGER}/${o.result.name}`)
        )
      );
    } catch (err) {
      console.error('Unable to enable necessary GCP services');
      handleApiError(err);
    }
  }

  /**
   * Creates a new Cloud Storage Bucket.
   */
  async createBucket(): Promise<Bucket> {
    try {
      const projectId = await this._getProject();
      const bucketName = `${projectId}${BUCKET_NAME_SUFFIX}`;
      const response = await this._transportService.submit<Bucket>({
        path: `${CLOUD_STORAGE}/b`,
        method: POST,
        params: { project: projectId },
        body: {
          name: bucketName,
          versioning: { enabled: true },
        },
      });
      return response.result;
    } catch (err) {
      console.error('Unable to create GCS bucket');
      handleApiError(err);
    }
  }

  /**
   * Creates the necessary Cloud Function in the project.
   */
  async createCloudFunction(regionName: string): Promise<Function> {
    try {
      const projectId = await this.projectId;
      const locationPrefix = `projects/${projectId}/locations/${regionName}/functions`;
      const pendingOperation = await this._transportService.submit<Operation>({
        path: `${CLOUD_FUNCTIONS}/${locationPrefix}`,
        method: POST,
        body: {
          name: `${locationPrefix}/${CLOUD_FUNCTION_NAME}`,
          description: 'Submits a Notebook Job on AI Platform',
          entryPoint: CLOUD_FUNCTION_NAME,
          runtime: 'nodejs10',
          sourceArchiveUrl: CLOUD_FUNCTION_ARCHIVE,
          httpsTrigger: {}, // Needed to indicate http function
        },
      });
      const finishedOperation = await this._pollOperation(
        `${CLOUD_FUNCTIONS}/${pendingOperation.result.name}`
      );
      return finishedOperation.response as Function;
    } catch (err) {
      console.error('Unable to Create Cloud Function');
      handleApiError(err);
    }
  }

  /**
   * Determines the credential's ability to execute the Scheduler functions
   * based on the IAM permissions granted to it.
   */
  async getPermissions(): Promise<GetPermissionsResponse> {
    const permissionsToCheck = new Set<string>();
    const getPermissionsResponse: GetPermissionsResponse = {
      toInitialize: [],
      toExecute: [],
      toSchedule: [],
    };
    const returnedPermissions: string[] = [];

    INITIALIZE_PERMISSIONS.forEach(p => {
      getPermissionsResponse.toInitialize.push(p);
      permissionsToCheck.add(p);
    });
    EXECUTE_PERMISSIONS.forEach(p => {
      getPermissionsResponse.toExecute.push(p);
      permissionsToCheck.add(p);
    });
    SCHEDULE_PERMISSIONS.forEach(p => {
      getPermissionsResponse.toSchedule.push(p);
      permissionsToCheck.add(p);
    });
    const checked = Array.from(permissionsToCheck.values());
    try {
      const projectId = await this._getProject();
      const response = await this._transportService.submit<
        TestIamPermissionsResponse
      >({
        path: `${RESOURCE_MANAGER}/projects/${projectId}:testIamPermissions`,
        method: POST,
        body: {
          permissions: checked,
        },
      });
      returnedPermissions.push(...(response.result.permissions || []));
    } catch (err) {
      console.warn('Could not determine IAM permissions for credential');
      returnedPermissions.push(...checked);
    }
    this._populateGetPermissionsResponse(
      returnedPermissions,
      getPermissionsResponse
    );
    return getPermissionsResponse;
  }

  /** Returns the status of the required services. */
  private async _getServiceStatuses(): Promise<ServiceStatus[]> {
    try {
      const projectId = await this._getProject();
      const response = await this._transportService.submit<
        ListServicesResponse
      >({
        path: `${SERVICE_MANAGER}/services`,
        params: { consumerId: `project:${projectId}`, pageSize: 100 },
      });
      const enabledServices = new Set(
        response.result.services.map(m => m.serviceName)
      );
      return SERVICES.map(service => ({
        service,
        enabled: enabledServices.has(service.endpoint),
      }));
    } catch (err) {
      console.error('Unable to return GCP services');
      handleApiError(err);
    }
  }

  /**
   * Returns the region where the Cloud Scheduler is available, which
   * corresponds to the AppEngine location if it has been created.
   */
  private async _getCloudSchedulerLocation(): Promise<string> {
    try {
      const projectId = await this.projectId;
      const response = await this._transportService.submit<
        ListCloudSchedulerLocationsResponse
      >({
        path: `${CLOUD_SCHEDULER}/projects/${projectId}/locations`,
      });
      if (response.result.locations && response.result.locations.length) {
        return response.result.locations[0].locationId;
      }
      return '';
    } catch (err) {
      console.error('Could not determine Cloud Scheduler location');
      handleApiError(err);
    }
  }

  /**
   * Returns true if the project has the necessary GCS bucket.
   */
  private async _hasGcsBucket(): Promise<boolean> {
    try {
      const projectId = await this.projectId;
      const bucketName = `${projectId}${BUCKET_NAME_SUFFIX}`;
      await this._transportService.submit<Bucket>({
        path: `${CLOUD_STORAGE}/b/${bucketName}`,
      });
      return true;
    } catch (err) {
      console.warn(`GCS Bucket matching *${BUCKET_NAME_SUFFIX} does not exist`);
      return false;
    }
  }

  /**
   * Returns true if the project has the necessary Cloud Function deployed
   * in the given region
   */
  private async _hasCloudFunction(region: string): Promise<boolean> {
    try {
      const projectId = await this.projectId;
      await this._transportService.submit<Function>({
        path: `${CLOUD_FUNCTIONS}/projects/${projectId}/locations/${region}/functions/${CLOUD_FUNCTION_NAME}`,
      });
      return true;
    } catch (err) {
      console.warn(`${CLOUD_FUNCTION_NAME} not found in ${region}`);
      return false;
    }
  }

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

  /**
   * Returns the projectId from the object or tries to retrieve it from the
   * server if not set.
   */
  private async _getProject(): Promise<string> {
    if (this.projectIdPromise) {
      return this.projectIdPromise;
    }
    try {
      const { project } = await this._getMetadata();
      this.projectIdPromise = Promise.resolve(project);
      return this.projectIdPromise;
    } catch (err) {
      console.error('Unable to obtain GCP Project', err);
      throw err;
    }
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

  private _populateGetPermissionsResponse(
    permissions: string[],
    response: GetPermissionsResponse
  ) {
    let hasBucketsCreate = false;
    // Prune any returned permission from the response object's lists
    permissions.forEach(p => {
      if (p === BUCKET_CREATE_PERMISSION) {
        hasBucketsCreate = true;
      }
      const lists = [
        response.toInitialize,
        response.toExecute,
        response.toSchedule,
      ];
      lists.forEach(l => {
        removeFromList(l, p);
      });
    });

    // Project Editor role gives storage.buckets.create and OWNER on all
    // buckets, so if it was returned, clear storage.objects.create from schedule/execute
    if (hasBucketsCreate) {
      removeFromList(response.toExecute, OBJECT_CREATE_PERMISSION);
      removeFromList(response.toSchedule, OBJECT_CREATE_PERMISSION);
    } else {
      removeFromList(response.toExecute, BUCKET_CREATE_PERMISSION);
      removeFromList(response.toSchedule, BUCKET_CREATE_PERMISSION);
    }
  }
}
