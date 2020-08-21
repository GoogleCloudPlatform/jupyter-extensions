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
import { GapiMachineType } from '../service/details_service';

/*
 * Machine type returned when fetching from gcloud compute command-line tool
 */
export interface MachineType {
  name: string;
  description: string;
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
  };
}

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

/*
 * Get description text from Machine Type value
 */
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

function machineTypeToBaseName(machineTypeName: string): string {
  // Group all variations of memory-optimized or compute-optimized machine types together
  if (machineTypeName.startsWith('m1')) return 'm1-';
  if (machineTypeName.startsWith('c2')) return 'c2-';

  return machineTypeName.substring(0, machineTypeName.lastIndexOf('-') + 1);
}

const BASE_NAME_TO_DISPLAY_TEXT = {
  'e2-highcpu-': 'E2 high-CPU',
  'e2-highmem-': 'E2 high-memory',
  'e2-standard-': 'E2 standard',
  'n1-standard-': 'N1 standard',
  'n1-highcpu-': 'N1 high-CPU',
  'n1-highmem-': 'N1 high-memory',
  'n1-megamem-': 'N1 megamem',
  'n1-ultramem-': 'N1 ultramem',
  'n2-highcpu-': 'N2 high-CPU',
  'n2-highmem-': 'N2 high-memory',
  'n2-standard-': 'N2 standard',
  'c2-': 'Compute-optimized',
  'm1-': 'Memory-optimized',
};

export function getMachineTypeOptions(machineTypes: GapiMachineType[]) {
  if (!machineTypes || machineTypes.length === 0) return MACHINE_TYPES;

  const map = new Map();
  const machineTypeOptions = [];
  const defaultMachineType = [];
  const optimizedMachineTypes = [];

  // Group machine types by their base-name
  machineTypes.map(machineType => {
    const key = machineTypeToBaseName(machineType.name);
    if (!map.has(key)) {
      map.set(key, []);
    }
    map.get(key).push(machineType);
  });

  map.forEach(function(value, key) {
    value.sort((a, b) => a.guestCpus - b.guestCpus);
    value = value.map(item => machineTypeToOption(item));

    const obj = {
      base: {
        value: key,
        text: BASE_NAME_TO_DISPLAY_TEXT[key],
      },
      configurations: value,
    };

    // To ensure the different machine type configurations are displayed in a specific order
    switch (key) {
      case 'n1-standard-':
        defaultMachineType.push(obj);
        break;
      case 'c2-':
      case 'm1-':
        optimizedMachineTypes.push(obj);
        break;
      default:
        machineTypeOptions.push(obj);
    }
  });

  return defaultMachineType.concat(machineTypeOptions, optimizedMachineTypes);
}
