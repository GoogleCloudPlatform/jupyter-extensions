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

import * as csstips from 'csstips';
import { stylesheet } from 'typestyle';

interface MachineType {
  name: string;
  description: string;
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
  gpu: number;
  memory: number;
  temperature: number;
}

export interface Details {
  instance: Instance;
  project: Project;
  utilization: Utilization;
  gpu: Gpu;
}

export interface Option {
  text: string;
  value: string | number;
  disabled?: boolean;
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

/**
 * AI Platform Accelerator types.
 * https://cloud.google.com/ai-platform/training/docs/using-gpus#compute-engine-machine-types-with-gpu
 */
export const ACCELERATOR_TYPES: Option[] = [
  { value: '', text: 'None' },
  { value: 'NVIDIA_TESLA_K80', text: 'NVIDIA Tesla K80' },
  { value: 'NVIDIA_TESLA_P4', text: 'NVIDIA Tesla P4' },
  { value: 'NVIDIA_TESLA_P100', text: 'NVIDIA Tesla P100' },
  { value: 'NVIDIA_TESLA_T4', text: 'NVIDIA Tesla T4' },
  { value: 'NVIDIA_TESLA_V100', text: 'NVIDIA Tesla V100' },
];

/**
 * AI Platform Accelerator counts.
 * https://cloud.google.com/ai-platform/training/docs/using-gpus
 */
export const ACCELERATOR_COUNTS_1_2_4_8: Option[] = [
  { value: '1', text: '1' },
  { value: '2', text: '2' },
  { value: '4', text: '4' },
  { value: '8', text: '8' },
];

/**
 * AI Platform Machine types.
 * https://cloud.google.com/ai-platform/training/docs/machine-types#compare-machine-types
 */
export const MASTER_TYPES: Option[] = [
  { value: 'n1-standard-4', text: '4 CPUs, 15 GB RAM' },
  { value: 'n1-standard-8', text: '8 CPUs, 30 GB RAM' },
  { value: 'n1-standard-16', text: '16 CPUs, 60 GB RAM' },
  { value: 'n1-standard-32', text: '32 CPUs, 120 GB RAM' },
  { value: 'n1-standard-64', text: '64 CPUs, 240 GB RAM' },
  { value: 'n1-standard-96', text: '96 CPUs, 360 GB RAM' },

  { value: 'n1-highmem-2', text: '4 CPUs, 26 GB RAM' },
  { value: 'n1-highmem-4', text: '4 CPUs, 26 GB RAM' },
  { value: 'n1-highmem-8', text: '8 CPUs, 52 GB RAM' },
  { value: 'n1-highmem-16', text: '16 CPUs, 104 GB RAM' },
  { value: 'n1-highmem-32', text: '32 CPUs, 208 GB RAM' },
  { value: 'n1-highmem-64', text: '64 CPUs, 416 GB RAM' },
  { value: 'n1-highmem-96', text: '96 CPUs, 624 GB RAM' },

  { value: 'n1-highcpu-16', text: '16 CPUs, 14.4 GB RAM' },
  { value: 'n1-highcpu-32', text: '32 CPUs, 28.8 GB RAM' },
  { value: 'n1-highcpu-64', text: '64 CPUs, 57.6 GB RAM' },
  { value: 'n1-highcpu-96', text: '96 CPUs, 86.4 GB RAM' },
];

export interface HardwareConfiguration {
  cpu: number;
  memory: number;
}

/* CPU to Memory mappings for the Compute Engine machine types */
export interface MachineTypeConfigurations {
  base: Option;
  configurations: HardwareConfiguration[];
}

export const machineTypes: MachineTypeConfigurations[] = [
  {
    base: {
      value: 'n1-standard-',
      text: 'N1 Standard',
    },
    configurations: [
      { cpu: 4, memory: 15 },
      { cpu: 8, memory: 30 },
      { cpu: 16, memory: 60 },
      { cpu: 32, memory: 120 },
      { cpu: 64, memory: 240 },
      { cpu: 96, memory: 360 },
    ],
  },
  {
    base: {
      value: 'n1-highmem-',
      text: 'N1 High Memory',
    },
    configurations: [
      { cpu: 4, memory: 26 },
      { cpu: 8, memory: 52 },
      { cpu: 16, memory: 104 },
      { cpu: 32, memory: 208 },
      { cpu: 64, memory: 416 },
      { cpu: 96, memory: 624 },
    ],
  },
  {
    base: {
      value: 'n1-highcpu-',
      text: 'N1 High CPU',
    },
    configurations: [
      { cpu: 16, memory: 14.4 },
      { cpu: 32, memory: 28.8 },
      { cpu: 64, memory: 57.6 },
      { cpu: 96, memory: 86.4 },
    ],
  },
];

/* CPU to Memory mappings for the Compute Engine machine types */
export interface MachineTypeConfiguration {
  base: Option
  configurations: Option[];
}

export const MACHINE_TYPES: MachineTypeConfiguration[] = [
  {
    base: {
      value: 'n1-standard-',
      text: 'N1 standard',
    },
    configurations: [
      { value: 'n1-standard-1', text: '1 vCPUs, 3.75 GB RAM' },
      { value: 'n1-standard-2', text: '2 vCPUs, 7.5 GB RAM' },
      { value: 'n1-standard-4', text: '4 vCPUs, 15 GB RAM' },
      { value: 'n1-standard-8', text: '8 vCPUs, 30 GB RAM' },
      { value: 'n1-standard-16', text: '16 vCPUs, 60 GB RAM' },
      { value: 'n1-standard-32', text: '32 vCPUs, 120 GB RAM' },
      { value: 'n1-standard-64', text: '64 vCPUs, 240 GB RAM' },
      { value: 'n1-standard-96', text: '96 vCPUs, 360 GB RAM' },
    ],
  },
  {
      base: {
        value: 'n1-highcpu-',
        text: 'N1 high-CPU',
      },
      configurations: [
          { value: 'n1-highcpu-2', text: '2 vCPUs, 1.8 GB RAM' },
          { value: 'n1-highcpu-4', text: '4 vCPUs, 3.6 GB RAM' },
          { value: 'n1-highcpu-8', text: '8 vCPUs, 7.2 GB RAM' },
          { value: 'n1-highcpu-16', text: '16 vCPUs, 14.4 GB RAM' },
          { value: 'n1-highcpu-32', text: '32 vCPUs, 28.8 GB RAM' },
          { value: 'n1-highcpu-64', text: '64 vCPUs, 57.6 GB RAM' },
          { value: 'n1-highcpu-96', text: '96 vCPUs, 86 GB RAM' },
      ],
    },
  {
    base: {
      value: 'n1-highmem-',
      text: 'N1 high-memory',
    },
    configurations: [
      { value: 'n1-highmem-2', text: '2 vCPUs, 13 GB RAM' },
      { value: 'n1-highmem-4', text: '4 vCPUs, 26 GB RAM' },
      { value: 'n1-highmem-8', text: '8 vCPUs, 52 GB RAM' },
      { value: 'n1-highmem-16', text: '16 vCPUs, 104 GB RAM' },
      { value: 'n1-highmem-32', text: '32 vCPUs, 208 GB RAM' },
      { value: 'n1-highmem-64', text: '64 vCPUs, 416 GB RAM' },
      { value: 'n1-highmem-96', text: '96 vCPUs, 624 GB RAM' },
    ],
  },
  {
      base: {
        value: 'n1-megamem-',
        text: 'N1 megamem',
      },
      configurations: [
        { value: 'n1-megamem-96', text: '96 vCPUs, 1.4 TB RAM' },
      ],
  },
  {
      base: {
        value: 'n1-ultramem-',
        text: 'N1 ultramem',
      },
      configurations: [
        { value: 'n1-ultramem-40', text: '40 vCPUs, 961 GB RAM' },
        { value: 'n1-ultramem-80', text: '80 vCPUs, 1922 GB RAM' },
        { value: 'n1-ultramem-160', text: '160 vCPUs, 3844 GB RAM' },
      ],
  },
  {
      base: {
        value: 'n2-highcpu-',
        text: 'N2 high-CPU',
      },
      configurations: [
        { value: 'n2-highcpu-2', text: '2 vCPUs, 2 GB RAM' },
        { value: 'n2-highcpu-4', text: '4 vCPUs, 4 GB RAM' },
        { value: 'n2-highcpu-8', text: '8 vCPUs, 8 GB RAM' },
        { value: 'n2-highcpu-16', text: '16 vCPUs, 16 GB RAM' },
        { value: 'n2-highcpu-32', text: '32 vCPUs, 32 GB RAM' },
        { value: 'n2-highcpu-48', text: '48 vCPUs, 48 GB RAM' },
        { value: 'n2-highcpu-64', text: '64 vCPUs, 64 GB RAM' },
        { value: 'n2-highcpu-80', text: '80 vCPUs, 80 GB RAM' },
      ],
  },
  {
      base: {
        value: 'n2-highmem-',
        text: 'N2 high-memory',
      },
      configurations: [
        { value: 'n2-highmem-2', text: '2 vCPUs, 16 GB RAM' },
        { value: 'n2-highmem-4', text: '4 vCPUs, 32 GB RAM' },
        { value: 'n2-highmem-8', text: '8 vCPUs, 64 GB RAM' },
        { value: 'n2-highmem-16', text: '16 vCPUs, 128 GB RAM' },
        { value: 'n2-highmem-32', text: '32 vCPUs, 256 GB RAM' },
        { value: 'n2-highmem-48', text: '48 vCPUs, 384 GB RAM' },
        { value: 'n2-highmem-64', text: '64 vCPUs, 512 GB RAM' },
        { value: 'n2-highmem-80', text: '80 vCPUs, 640 GB RAM' },
      ],
  },
  {
      base: {
        value: 'n2-standard-',
        text: 'N2 standard',
      },
      configurations: [
        { value: 'n2-standard-2', text: '2 vCPUs, 8 GB RAM' },
        { value: 'n2-standard-4', text: '4 vCPUs, 16 GB RAM' },
        { value: 'n2-standard-8', text: '8 vCPUs, 32 GB RAM' },
        { value: 'n2-standard-16', text: '16 vCPUs, 64 GB RAM' },
        { value: 'n2-standard-32', text: '32 vCPUs, 128 GB RAM' },
        { value: 'n2-standard-48', text: '48 vCPUs, 192 GB RAM' },
        { value: 'n2-standard-64', text: '64 vCPUs, 256 GB RAM' },
        { value: 'n2-standard-80', text: '80 vCPUs, 320 GB RAM' },
      ],
  }, 
  {
      base: {
        value: 'm1-ultramem-',
        text: 'Memory-optimized',
      },
      configurations: [
        { value: 'm1-ultramem-40', text: '40 vCPUs, 961 GB RAM' },
        { value: 'm1-ultramem-80', text: '80 vCPUs, 1922 GB RAM' },
        { value: 'm1-ultramem-96', text: '96 vCPUs, 1.4 TB RAM' },
        { value: 'm1-ultramem-160', text: '160 vCPUs, 3844 GB RAM' },
      ],
  },   
];

/* Class names applied to the component. */
export const STYLES = stylesheet({
  container: {
    color: 'var(--jp-ui-font-color1)',

    fontFamily: 'var(--jp-ui-font-family)',
    fontSize: 'var(--jp-ui-font-size1, 13px)',
    lineHeight: '24px',
    alignItems: 'center',
    ...csstips.horizontal,
  },
  attribute: {
    marginRight: '4px',
  },
  interactiveHover: {
    $nest: {
      '&:hover': {
        backgroundColor: '#8a8a8a',
      },
    },
  },
  dt: {
    display: 'table-cell',
    fontWeight: 'bold',
    lineHeight: '20px',
    padding: '2px',
    verticalAlign: 'top',
  },
  dd: {
    padding: '2px 2px 2px 24px',
    verticalAlign: 'top',
  },
  icon: {
    display: 'inline-block',
    height: '18px',
    marginRight: '4px',
    width: '18px',
  },
  listRow: {
    display: 'table-row',
    boxShadow: 'inset 0 -1px 0 0 var(--jp-border-color0)',
  },
});
