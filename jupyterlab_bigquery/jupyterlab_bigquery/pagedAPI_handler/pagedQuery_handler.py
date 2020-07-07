from jupyterlab_bigquery.pagedAPI_handler import PagedAPIHandler
from google.cloud import bigquery
import json

class PagedQueryHandler(PagedAPIHandler):
  client = bigquery.Client()

  def query(self, request_body, page_size):
    query = request_body['query']
    jobConfig = request_body['jobConfig']

    # dry run, will throw exception if fail
    dry_run_job_config = bigquery.QueryJobConfig(dry_run=True, use_query_cache=False)
    try:
      dry_run_job = PagedQueryHandler.client.query(query, job_config=dry_run_job_config)
    except Exception as err:
      yield err
    total_bytes_processed = dry_run_job.total_bytes_processed

    # actual run
    job_config = bigquery.QueryJobConfig(*jobConfig)
    query_job = PagedQueryHandler.client.query(query, job_config=job_config)


    if query_job.error_result is not None:
        yield Exception(query_job.error_result)

    yield query_job, query_job.job_id
      
    # send contents
    en = query_job.result(page_size)

    for df in en.to_dataframe_iterable():
        response = {
        'content': df.to_json(orient='values'),
        'labels': json.dumps(df.columns.to_list()),
        'bytesProcessed': json.dumps(total_bytes_processed),
        }
        yield(response)
    
  def cancel(self, job):
    job.cancel()
