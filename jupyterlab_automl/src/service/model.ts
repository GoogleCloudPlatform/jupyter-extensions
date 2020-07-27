import { requestAPI } from './api_request';

export type ModelType = 'OTHER' | 'TABLE' | 'IMAGE';

export interface Model {
  id: string;
  displayName: string;
  pipelineId: string;
  createTime: Date;
  updateTime: Date;
  etag: string;
  modelType: string;
}

export interface Prediction {
  label: string;
  confidence: string;
}

export interface DeployedModel {
  deployedModelId: string;
  endpointId: string;
}

export interface CheckDeployedResponse {
  state: number;
  deployedModel?: DeployedModel;
}

export interface Pipeline {
  id: string;
  displayName: string;
  createTime: Date;
  updateTime: Date;
  elapsedTime: number;
  datasetId: string;
  trainBudgetMilliNodeHours: number | null;
  budgetMilliNodeHours: number | null;
  targetColumn: string | null;
  transformationOptions: any | null;
  predictionType: string | null;
  optimizationObjective: string | null;
}

export interface ModelMetrics {
  confidenceThreshold: number;
  f1Score: number | string;
  f1ScoreAt1: number | string;
  precision: number | string;
  precisionAt1: number | string;
  recall: number | string;
  recallAt1: number | string;
  trueNegativeCount: number | string;
  truePositiveCount: number | string;
  falseNegativeCount: number | string;
  falsePositiveCount: number | string;
  falsePositiveRate: number | string;
  falsePositiveRateAt1: number | string;
}

export interface ModelEvaluation {
  auPrc: number;
  auRoc: number;
  logLoss: number;
  confidenceMetrics: ModelMetrics[];
  createTime: Date;
  featureImportance: any[];
  confusionMatrix: any[];
}

export abstract class ModelService {
  static async listModels(): Promise<Model[]> {
    const data = await requestAPI<Model[]>('v1/models');
    for (let i = 0; i < data.length; ++i) {
      data[i].createTime = new Date(data[i].createTime);
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

  static async getPipeline(pipelineId: string): Promise<Pipeline> {
    const query = '?pipelineId=' + pipelineId;
    const data = await requestAPI<Pipeline>('v1/pipeline' + query);
    data.createTime = new Date(data.createTime);
    data.updateTime = new Date(data.updateTime);
    return data;
  }

  static async getModelEvaluation(modelId: string): Promise<ModelEvaluation> {
    const query = '?modelId=' + modelId;
    const data = await requestAPI<ModelEvaluation>(
      'v1/modelEvaluation' + query
    );
    data.createTime = new Date(data.createTime);
    return data;
  }

  static async checkDeployed(modelId: string): Promise<CheckDeployedResponse> {
    const body = {
      modelId: modelId,
    };
    const requestInit: RequestInit = {
      body: JSON.stringify(body),
      method: 'POST',
    };
    return await requestAPI('v1/checkDeployed', requestInit);
  }

  static async deployModel(modelId: string): Promise<void> {
    const body = {
      modelId: modelId,
    };
    const requestInit: RequestInit = {
      body: JSON.stringify(body),
      method: 'POST',
    };
    await requestAPI('v1/deployModel', requestInit);
  }

  static async undeployModel(
    deployedModelId: string,
    endpointId: string
  ): Promise<void> {
    const body = {
      deployedModelId: deployedModelId,
      endpointId: endpointId,
    };
    const requestInit: RequestInit = {
      body: JSON.stringify(body),
      method: 'POST',
    };
    await requestAPI('v1/undeployModel', requestInit);
  }

  static async deleteEndpoint(endpointId: string): Promise<void> {
    const body = {
      endpointId: endpointId,
    };
    const requestInit: RequestInit = {
      body: JSON.stringify(body),
      method: 'POST',
    };
    await requestAPI('v1/deleteEndpoint', requestInit);
  }

  static async predict(
    endpointId: string,
    inputs: string
  ): Promise<Prediction[]> {
    const body = {
      endpointId: endpointId,
      inputs: inputs,
    };
    const requestInit: RequestInit = {
      body: JSON.stringify(body),
      method: 'POST',
    };
    return await requestAPI('v1/predict', requestInit);
  }
}
