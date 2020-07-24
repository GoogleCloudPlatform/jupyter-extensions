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
  PATCH,
  InstanceMetadata,
  getMetadata,
} from 'gcp_jupyterlab_shared';

const POLL_INTERVAL = 5000;
const POLL_RETRIES = 3;

interface Service {
  endpoint: string;
  name: string;
  documentation: string;
  isOptional: boolean;
}

interface AcceleratorConfig {
  type: string;
  coreCount: string;
}

export interface Instance {
  name: string;
  state?: string;
  machineType?: string;
  acceleratorConfig?: AcceleratorConfig;
}

/** Service wrapper state corresponding to a Notebook Instance. */
export interface State {
  serviceEnabled: boolean;
  projectId: string;
  instanceName: string;
  locationId: string;
}

/** API service status */
export interface ServiceStatus {
  service: Service;
  enabled: boolean;
}

export const NOTEBOOKS_API_SERVICE: Readonly<Service> = {
  name: 'AI Platform Notebooks API',
  endpoint: 'notebooks.googleapis.com',
  documentation: 'https://cloud.google.com/ai-platform/notebooks/',
  isOptional: false,
};

type Operation = gapi.client.servicemanagement.Operation;
type ListServicesResponse = gapi.client.servicemanagement.ListServicesResponse;

const SERVICE_MANAGER = 'https://servicemanagement.googleapis.com/v1';
export const NOTEBOOKS_API_PATH = 'https://notebooks.googleapis.com/v1beta1';

const GOOGLE_API_UNAUTHENITCATED_CODE = 16;

export function isUnauthorized(err: any) {
  // Check for Google API Error structure and Unauthenticated error code
  // https://cloud.google.com/apis/design/errors#error_codes
  if (err.result && err.result.error) {
    return err.result.error.code === GOOGLE_API_UNAUTHENITCATED_CODE;
  }

  return false;
}

/**
 * Wraps around the GCP AI Platform Notebooks API to manage notebook resources in Google Cloud.
 * https://cloud.google.com/ai-platform/notebooks/docs/reference/rest
 */
export class NotebookInstanceServiceLayer {
  private projectIdPromise?: Promise<string>;
  private instanceNamePromise?: Promise<string>;
  private locationIdPromise?: Promise<string>;
  private metadataPromise?: Promise<InstanceMetadata>;

