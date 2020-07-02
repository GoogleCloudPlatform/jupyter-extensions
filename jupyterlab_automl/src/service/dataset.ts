import { requestAPI } from './api_request';

export type ColumnType =
  | 'Numerical'
  | 'Categorical'
  | 'Array'
  | 'Timestamp'
  | 'String'
  | 'Struct'
  | 'Unspecified'
  | 'Unrecognized';

export type DatasetType = 'OTHER' | 'TABLE' | 'IMAGE';

export interface Dataset {
  id: string; // Resource name of dataset
  displayName: string;
  createTime: Date;
  updateTime: Date;
  etag: string;
  datasetType: DatasetType;
  metadata: any;
}

export interface ColumnSpec {
  id: string;
  dataType: string;
  displayName: string;
  distinctValueCount: number;
  invalidValueCount: number;
  nullValueCount: string;
  nullable: boolean;
  detailPanel: any;
}

export interface TableSpec {
  id: string;
  rowCount: number;
  validRowCount: number;
  columnCount: number;
  columnSpecs: ColumnSpec[];
  chartSummary: any[];
}

export interface TableInfo {
  tableSpecs: TableSpec[];
}

export interface Datasets {
  datasets: Dataset[];
}

export abstract class DatasetService {
  static async listDatasets(): Promise<Dataset[]> {
    const data = (await requestAPI<Datasets>('v1/datasets')).datasets;
    return data;
  }

  static async deleteDataset(datasetId: string): Promise<void> {
    const body = {
      datasetId: datasetId,
    };
    const requestInit: RequestInit = {
      body: JSON.stringify(body),
      method: 'POST',
    };
    await requestAPI('v1/deleteDataset', requestInit);
  }

  static async createTablesDataset(
    displayName: string,
    gcsSource: string | null,
    bigquerySource: string | null
  ) {
    const body = {
      displayName: displayName,
      gcsSource: gcsSource,
      bigquerySource: bigquerySource,
    };
    const requestInit: RequestInit = {
      body: JSON.stringify(body),
      method: 'POST',
    };
    await requestAPI('v1/createTablesDataset', requestInit);
  }
}
