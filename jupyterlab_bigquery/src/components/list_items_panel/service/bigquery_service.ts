

import {
  ServerProxyTransportService,
  TransportService,
  GET,
} from 'gcp_jupyterlab_shared';
import {Project} from './list_items';

const BIGQUERY = 'https://content-bigquery.googleapis.com/bigquery/v2';

interface DatasetReference {
  datasetId: string,
  projectId: string,
}

interface Dataset {
  kind: string,
  id: string,
  datasetReference: DatasetReference,
  labels,
  friendlyName: string,
  location: string
}

interface DatasetList {
  kind: string,
  etag: string,
  nextPageToken: string,
  datasets: Dataset[],
}

/**
 * Class to interact with BigQuery services.
 */
export class BigQueryService {

  constructor(
    private _transportService: TransportService,
  ) {}

  async listDatasets(project: Project): Promise<Project> {
    const _transportService = new ServerProxyTransportService()
    this._transportService;
    return _transportService.submit({
      path: `${BIGQUERY}/projects/${project.id}/datasets`,
      method: GET,
      headers: { 'Content-Type': 'application/json' },
      params: {
        all: true,
      },
    }).then((response) => {
      const datasetIds = [];
      const datasets = {};

      (response.result as DatasetList).datasets.forEach((dataset) => {
        const datasetReference:DatasetReference = dataset.datasetReference;

        const datasetId = `${datasetReference.projectId}.${datasetReference.datasetId}`;
        datasetIds.push(datasetId);
        datasets[datasetId] = {
          id: datasetId,
          name: datasetReference.datasetId,
          projectId: datasetReference.projectId,
        }
      });

      return {
        ...project,
        datasetIds: datasetIds as [],
        datasets: datasets,
      };
    });
  }
}
