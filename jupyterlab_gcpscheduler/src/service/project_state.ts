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
  TransportService,
  POST,
  InstanceMetadata,
  getMetadata,
} from 'gcp_jupyterlab_shared';
import { removeFromList } from '../data';

interface Service {
  endpoint: string;
  name: string;
  documentation: string;
  isOptional: boolean;
}

interface TestIamPermissionsResponse {
  permissions: string[];
}

/** API service status */
export interface ServiceStatus {
  service: Service;
  enabled: boolean;
}

/* Provides list of missing permissions required to perform the action */
export interface GetPermissionsResponse {
  toInitialize: string[];
  toExecute: string[];
  toSchedule: string[];
}
const RESOURCE_MANAGER = 'https://cloudresourcemanager.googleapis.com/v1';

const BUCKET_CREATE_PERMISSION = 'storage.buckets.create';
const OBJECT_CREATE_PERMISSION = 'storage.objects.create';

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
const BYPASS_PERMISSION_CHECK = false;

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
    if (!BYPASS_PERMISSION_CHECK) {
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
    } else {
      returnedPermissions.push(...checked);
    }
    this._populateGetPermissionsResponse(
      returnedPermissions,
      getPermissionsResponse
    );
    return getPermissionsResponse;
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
