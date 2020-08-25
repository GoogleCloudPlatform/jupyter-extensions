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

import { MachineType, MachineTypeConfiguration } from './machine_types';
import {
  Accelerator,
  nvidiaNameToEnum,
  NO_ACCELERATOR_COUNT,
} from './accelerator_types';

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

export interface Details {
  instance: Instance;
  project: Project;
  utilization: Utilization;
  gpu: Gpu;
  acceleratorTypes: Accelerator[];
  machineTypes: MachineTypeConfiguration[];
}

export interface HardwareConfiguration {
  machineType: MachineType;
  attachGpu: boolean;
  gpuType: string; // as Notebooks API AcceleratorType enum values
  gpuCount: string;
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
  details: Details
): HardwareConfiguration {
  const { instance, gpu } = details;

  return {
    machineType: instance.machineType,
    attachGpu: Boolean(gpu.name),
    gpuType: nvidiaNameToEnum(gpu.name),
    gpuCount: gpu.name ? gpu.count : NO_ACCELERATOR_COUNT,
  };
}

interface AttributeMapper {
  label: string;
  mapper: (details: Details) => string;
}

// Displayable virtual machine detail attributes
export const MAPPED_ATTRIBUTES: AttributeMapper[] = [
  { label: 'VM Name', mapper: (details: Details) => details.instance.name },
  { label: 'Project', mapper: (details: Details) => details.project.projectId },
  {
    label: 'Framework',
    mapper: (details: Details) => details.instance.attributes.framework,
  },
  {
    label: 'Machine Type',
    mapper: (details: Details) =>
      `${details.instance.machineType.description} (${details.instance.machineType.name})`,
  },
];

export const REFRESHABLE_MAPPED_ATTRIBUTES = [
  {
    label: 'CPU Utilization',
    mapper: (details: Details) => `CPU: ${details.utilization.cpu.toFixed(1)}%`,
  },
  {
    label: 'Memory Utilization',
    mapper: (details: Details) =>
      `Memory: ${details.utilization.memory.toFixed(1)}%`,
  },
  {
    label: 'GPU Utilization',
    mapper: (details: Details) => {
      if (!details.gpu.name) {
        return 'No GPUs';
      }
      return `GPU: ${details.gpu.name} - ${details.gpu.gpu.toFixed(1)}%`;
    },
  },
];

MAPPED_ATTRIBUTES.push(...REFRESHABLE_MAPPED_ATTRIBUTES);
