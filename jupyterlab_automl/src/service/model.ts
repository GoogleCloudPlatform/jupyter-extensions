import { requestAPI } from './api_request';

export interface Model {
  id: string; // Resource name of dataset
  displayName: string;
  pipelineId: string;
  createTime: Date;
  updateTime: Date;
  etag: string;
}

interface Models {
  models: Model[];
}

export abstract class ModelService {
  static async listModels(): Promise<Model[]> {
    const data = (await requestAPI<Models>('v1/models')).models;
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
