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

import { Option } from './data';

/*
 * Accelerator type returned when fetching from gcloud compute command-line tool
 */
export interface Accelerator {
  name: string;
  description: string;
  maximumCardsPerInstance: number;
}

/**
 * The master list of AI Platform Accelerator types.
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

/*
 * Get description text from Accelerator Type value
 */
export function getGpuTypeText(value: string) {
  const accelerator = ACCELERATOR_TYPES.find(option => option.value === value);
  return accelerator ? accelerator.text : '';
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
 * This is hardcoded because currently only 5 acceleratorTypes are being used and no
 * true mapping on nvidia-smi product_names to Notebooks API AcceleratorType exists
 */
const NVIDIA_TO_ACCELERATOR_TYPES = {
  'Tesla K80': { enumValue: 'NVIDIA_TESLA_K80' },
  'Tesla P4': { enumValue: 'NVIDIA_TESLA_P4' },
  'Tesla P100-PCIE-16GB': { enumValue: 'NVIDIA_TESLA_P100' },
  'Tesla T4': { enumValue: 'NVIDIA_TESLA_T4' },
  'Tesla V100-SXM2-16GB': { enumValue: 'NVIDIA_TESLA_V100' },
};

export function nvidiaNameToEnum(name: string): string {
  const accelerator = NVIDIA_TO_ACCELERATOR_TYPES[name];
  return accelerator ? (accelerator.enumValue as string) : NO_ACCELERATOR_TYPE;
}

/**
 * Format gcloud compute acceleratorType to match the AcceleratorType
 * enums that are used in the Notebooks API and ensure it exists:
 */
export function acceleratorNameToEnum(name: string): string {
  const enumVal = name.toUpperCase().replace(/-/g, '_');
  const accelerator = ACCELERATOR_TYPES.find(
    accelerator => accelerator.value === enumVal
  );
  return accelerator ? (accelerator.value as string) : NO_ACCELERATOR_TYPE;
}

/*
 * Filter out invalid and restricted GPU types that can be attached to a virtual machine
 */
export function getGpuTypeOptionsList(
  accelerators: Accelerator[],
  cpuPlatform: string
): Option[] {
  if (!accelerators || accelerators.length === 0) return ACCELERATOR_TYPES;

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

/*
 * Generate a list of possible GPU count options for a specific GPU.
 */
export function getGpuCountOptionsList(
  accelerators: Accelerator[],
  acceleratorName: string
): Option[] {
  if (
    !acceleratorName ||
    acceleratorName === NO_ACCELERATOR_TYPE ||
    !accelerators
  )
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
