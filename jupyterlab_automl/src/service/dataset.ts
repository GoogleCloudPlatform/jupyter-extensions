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

export interface TablesDatasetOptions {
  gcsSource?: string;
  bigquerySource?: string;
  fileSource?: File;
  dfSource?: string;
}

function toBase64(file: File) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = error => reject(error);
  });
}

export abstract class DatasetService {
  static async listDatasets(): Promise<Dataset[]> {
    const data = await requestAPI<Dataset[]>('v1/datasets');
    for (let i = 0; i < data.length; ++i) {
      data[i].createTime = new Date(data[i].createTime);
      data[i].updateTime = new Date(data[i].updateTime);
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

  static async createTablesDataset(
    displayName: string,
    options: TablesDatasetOptions
  ) {
    const body = {
      displayName: displayName,
      gcsSource: options.gcsSource,
      bigquerySource: options.bigquerySource,
      fileSource: options.fileSource
        ? {
            name: options.fileSource.name,
            data: await toBase64(options.fileSource),
          }
        : null,
      dfSource: options.dfSource,
    };
    const requestInit: RequestInit = {
      body: JSON.stringify(body),
      method: 'POST',
    };
    await requestAPI('v1/createTablesDataset', requestInit);
  }
}
