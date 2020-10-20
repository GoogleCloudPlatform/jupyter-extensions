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

import { MachineType } from './machine_types';
import { nvidiaNameToEnum, NO_ACCELERATOR_COUNT } from './accelerator_types';

export interface Option {
  text: string;
  value: string | number;
  disabled?: boolean;
}

interface Instance {
  attributes: {
    framework: string;
    title: string;
    version: string;
  };
  cpuPlatform: string;
  id: number;
  image: string;
  machineType: MachineType;
  name: string;
  zone: string;
}

interface Project {
  numericProjectId: number;
  projectId: string;
}

export interface Utilization {
  cpu: number;
  memory: number;
}

interface Gpu {
  name: string;
  driver_version: string;
  cuda_version: string;
  count: string;
  gpu: number;
  memory: number;
  temperature: number;
}

/** Details response information from server extension. */
export interface DetailsResponse {
  instance: Instance;
  project: Project;
  gpu: Gpu;
  utilization: Utilization;
}

export interface HardwareConfiguration {
  machineType: MachineType;
  attachGpu: boolean;
  gpuType: string; // as Notebooks API AcceleratorType enum values
  gpuCount: string;
  diskType?: string;
  diskSizeGb?: string;
}

export function isEqualHardwareConfiguration(
  a: HardwareConfiguration,
  b: HardwareConfiguration
) {
  return (
    a.machineType.name === b.machineType.name &&
    a.machineType.description === b.machineType.description &&
    a.attachGpu === b.attachGpu &&
    a.gpuType === b.gpuType &&
    a.gpuCount === b.gpuCount
  );
}

export function detailsToHardwareConfiguration(
  details: DetailsResponse
): HardwareConfiguration {
  const { instance, gpu } = details;

  return {
    machineType: instance.machineType,
    attachGpu: Boolean(gpu.name),
    gpuType: nvidiaNameToEnum(gpu.name),
    gpuCount: gpu.name ? gpu.count : NO_ACCELERATOR_COUNT,
  };
}

/** The average number of hours in a month, i.e., 365 / 12 * 24 */
export const HOURS_PER_MONTH = 730;
export const NO_SUSTAINED_DISCOUNT_PREFIXES = ['e2-'];

export const REGIONS: Option[] = [
  {
    value: 'us-central1',
    text: 'us-central1 (Iowa)',
  },
  {
    value: 'us-east1',
    text: 'us-east1 (South Carolina)',
  },
  {
    value: 'us-east4',
    text: 'us-east4 (Northern Virginia)',
  },
  {
    value: 'us-west1',
    text: 'us-west1 (Oregon)',
  },
  {
    value: 'us-west2',
    text: 'us-west2 (Los Angeles)',
  },
  {
    value: 'us-west3',
    text: 'us-west3 (Salt Lake City)',
  },
  {
    value: 'asia-east1',
    text: 'asia-east1 (Taiwan)',
  },
  {
    value: 'europe-north1',
    text: 'europe-north1 (Finland)',
  },
  {
    value: 'europe-west1',
    text: 'europe-west1 (Belgium)',
  },
  {
    value: 'europe-west2',
    text: 'europe-west2 (London)',
  },
  {
    value: 'europe-west3',
    text: 'europe-west3 (Frankfurt)',
  },
  {
    value: 'europe-west4',
    text: 'europe-west4 (Netherlands)',
  },
  {
    value: 'europe-west6',
    text: 'europe-west6 (Zurich)',
  },
  {
    value: 'asia-east1',
    text: 'asia-east1 (Taiwan)',
  },
  {
    value: 'asia-east2',
    text: 'asia-east2 (Hong Kong)',
  },
  {
    value: 'asia-south1',
    text: 'asia-south1 (Mumbai)',
  },
  {
    value: 'asia-northeast1',
    text: 'asia-northeast1 (Tokyo)',
  },
  {
    value: 'asia-northeast2',
    text: 'asia-northeast2 (Osaka)',
  },
  {
    value: 'asia-northeast3',
    text: 'asia-northeast3 (Seoul)',
  },
  {
    value: 'asia-southeast1',
    text: 'asia-southeast1 (Singapore)',
  },
];

export function extractLast(str: string) {
  const last = str.split('/').pop();
  return last;
}

interface AttributeMapper {
  label: string;
  mapper: (details: DetailsResponse) => string;
}

// Displayable virtual machine detail attributes
export const MAPPED_ATTRIBUTES: AttributeMapper[] = [
  {
    label: 'VM Name',
    mapper: (details: DetailsResponse) => details.instance.name,
  },
  {
    label: 'Project',
    mapper: (details: DetailsResponse) => details.project.projectId,
  },
  {
    label: 'Framework',
    mapper: (details: DetailsResponse) => details.instance.attributes.framework,
  },
  {
    label: 'Machine Type',
    mapper: (details: DetailsResponse) =>
      `${details.instance.machineType.description} (${details.instance.machineType.name})`,
  },
  {
    label: 'GPU Type',
    mapper: (details: DetailsResponse) => {
      if (!details.gpu.name) {
        return 'No GPUs';
      }
      return `${details.gpu.name} x ${details.gpu.count}`;
    },
  },
];

export const REFRESHABLE_MAPPED_ATTRIBUTES = [
  {
    label: 'CPU Utilization',
    mapper: (details: DetailsResponse) =>
      `CPU: ${details.utilization.cpu.toFixed(1)}%`,
  },
  {
    label: 'Memory Utilization',
    mapper: (details: DetailsResponse) =>
      `Memory: ${details.utilization.memory.toFixed(1)}%`,
  },
  {
    label: 'GPU Utilization',
    mapper: (details: DetailsResponse) => {
      if (!details.gpu.name) {
        return 'No GPUs';
      }
      return `GPU: ${details.gpu.gpu.toFixed(1)}%`;
    },
  },
];

MAPPED_ATTRIBUTES.push(...REFRESHABLE_MAPPED_ATTRIBUTES);
