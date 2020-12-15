export interface Bucket {
  name: string;
  accessLevel?: 'uniform' | 'fine';
}

export interface Buckets {
  buckets: Bucket[];
}

export interface CloudStorageApiBucket {
  iamConfiguration?: {
    uniformBucketLevelAccess?: {
      /** If set, access is controlled only by bucket-level or above IAM policies. */
      enabled?: boolean;
    };
  };
  /** The ID of the bucket. For buckets, the id and name properties are the same. */
  id?: string;
}

export interface CloudStorageApiBuckets {
  /** The list of items. */
  items?: CloudStorageApiBucket[];
  /** The kind of item this is. For lists of buckets, this is always storage#buckets. */
  kind?: string;
  /** The continuation token, used to page through large result sets. Provide this value in a subsequent request to return the next page of results. */
  nextPageToken?: string;
}

/** Interfaces used by services to call and read Notebooks Executor API responses */

interface ApiClientObjectMap<T> {
  [key: string]: T;
}

interface Status {
  code?: number;
  message?: string;
}

export interface Operation {
  name?: string;
  metadata?: ApiClientObjectMap<any>;
  done?: boolean;
  error?: Status;
  response?: ApiClientObjectMap<any>;
}

export interface CreateScheduleResponse {
  error?: string;
}

export interface CreateExecutionResponse {
  error?: string;
}

export interface ListSchedulesResponse {
  schedules?: NotebooksApiSchedule[];
  nextPageToken?: string;
  unreachable?: string[];
}

export interface ListExecutionsResponse {
  executions?: NotebooksApiExecution[];
  nextPageToken?: string;
  unreachable?: string[];
}

type NotebooksApiExecutionState =
  | 'STATE_UNSPECIFIED'
  | 'QUEUED'
  | 'PREPARING'
  | 'RUNNING'
  | 'SUCCEEDED'
  | 'FAILED'
  | 'CANCELLING'
  | 'CANCELLED'
  | 'PAUSED';

type NotebooksApiScheduleState =
  | 'STATE_UNSPECIFIED'
  | 'ENABLED'
  | 'PAUSED'
  | 'DISABLED'
  | 'UPDATE_FAILED';

type NotebooksApiExecutionTemplateScaleTier =
  | 'SCALE_TIER_UNSPECIFIED'
  | 'BASIC'
  | 'STANDARD_1'
  | 'PREMIUM_1'
  | 'BASIC_GPU'
  | 'BASIC_TPU'
  | 'CUSTOM';

type NotebooksApiSchedulerAcceleratorConfigType =
  | 'SCHEDULER_ACCELERATOR_TYPE_UNSPECIFIED'
  | 'NVIDIA_TESLA_K80'
  | 'NVIDIA_TESLA_P100'
  | 'NVIDIA_TESLA_V100'
  | 'NVIDIA_TESLA_P4'
  | 'NVIDIA_TESLA_T4'
  | 'NVIDIA_TESLA_A100'
  | 'TPU_V2'
  | 'TPU_V3'
  | 'TPU_V2_POD'
  | 'TPU_V3_POD';

export interface NotebooksApiExecution {
  name?: string;
  displayName?: string;
  description?: string;
  createTime?: string;
  updateTime?: string;
  state?: NotebooksApiExecutionState;
  executionTemplate?: NotebooksApiExecutionTemplate;
  outputNotebookFile?: string;
}

export interface NotebooksApiSchedule {
  name?: string;
  displayName?: string;
  description?: string;
  state?: NotebooksApiScheduleState;
  cronSchedule?: string;
  timeZone?: string;
  createTime?: string;
  updateTime?: string;
  executionTemplate?: NotebooksApiExecutionTemplate;
}

export interface NotebooksApiExecutionTemplate {
  scaleTier?: NotebooksApiExecutionTemplateScaleTier;
  masterType?: string;
  acceleratorConfig?: NotebooksApiSchedulerAcceleratorConfig;
  labels?: ApiClientObjectMap<string>;
  inputNotebookFile?: string;
  containerImageUri?: string;
  location?: string;
  outputNotebookFolder?: string;
  paramsYamlFile?: string;
}

export interface NotebooksApiSchedulerAcceleratorConfig {
  type?: NotebooksApiSchedulerAcceleratorConfigType;
  coreCount?: string;
}

/** Interfaces used by extension to display and create Executions/Schedules */

/** Message type describing an AI Platform training Job */
export interface ExecuteNotebookRequest {
  imageUri: string;
  inputNotebookGcsPath: string;
  name: string;
  masterType: string;
  outputNotebookFolder: string;
  gcsBucket: string;
  scaleTier: string;
  region: string;
  acceleratorType: string;
  acceleratorCount: string;
}

export interface ExecutionTemplate {
  id: string;
  name: string;
  updateTime?: string;
  createTime?: string;
  gcsFile: string;
  state: string;
  link?: string;
  viewerLink?: string;
  downloadLink?: string;
  timeZone?: string;
}

/** UI interface used to represent a Scheduled Notebook Job */
export interface Execution extends ExecutionTemplate {
  type: string;
  bucketLink?: string;
}

export interface Schedule extends ExecutionTemplate {
  schedule: string;
  hasExecutions: boolean;
}

export interface Executions {
  executions: Execution[];
  pageToken: string;
}

export interface Schedules {
  schedules: Schedule[];
  pageToken: string;
}
