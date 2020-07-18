from jupyterlab_bigquery.pagedAPI_handler import PagedAPIHandler
from google.cloud import bigquery
import json
from jupyterlab_bigquery.handlers import format_preview_fields, format_preview_row




class PagedQueryHandler(PagedAPIHandler):
  client = bigquery.Client()

  def query(self, request_body, page_size):
    query = request_body['query']
    jobConfig = request_body['jobConfig']
    dryRunOnly = request_body['dryRunOnly']

    # dry run, will throw exception if fail
    dry_run_job_config = bigquery.QueryJobConfig(dry_run=True,
                                                 use_query_cache=False)
    try:
      dry_run_job = PagedQueryHandler.client.query(
          query, job_config=dry_run_job_config)
    except Exception as err:
      if hasattr(err, 'errors'):
        raise Exception(err.errors[0]['message'])
      else:
        raise Exception(err)
    total_bytes_processed = dry_run_job.total_bytes_processed

    if dryRunOnly:
      yield dry_run_job, dry_run_job.job_id
      return

    # actual run
    job_config = bigquery.QueryJobConfig(*jobConfig)
    query_job = PagedQueryHandler.client.query(query, job_config=job_config)

    if query_job.error_result is not None:
      raise Exception(query_job.error_result)

    yield query_job, query_job.job_id

    # send contents
    en = query_job.result(page_size)
    schema_fields = format_preview_fields(en.schema)

    for page in en.pages:
      response = {
          'content': json.dumps([format_preview_row(row) for row in page]),
          'labels': json.dumps(schema_fields),
          'bytesProcessed': json.dumps(total_bytes_processed)
      }
      yield (response)

  def cancel(self, job):
    job.cancel()