  constructor(
    private _transportService: TransportService,
    private _authToken: string,
    projectId?: string,
    instanceName?: string,
    locationId?: string
  ) {
    if (projectId) {
      this.projectIdPromise = Promise.resolve(projectId);
    }
    if (instanceName) {
      this.instanceNamePromise = Promise.resolve(instanceName);
    }
    if (locationId) {
      this.locationIdPromise = Promise.resolve(locationId);
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

  get instanceName() {
    return this._getInstance();
  }

  set instanceName(instanceNamePromise: string | Promise<string>) {
    if (typeof instanceNamePromise === 'string') {
      this.instanceNamePromise = Promise.resolve(instanceNamePromise);
    } else {
      this.instanceNamePromise = instanceNamePromise;
    }
  }

  get locationId() {
    return this._getLocation();
  }

  set locationId(locationIdPromise: string | Promise<string>) {
    if (typeof locationIdPromise === 'string') {
      this.locationIdPromise = Promise.resolve(locationIdPromise);
    } else {
      this.locationIdPromise = locationIdPromise;
    }
  }

  set transportService(transportService: TransportService) {
    this._transportService = transportService;
  }

  set authToken(authToken: string) {
    this._authToken = authToken;
  }

  /**
   * Retrieves all necessary details about the user's project to allow the
   * extension to know whether or not Notebooks can be scheduled.
   */
  async getState(): Promise<State> {
    try {
      const [projectId, instanceName, locationId] = await Promise.all([
        this.projectId,
        this.instanceName,
        this.locationId,
      ]);

      const state: State = {
        serviceEnabled: false,
        projectId,
        instanceName,
        locationId,
      };

      console.log(state);
      return state;
    } catch (err) {
      console.error('Unable to determine project status', err);
      throw err;
    }
  }

  /**
   * Enables the service specified returning a Promise for the
   * operation.
   */
  async enableService(serviceName: string): Promise<Operation> {
    try {
      const projectId = await this.projectId;
      const pendingOperation = await this._transportService.submit<Operation>({
        path: `${SERVICE_MANAGER}/services/${serviceName}:enable`,
        method: POST,
        body: { consumerId: `project:${projectId}` },
      });

      return await this._pollOperation(
        `${SERVICE_MANAGER}/${pendingOperation.result.name}`
      );
    } catch (err) {
      console.error('Unable to enable necessary GCP service');
      handleApiError(err);
    }
  }

  /** Returns the status of the required service. */
  async _getServiceStatus(service: Service): Promise<boolean> {
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
      return enabledServices.has(service.endpoint);
    } catch (err) {
      console.error('Unable to return GCP services');
      handleApiError(err);
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
   * Returns the instanceName from the object or tries to retrieve it from the
   * server if not set.
   */
  private async _getInstance(): Promise<string> {
    if (this.instanceNamePromise) {
      return this.instanceNamePromise;
    }
    try {
      const { name } = await this._getMetadata();
      this.instanceNamePromise = Promise.resolve(name);
      return this.instanceNamePromise;
    } catch (err) {
      console.error('Unable to obtain GCP Instance Name', err);
      throw err;
    }
  }

  /**
   * Returns the locationId from the object or tries to retrieve it from the
   * server if not set.
   */
  private async _getLocation(): Promise<string> {
    if (this.locationIdPromise) {
      return this.locationIdPromise;
    }
    try {
      const { zone } = await this._getMetadata();
      return zone.split('/')[3];
    } catch (err) {
      console.error('Unable to obtain GCP Zone', err);
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

  /**
   * Stops the notebook instance.
   */
  async stop(): Promise<Instance> {
    try {
      const [projectId, instanceName, locationId] = await Promise.all([
        this.projectId,
        this.instanceName,
        this.locationId,
      ]);
      const name = `projects/${projectId}/locations/${locationId}/instances/${instanceName}`;
      const pendingOperation = await this._transportService.submit<Operation>({
        path: `${NOTEBOOKS_API_PATH}/${name}:stop`,
        method: POST,
        headers: { Authorization: `Bearer ${this._authToken}` },
        body: {},
      });
      const finishedOperation = await this._pollOperation(
        `${NOTEBOOKS_API_PATH}/${pendingOperation.result.name}`
      );
      return finishedOperation.response as Instance;
    } catch (err) {
      console.error('Unable to stop notebook instance');
      handleApiError(err);
    }
  }

  /**
   * Starts the notebook instance.
   */
  async start(): Promise<Instance> {
    try {
      const [projectId, instanceName, locationId] = await Promise.all([
        this.projectId,
        this.instanceName,
        this.locationId,
      ]);
      const name = `projects/${projectId}/locations/${locationId}/instances/${instanceName}`;
      const pendingOperation = await this._transportService.submit<Operation>({
        path: `${NOTEBOOKS_API_PATH}/${name}:start`,
        method: POST,
        headers: { Authorization: `Bearer ${this._authToken}` },
        body: {},
      });
      const finishedOperation = await this._pollOperation(
        `${NOTEBOOKS_API_PATH}/${pendingOperation.result.name}`
      );
      return finishedOperation.response as Instance;
    } catch (err) {
      console.error('Unable to start notebook instance');
      handleApiError(err);
    }
  }

  /**
   * Updates the machine type of a single Instance.
   */
  async setMachineType(machineType: string): Promise<Instance> {
    try {
      const [projectId, instanceName, locationId] = await Promise.all([
        this.projectId,
        this.instanceName,
        this.locationId,
      ]);
      const name = `projects/${projectId}/locations/${locationId}/instances/${instanceName}`;
      const pendingOperation = await this._transportService.submit<Operation>({
        path: `${NOTEBOOKS_API_PATH}/${name}:setMachineType`,
        method: 'PATCH',
        headers: { Authorization: `Bearer ${this._authToken}` },
        body: { machineType: machineType },
      });
      const finishedOperation = await this._pollOperation(
        `${NOTEBOOKS_API_PATH}/${pendingOperation.result.name}`
      );
      return finishedOperation.response as Instance;
    } catch (err) {
      console.error('Unable to set machine type of notebook instance');
      handleApiError(err);
    }
  }

  /**
   * Updates the guest accelerators of a single Instance.
   * TODO: use enum for type, verify coreCoutn combo is an int that is a valid combo
   */
  async setAccelerator(type: string, coreCount: string): Promise<Instance> {
    try {
      const [projectId, instanceName, locationId] = await Promise.all([
        this.projectId,
        this.instanceName,
        this.locationId,
      ]);
      const name = `projects/${projectId}/locations/${locationId}/instances/${instanceName}`;
      const pendingOperation = await this._transportService.submit<Operation>({
        path: `${NOTEBOOKS_API_PATH}/${name}:setAccelerator`,
        method: PATCH,
        headers: { Authorization: `Bearer ${this._authToken}` },
        body: { type, coreCount },
      });
      const finishedOperation = await this._pollOperation(
        `${NOTEBOOKS_API_PATH}/${pendingOperation.result.name}`
      );
      return finishedOperation.response as Instance;
    } catch (err) {
      console.error(
        'Unable to update the guest accelerators of notebook instance'
      );
      handleApiError(err);
    }
  }
}
