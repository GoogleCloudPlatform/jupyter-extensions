import { PagedServiceCallback, JobState, JobID } from './paged_service';

class PagedJob<RequestType, ResponseType> {
  jobState: JobState;
  jobId: JobID = null;

  constructor(
    private readonly callback: PagedServiceCallback<ResponseType>,
    private readonly endpoint: string,
    private readonly requestBody: RequestType,
    private readonly pageSize: number
  ) {
    this.jobState = JobState.Pending;
  }

  async startjob() {
    // TODO: make initial query to get id

    while (this.getState() === JobState.Pending) {
      // TODO: make query, handle error
    }
  }

  cancel(): void {
    // TODO: cancel job
  }

  getState(): JobState {
    return this.jobState;
  }

  getJobId(): JobID {
    return this.jobId;
  }
}

export default PagedJob;
