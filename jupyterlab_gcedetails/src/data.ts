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
import { BASE_FONT } from 'gcp_jupyterlab_shared';

interface MachineType {
  name: string;
  description: string;
}

export interface Accelerator {
  name: string;
  description: string;
  maximumCardsPerInstance: number;
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
}

export interface Option {
  text: string;
  value: string | number;
  disabled?: boolean;
}

export interface HardwareConfiguration {
  machineType: MachineType;
  attachGpu: boolean;
  gpuType: string; // as Notebooks API AcceleratorType enum values
  gpuCount: string;
}

/**
 * AI Platform Accelerator types.
 * https://cloud.google.com/ai-platform/training/docs/using-gpus#compute-engine-machine-types-with-gpu
 * https://cloud.google.com/ai-platform/notebooks/docs/reference/rest/v1beta1/projects.locations.instances#AcceleratorType
 */
export const NO_ACCELERATOR_TYPE = 'ACCELERATOR_TYPE_UNSPECIFIED';
export const NO_ACCELERATOR_COUNT = '0';

export const ACCELERATOR_TYPES: Option[] = [
  { value: 'NVIDIA_TESLA_K80', text: 'NVIDIA Tesla K80' },
  { value: 'NVIDIA_TESLA_P4', text: 'NVIDIA Tesla P4' },
  { value: 'NVIDIA_TESLA_P100', text: 'NVIDIA Tesla P100' },
  { value: 'NVIDIA_TESLA_T4', text: 'NVIDIA Tesla T4' },
  { value: 'NVIDIA_TESLA_V100', text: 'NVIDIA Tesla V100' },
];

export function getGpuTypeText(value: string) {
  return ACCELERATOR_TYPES.find(option => option.value === value).text;
}

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
 * Convert nvidia-smi product_name type to match the AcceleratorType
 * enums that are used in the Notebooks API:
 * https://cloud.google.com/ai-platform/notebooks/docs/reference/rest/v1beta1/projects.locations.instances#AcceleratorType
 */
function nvidiaNameToEnum(name: string): string {
  if (name === '') return NO_ACCELERATOR_TYPE;

  const accelerator = ACCELERATOR_TYPES.find(accelerator =>
    accelerator.text.endsWith(name)
  );
  return accelerator ? (accelerator.value as string) : NO_ACCELERATOR_TYPE;
}

/**
 * Format gcloud compute acceleratorType to match the AcceleratorType
 * enums that are used in the Notebooks API:
 * https://cloud.google.com/ai-platform/notebooks/docs/reference/rest/v1beta1/projects.locations.instances#AcceleratorType
 */
function acceleratorNameToEnum(name: string): string {
  return name.toUpperCase().replace(/-/g, '_');
}

export function getGpuTypeOptionsList(
  accelerators: Accelerator[],
  cpuPlatform: string
): Option[] {
  // For more information on gpu restrictions see: https://cloud.google.com/compute/docs/gpus#restrictions
  accelerators = accelerators.filter(
    accelerator =>
      // filter out virtual workstation accelerator types
      !accelerator.name.endsWith('-vws') &&
      // a minimum cpu platform of Intel Skylake or later does not currently support the k80 gpu
      !(
        accelerator.name === 'nvidia-tesla-k80' &&
        cpuPlatform === 'Intel Skylake'
      )
  );

  return accelerators.map(accelerator => ({
    value: acceleratorNameToEnum(accelerator.name),
    text: accelerator.description,
  }));
}

export function getGpuCountOptionsList(
  accelerators: Accelerator[],
  acceleratorName: string
): Option[] {
  if (acceleratorName === NO_ACCELERATOR_TYPE)
    return ACCELERATOR_COUNTS_1_2_4_8;

  const accelerator = accelerators.find(
    accelerator => acceleratorNameToEnum(accelerator.name) === acceleratorName
  );
  return accelerator
    ? ACCELERATOR_COUNTS_1_2_4_8.slice(
        0,
        Math.log(accelerator.maximumCardsPerInstance) / Math.log(2) + 1
      )
    : ACCELERATOR_COUNTS_1_2_4_8;
}

export function optionToMachineType(option: Option): MachineType {
  return {
    name: option.value as string,
    description: option.text,
  };
}

export function machineTypeToOption(machineType: MachineType): Option {
  return {
    value: machineType.name,
    text: machineType.description,
    disabled: false,
  };
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
 * AI Platform Machine types.
 * https://cloud.google.com/ai-platform/training/docs/machine-types#compare-machine-types
 */
export interface MachineTypeConfiguration {
  base: Option;
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
    configurations: [{ value: 'n1-megamem-96', text: '96 vCPUs, 1.4 TB RAM' }],
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

export function getMachineTypeText(value: string) {
  const machineType = MACHINE_TYPES.find(machineType =>
    value.startsWith(machineType.base.value as string)
  );

  return machineType
    ? machineType.configurations.find(
        configuration => configuration.value === value
      ).text
    : null;
}

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
  containerPadding: {
    padding: '20px 30px',
    maxWidth: '400px',
  },
  heading: {
    fontSize: '22px',
    padding: '20px 0px',
    fontWeight: 400,
    fontFamily: 'var(--jp-ui-font-family)',
    color: 'var(--jp-ui-font-color1)',
  },
  subheading: {
    fontSize: '18px',
    fontWeight: 700,
    padding: '10px 0px',
    fontFamily: 'var(--jp-ui-font-family)',
    color: 'var(--jp-ui-font-color1)',
  },
  paragraph: {
    fontSize: '14px',
    fontWeight: 400,
    padding: '5px 0px',
    fontFamily: 'var(--jp-ui-font-family)',
    color: 'var(--jp-ui-font-color1)',
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

export const TEXT_STYLE = {
  fontFamily: BASE_FONT.fontFamily as string,
  fontSize: BASE_FONT.fontSize as number,
};
