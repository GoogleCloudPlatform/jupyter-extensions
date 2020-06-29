/* eslint-disable @typescript-eslint/no-explicit-any */
import CacheManager from './cache_manager';
import PagedJob from './pagedJob';

export enum JobState {
  Pending,
  Done,
  Fail,
}
export type JobID = string;
export type PagedServiceCallback<R> = (
  state: JobState,
  jobId: JobID,
  response: R
) => void;

class PagedService<RequestType, ResponseType> {
  cacheManager: CacheManager = null;
  cacheId: string = null;

  constructor(
    private readonly ifCache: boolean,
    private readonly endPoint: string
  ) {
    if (ifCache) {
      // register cache
      this.cacheManager = CacheManager.getInstance();
      this.cacheId = this.cacheManager.register();
    }
  }

  private async updateCache(key: string, content: ResponseType) {
    this.cacheManager.put(this.cacheId, key, content);
  }

  request(
    requestBody: RequestType,
    callBack: PagedServiceCallback<ResponseType>,
    pageSize = 200
  ): PagedJob<RequestType, ResponseType> {
    // prepare key and call back for job
    const jobCallback = (state, jobId, response) => {
      callBack(state, jobId, response);

      if (this.ifCache && state !== JobState.Fail) {
        this.updateCache(jobId, response);
      }
    };

    return new PagedJob<RequestType, ResponseType>(
      jobCallback.bind(this),
      this.endPoint,
      requestBody,
      pageSize
    );
  }
}

export default PagedService;
