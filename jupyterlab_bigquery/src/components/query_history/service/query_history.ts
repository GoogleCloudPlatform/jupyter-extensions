import { ServerConnection } from '@jupyterlab/services';
import { URLExt } from '@jupyterlab/coreutils';

export interface QueryHistory {
  jobs: JobsObject;
  jobIds: string[];
  lastFetchTime: number;
}

export interface JobIdsObject {
  [key: string]: string[];
}

export interface JobsObject {
  [key: string]: Job;
}

export interface JobDetailsObject {
  query: string;
  id: string;
  user: string;
  location: string;
  created: string;
  started: string;
  ended: string;
  duration: number;
  bytesProcessed: number;
  priority: string;
  destination: string;
  useLegacySql: boolean;
  state: string;
  errors: ErrorResult[];
  errorResult: ErrorResult;
  from_cache: boolean;
  project: string;
}

interface ErrorResult {
  location: string;
  message: string;
  reason: string;
}

export interface Job {
  query: string;
  id: string;
  created: string;
  errored: boolean;
  details?: JobDetailsObject;
}

interface JobDetails {
  job: JobDetailsObject;
}

export class QueryHistoryService {
  async getQueryHistory(
    projectId: string,
    lastFetchTime?: number
  ): Promise<QueryHistory> {
    return new Promise((resolve, reject) => {
      const serverSettings = ServerConnection.makeSettings();
      const requestUrl = URLExt.join(
        serverSettings.baseUrl,
        'bigquery/v1/projectQueryHistory'
      );
      const body = { projectId, lastFetchTime };

      const requestInit: RequestInit = {
        body: JSON.stringify(body),
        method: 'POST',
      };
      ServerConnection.makeRequest(
        requestUrl,
        requestInit,
        serverSettings
      ).then(response => {
        response.json().then(data => {
          if (data.error) {
            console.error(data.error);
            reject(data.error);
            return [];
          }
          resolve({
            jobs: data.jobs,
            jobIds: data.jobIds,
            lastFetchTime: data.lastFetchTime,
          });
        });
      });
    });
  }
}

export class QueryDetailsService {
  async getQueryDetails(jobId: string): Promise<JobDetails> {
    return new Promise((resolve, reject) => {
      const serverSettings = ServerConnection.makeSettings();
      const requestUrl = URLExt.join(
        serverSettings.baseUrl,
        'bigquery/v1/getQueryDetails'
      );
      const body = { jobId: jobId };
      const requestInit: RequestInit = {
        body: JSON.stringify(body),
        method: 'POST',
      };
      ServerConnection.makeRequest(
        requestUrl,
        requestInit,
        serverSettings
      ).then(response => {
        response.json().then(data => {
          if (data.error) {
            console.error(data.error);
            reject(data.error);
            return [];
          }
          resolve({
            job: data,
          });
        });
      });
    });
  }
}
