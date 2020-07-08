from jupyterlab_bigquery.pagedAPI_handler import PagedAPIHandler
from google.cloud import bigquery
import json

class PagedQueryHandler(PagedAPIHandler):
  def query(self, request_body, page_size):
      client = bigquery.Client()

      query = request_body['query']
      jobConfig = request_body['jobConfig']

      job_config = bigquery.QueryJobConfig(*jobConfig)
      query_job = client.query(query, job_config=job_config)

      if query_job.error_result is not None:
          yield Exception(query_job.error_result)

      yield query_job, query_job.job_id
        
      # send contents
      en = query_job.result(page_size)
      for df in en.to_dataframe_iterable():
          response = {
          'content': df.to_json(orient='values'),
          'labels': json.dumps(df.columns.to_list())
          }
          yield(response)
    
  def cancel(self, job):
      job.cancel()
