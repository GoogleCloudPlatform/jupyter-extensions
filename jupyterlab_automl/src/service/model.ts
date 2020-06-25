import { requestAPI } from './api_request';

export interface Model {
  id: string; // Resource name of dataset
  displayName: string;
  datasetId: string;
  updateTime: Date;
  deploymentState: number;
  metadata: any;
}

interface Models {
  models: Model[];
}

export abstract class ModelService {
  static async listModels(): Promise<Model[]> {
    const data = (await requestAPI<Models>('v1/models')).models;
    for (let i = 0; i < data.length; ++i) {
      data[i].updateTime = new Date(data[i].updateTime);
    }
    return data;
  }

  static async deleteModel(modelId: string): Promise<void> {
    const body = {
      modelId: modelId,
    };
    const requestInit: RequestInit = {
      body: JSON.stringify(body),
      method: 'POST',
    };
    await requestAPI('v1/deleteModel', requestInit);
  }
}
