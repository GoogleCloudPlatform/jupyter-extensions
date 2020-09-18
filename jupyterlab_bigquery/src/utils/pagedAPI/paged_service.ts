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
  response: R | Error | string
) => void;

class PagedService<RequestType, ResponseType> {
  cacheId: string = null;

  constructor(private readonly endPoint: string) {}

  request(
    requestBody: RequestType,
    callBack: PagedServiceCallback<ResponseType>,
    pageSize = 200
  ): PagedJob<RequestType, ResponseType> {
    return new PagedJob<RequestType, ResponseType>(
      callBack,
      this.endPoint,
      requestBody,
      pageSize
    );
  }
}

export default PagedService;
