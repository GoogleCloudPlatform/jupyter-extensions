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

import {
  ServerProxyTransportService,
  InstanceMetadata,
  getMetadata,
} from 'gcp_jupyterlab_shared';
import { Accelerator } from '../data/accelerator_types';

type ListMachineTypesResponse = gapi.client.compute.MachineTypeList;
type ListAcceleratorTypesResponse = gapi.client.compute.AcceleratorTypeList;
export type GapiMachineType = gapi.client.compute.MachineType;

export const COMPUTE_ENGINE_API_PATH =
  'https://compute.googleapis.com/compute/v1';

export class DetailsService {
  private projectIdPromise?: Promise<string>;
  private zonePromise?: Promise<string>;
  private metadataPromise?: Promise<InstanceMetadata>;
  private machineTypesPromise?: Promise<GapiMachineType[]>;
  private acceleratorTypesPromise?: Promise<any>;

  constructor(
    private _transportService: ServerProxyTransportService,
    projectId?: string,
    zone?: string
  ) {
    if (projectId) {
      this.projectIdPromise = Promise.resolve(projectId);
    }
    if (zone) {
      this.zonePromise = Promise.resolve(zone);
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

  get zone() {
    return this._getZone();
  }

  set zone(zonePromise: string | Promise<string>) {
    if (typeof zonePromise === 'string') {
      this.zonePromise = Promise.resolve(zonePromise);
    } else {
      this.zonePromise = zonePromise;
    }
  }

  set transportService(transportService: ServerProxyTransportService) {
    this._transportService = transportService;
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
   * Returns the zone from the object or tries to retrieve it from the
   * server if not set.
   */
  private async _getZone(): Promise<string> {
    if (this.zonePromise) {
      return this.zonePromise;
    }
    try {
      const { zone } = await this._getMetadata();
      // extract the zone from the zone resource name
      this.zonePromise = Promise.resolve(zone.split('/').pop());
      return this.zonePromise;
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
   * Retrieves a list of machine types available for the specified project in the specified region.
   */
  async getMachineTypes(): Promise<GapiMachineType[]> {
    if (this.machineTypesPromise) {
      return this.machineTypesPromise;
    }
    try {
      const name = await this.getResourceName();
      const response = await this._transportService.submit<
        ListMachineTypesResponse
      >({
        path: `${COMPUTE_ENGINE_API_PATH}/${name}/machineTypes`,
        params: {
          filter: 'isSharedCpu = false',
        },
      });
      this.machineTypesPromise = Promise.resolve(response.result.items);
      return this.machineTypesPromise;
    } catch (err) {
      console.error(`Unable to retrieve machine types.`);
      return [];
    }
  }

  /**
   * Retrieves a list of accelerators available for the specified project in the specified region.
   */
  async getAcceleratorTypes(): Promise<Accelerator[]> {
    if (this.acceleratorTypesPromise) {
      return this.acceleratorTypesPromise;
    }
    try {
      const name = await this.getResourceName();
      const response = await this._transportService.submit<
        ListAcceleratorTypesResponse
      >({
        path: `${COMPUTE_ENGINE_API_PATH}/${name}/acceleratorTypes`,
      });
      this.acceleratorTypesPromise = Promise.resolve(response.result.items);
      return this.acceleratorTypesPromise;
    } catch (err) {
      console.error(`Unable to retrieve accelerator types.`);
      return [];
    }
  }

  private async getResourceName(): Promise<string> {
    const [projectId, zone] = await Promise.all([this.projectId, this.zone]);
    return `projects/${projectId}/zones/${zone}`;
  }
}
