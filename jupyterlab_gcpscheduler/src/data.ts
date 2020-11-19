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

/** Helpers for UI selections */
const GCR_PREFIX = 'gcr.io/deeplearning-platform-release';

/** Custom ScaleTier allows selection of AI Platform Machine type */
export const CUSTOM = 'CUSTOM';
/** Indicates a single Notebook run */
export const SINGLE = 'single';
/** Indicates a recurring scheduled Notebook run */
export const RECURRING = 'recurring';
/** Region where Cloud Function will be deployed. */
export const CLOUD_FUNCTION_REGION = 'us-central1';
/** Name of the Cloud Function that handles notebook scheduling */
export const CLOUD_FUNCTION_NAME = 'submitScheduledNotebook';
/** Indicates a hourly frequency type */
export const HOUR = 'hour';
/** Indicates a daily frequency type */
export const DAY = 'day';
/** Indicates a weekly frequency type */
export const WEEK = 'week';
/** Indicates a monthly frequency type */
export const MONTH = 'month';

/** Interface for an <option> inside a <select> */
export interface Option {
  text: string;
  value: string | number;
  disabled?: boolean;
}

/** Returns an option whose value matches the given value. */
export function findOptionByValue<T extends Option>(
  options: T[],
  value: string | number | undefined
): T | undefined {
  if (value === undefined) return undefined;
  return options.find(option => option.value === value);
}

export const DAYS_OF_WEEK: Option[] = [
  { value: 'sundayRun', text: 'Sun' },
  { value: 'mondayRun', text: 'Mon' },
  { value: 'tuesdayRun', text: 'Tue' },
  { value: 'wednesdayRun', text: 'Wed' },
  { value: 'thursdayRun', text: 'Thur' },
  { value: 'fridayRun', text: 'Fri' },
  { value: 'saturdayRun', text: 'Sat' },
];

export const MONTH_FREQUENCIES: Option[] = [
  { value: '1', text: '1' },
  { value: '2', text: '2' },
  { value: '4', text: '4' },
  { value: '6', text: '6' },
  { value: '12', text: '12' },
];
/** Removes the item from the list if found */
export function removeFromList<T>(list: T[], value: T) {
  const index = list.indexOf(value);
  if (index >= 0) {
    list.splice(index, 1);
  }
}

/**
 * Container images that can be used to schedule jobs on AI Platform.
 * https://cloud.google.com/ai-platform/training/docs/containers-overview
 */
export const CONTAINER_IMAGES: Option[] = [
  { value: `${GCR_PREFIX}/base-cpu:latest`, text: 'Python' },
  {
    value: `${GCR_PREFIX}/tf-cpu.1-15:latest`,
    text: 'TensorFlow Enterprise 1.15 (CPU only)',
  },
  {
    value: `${GCR_PREFIX}/tf-gpu.1-15:latest`,
    text: 'TensorFlow Enterprise 1.15 (GPU)',
  },
  {
    value: `${GCR_PREFIX}/tf2-cpu.2-1:latest`,
    text: 'TensorFlow 2.1 (CPU only)',
  },
  {
    value: `${GCR_PREFIX}/tf2-gpu.2-1:latest`,
    text: 'TensorFlow 2.1 (GPU)',
  },
  {
    value: `${GCR_PREFIX}/pytorch-cpu.1-4:latest`,
    text: 'PyTorch 1.4 (CPU only)',
  },
  {
    value: `${GCR_PREFIX}/pytorch-gpu.1-4:latest`,
    text: 'PyTorch 1.4 (GPU)',
  },
  {
    value: `${GCR_PREFIX}/r-cpu.3-6:latest`,
    text: 'R 3.6 (with r-essentials)',
  },
  { value: `${GCR_PREFIX}/beam-notebooks:latest`, text: 'Apache Beam' },
];

/**
 * Scale tier values for AI Platform Jobs
 * https://cloud.google.com/ai-platform/training/docs/machine-types#scale_tiers
 */
export const SCALE_TIERS: Option[] = [
  { value: 'BASIC', text: 'Single worker instance' },
  {
    value: 'BASIC_GPU',
    text: 'A single worker instance with an NVIDIA Tesla K80 GPU',
  },
  {
    value: 'STANDARD_1',
    text: '1 master instance, 4 workers, 3 parameter servers',
  },
  {
    value: 'PREMIUM_1',
    text: '1 master instance, 19 workers, 11 parameter servers',
  },
  { value: CUSTOM, text: 'Custom machine type configuration' },
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
 * AI Platform Accelerator types for particular machine types that only
 * provide a limited amount.
 * https://cloud.google.com/ai-platform/training/docs/using-gpus#compute-engine-machine-types-with-gpu
 */
export const ACCELERATOR_TYPES_REDUCED: Option[] = [
  { value: '', text: 'None' },
  { value: 'NVIDIA_TESLA_P4', text: 'NVIDIA Tesla P4' },
  { value: 'NVIDIA_TESLA_T4', text: 'NVIDIA Tesla T4' },
  { value: 'NVIDIA_TESLA_V100', text: 'NVIDIA Tesla V100' },
];

const MASTER_TYPES_REDUCED: Set<string> = new Set([
  'n1-standard-64',
  'n1-standard-96',
  'n1-highmem-64',
  'n1-highmem-96',
  'n1-highcpu-96',
]);

/**
 * Returns the valid accelerator types given a masterType. Returns empty array
 * if masterType is falsy.
 */
export function getAcceleratorTypes(masterType: string): Option[] {
  if (masterType) {
    if (MASTER_TYPES_REDUCED.has(masterType)) {
      return ACCELERATOR_TYPES_REDUCED;
    }
    return ACCELERATOR_TYPES;
  }
  return [];
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
 * Supported AI Platform regions.
 * https://cloud.google.com/ai-platform/training/docs/regions
 * TODO: It may be more sensible to invoke the projects.locations.list API
 * and filter for locations with TRAINING capability
 * https://cloud.google.com/ai-platform/training/docs/reference/rest/v1/projects.locations/list
 */
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

/** Single execution or recurring schedule */
export const SCHEDULE_TYPES: Option[] = [
  { value: SINGLE, text: 'Single run' },
  { value: RECURRING, text: 'Schedule (scheduled runs)' },
];

export const FREQUENCY_TYPES: Option[] = [
  { value: HOUR, text: 'hour' },
  { value: DAY, text: 'day' },
  { value: WEEK, text: 'week' },
  { value: MONTH, text: 'month' },
];

/** Link to Cloud Console */
export const CLOUD_CONSOLE = 'https://console.cloud.google.com';

/** Link to AI Platform Jobs */
export const AI_PLATFORM_LINK = `${CLOUD_CONSOLE}/ai-platform/jobs`;

/** Link to GCS Storage Browser */
export const GCS_LINK = `${CLOUD_CONSOLE}/storage/browser`;

/** Link to Scheduled Runs page */
export const SCHEDULER_LINK = `${CLOUD_CONSOLE}/ai-platform/notebooks/list/scheduled-runs`;

/** Notebook jobs directory that notebooks will be imported to. */
export const IMPORT_DIRECTORY = 'imported_notebook_jobs/';

export const VIEWER_LINK_BASE = 'https://notebooks.cloud.google.com/view';

export const DOWNLOAD_LINK_BASE = 'https://storage.cloud.google.com';
