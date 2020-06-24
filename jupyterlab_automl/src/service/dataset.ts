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
export type DatasetType = 'TBL' | 'ICN' | 'IOD' | 'other';
export interface Dataset {
  id: string; // Resource name of dataset
  displayName: string;
  description: string;
  createTime: Date;
  exampleCount: number;
  metadata: any;
  datasetType: DatasetType;
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
    for (let i = 0; i < data.length; ++i) {
      data[i].createTime = new Date(data[i].createTime);
    }
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

  static async listTableSpecs(datasetId: string): Promise<TableSpec[]> {
    const query = '?datasetId=' + datasetId;
    const data = (await requestAPI<TableInfo>('v1/tableInfo' + query))
      .tableSpecs;
    return data;
  }
}
