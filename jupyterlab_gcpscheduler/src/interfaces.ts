/**
 * Cloud Scheduler Job
 * https://cloud.google.com/scheduler/docs/reference/rest/v1/projects.locations.jobs#Job
 */
export interface CloudSchedulerJob {
  name: string;
  description: string;
  schedule: string;
  timeZone: string;
  httpTarget: {
    body: string;
    headers: { [name: string]: string };
    httpMethod: string;
    uri: string;
    oidcToken: { serviceAccountEmail: string };
  };
}

/** Message type describing an AI Platform training Job */
export interface ExecuteNotebookRequest {
  imageUri: string;
  inputNotebookGcsPath: string;
  name: string;
  masterType: string;
  outputNotebookGcsPath: string;
  gcsBucket: string;
  scaleTier: string;
  region: string;
  acceleratorType: string;
  acceleratorCount: string;
}

/** List of Jobs returned from AI Platform. */
/* eslint-disable @typescript-eslint/camelcase */
export type ListAiPlatformJobsResponse = gapi.client.ml.GoogleCloudMlV1__ListJobsResponse;

/** Enum to represent the type of the JobRow */
export enum JobRowType {
  SCHEDULED = 'SCHEDULED',
  IMMEDIATE = 'IMMEDIATE',
}

export type JobState =
  | 'STATE_UNSPECIFIED'
  | 'ENABLED'
  | 'PAUSED'
  | 'DISABLED'
  | 'UPDATE_FAILED';

export interface Executions {
  executions: Execution[];
  pageToken: string;
}

export interface Schedules {
  schedules: Schedule[];
  pageToken: string;
}

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
export interface Job {
  id: string;
  name: string;
  endTime?: string;
  createTime?: string;
  gcsFile: string;
  state: string;
  link?: string;
  viewerLink?: string;
  downloadLink?: string;
  timeZone?: string;
}

/** UI interface used to represent a Scheduled Notebook Job */
export interface Execution extends Job {
  type: string;
  bucketLink?: string;
}

export interface Schedule extends Job {
  schedule: string;
}

/** AI Platform Job. */
/* eslint-disable @typescript-eslint/camelcase */
export type AiPlatformJob = gapi.client.ml.GoogleCloudMlV1__Job;

export type StorageObject = gapi.client.storage.Object;
