import { PagedServiceCallback, JobState, JobID } from './paged_service';
import { ServerConnection } from '@jupyterlab/services';
import { URLExt } from '@jupyterlab/coreutils';

export enum RequestType {
  START = 'start',
  CONTINUE = 'continue',
  CANCEL = 'cancel',
}

interface StartResponse {
  id: JobID;
}

interface ContinueResponse<ResponseType> {
  load: ResponseType;
  finish: boolean;
  error: undefined | string;
}

class PagedJob<RequestType, ResponseType> {
  jobState: JobState;
  jobId: JobID = null;
  requestUrl: string = null;
  serverSettings: ServerConnection.ISettings = null;

  constructor(
    private readonly callback: PagedServiceCallback<ResponseType>,
    private readonly endpoint: string,
    private readonly requestBody: RequestType,
    private readonly pageSize: number
  ) {
    this.setState(JobState.Pending);
    this.serverSettings = ServerConnection.makeSettings();
    this.requestUrl = URLExt.join(
      this.serverSettings.baseUrl,
      'bigquery/v1/' + this.endpoint
    );

    this.startjob();
  }

  async startjob() {
    try {
      const startRes = (await this.makeQuery(RequestType.START, {
        requestBody: this.requestBody,
        pageSize: this.pageSize,
      })) as StartResponse;
      this.jobId = startRes.id;

      while (this.getState() === JobState.Pending) {
        const res = (await this.makeQuery(RequestType.CONTINUE, {
          id: this.jobId,
        })) as ContinueResponse<ResponseType>;

        if (this.getState() !== JobState.Pending) {
          return;
        }

        this.setState(res.finish === true ? JobState.Done : this.jobState);
        this.callback(this.getState(), this.jobId, res.load);
      }
    } catch (err) {
      this.setState(JobState.Fail);
      this.callback(this.getState(), this.jobId, err);
    }
  }

  async cancel(): Promise<void> {
    if (this.getState() !== JobState.Pending) {
      console.warn('Attempting to cancel job already done');
    }

    let message = 'canceled';

    try {
      await this.makeQuery(RequestType.CANCEL, {
        id: this.jobId,
      });
    } catch (err) {
      message = 'already canceled';
    } finally {
      this.setState(JobState.Fail);
      this.callback(this.getState(), this.jobId, message);
    }
  }

  async makeQuery(intention, load) {
    return new Promise((resolve, reject) => {
      const body = {
        intention,
        load,
      };

      const requestInit: RequestInit = {
        body: JSON.stringify(body),
        method: 'POST',
      };

      ServerConnection.makeRequest(
        this.requestUrl,
        requestInit,
        this.serverSettings
      ).then(response => {
        response.json().then(content => {
          const err = JSON.parse(content.error);
          // eslint-disable-next-line no-extra-boolean-cast
          if (!!err) {
            reject(err);
            return;
          }

          for (const key in content) {
            content[key] = JSON.parse(content[key]);
          }

          resolve(content);
        });
      });
    });
  }

  getState(): JobState {
    return this.jobState;
  }

  setState(newState: JobState) {
    this.jobState = newState;
  }

  getJobId(): JobID {
    return this.jobId;
  }
}

export default PagedJob;
