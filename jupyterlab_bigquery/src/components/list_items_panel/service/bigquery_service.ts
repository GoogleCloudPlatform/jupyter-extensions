import { TransportService, GET } from 'gcp_jupyterlab_shared';
import { Dataset, Project } from './list_items';
import * as BigQueryApiTypes from './bigquery_api_types';

const BIGQUERY = 'https://content-bigquery.googleapis.com/bigquery/v2';

/**
 * Class to interact with BigQuery services.
 */
export class BigQueryService {
  constructor(private _transportService: TransportService) {}

  async listDatasets(project: Project): Promise<Project> {
    const response = await this._transportService
      .submit({
        path: `${BIGQUERY}/projects/${project.id}/datasets`,
        method: GET,
        headers: { 'Content-Type': 'application/json' },
        params: {
          all: true,
        },
      });
    const datasetListResult = response.result as BigQueryApiTypes.DatasetList;

    const datasetIds = [];
    const datasets = {};

    if (datasetListResult.datasets) {
      for (const dataset of datasetListResult.datasets) {
        const datasetReference: BigQueryApiTypes.DatasetReference =
          dataset.datasetReference;

        const datasetId = `${datasetReference.projectId}.${datasetReference.datasetId}`;
        datasetIds.push(datasetId);
        datasets[datasetId] = {
          id: datasetId,
          name: datasetReference.datasetId,
          projectId: datasetReference.projectId,
        };
      }
    }

    return {
      ...project,
      datasetIds: datasetIds,
      datasets: datasets,
    };
  }

  async listTables(projectId, datasetId): Promise<Partial<Dataset>> {
    const response = await this._transportService
      .submit({
        path: `${BIGQUERY}/projects/${projectId}/datasets/${datasetId}/tables`,
        method: GET,
        headers: { 'Content-Type': 'application/json' },
      })
    const tableListResult = response.result as BigQueryApiTypes.TableList;
    const tableIds = [];
    const tables = {};

    if (tableListResult.totalItems) {
      for (const table of tableListResult.tables) {
        const tableReference: BigQueryApiTypes.TableReference =
          table.tableReference;

        const tableId = `${tableReference.projectId}.${tableReference.datasetId}.${tableReference.tableId}`;
        tableIds.push(tableId);

        let legacySql = null;
        if ('view' in table) {
          legacySql = table['view'].useLegacySql;
        }

        tables[tableId] = {
          id: tableId,
          name: tableReference.tableId,
          datasetId: tableReference.datasetId,
          type: table.type,
          legacySql: legacySql,
          partitioned: 'timePartitioning' in table,
        };
      }
    }
    return {
      tables: tables,
      tableIds: tableIds,
    };
  }

  async listModels(projectId, datasetId): Promise<Partial<Dataset>> {
    const response = await this._transportService
      .submit({
        path: `${BIGQUERY}/projects/${projectId}/datasets/${datasetId}/models`,
        method: GET,
        headers: { 'Content-Type': 'application/json' },
      })
    const modelListResult = response.result as BigQueryApiTypes.ModelList;
    const modelIds = [];
    const models = {};

    if (modelListResult.models) {
      for (const model of modelListResult.models) {
        const modelReference: BigQueryApiTypes.ModelReference =
          model.modelReference;

        const modelId = `${modelReference.projectId}.${modelReference.datasetId}.${modelReference.modelId}`;
        modelIds.push(modelId);

        models[modelId] = {
          id: modelId,
          name: modelReference.modelId,
          datasetId: modelReference.datasetId,
          type: model.modelType,
        };
      }
    }
    return {
      models: models,
      modelIds: modelIds,
    };
  }
}
