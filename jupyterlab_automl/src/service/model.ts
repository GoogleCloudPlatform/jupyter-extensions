import { requestAPI } from './api_request';
import humanizeDuration from 'humanize-duration';

export type ModelType = 'OTHER' | 'TABLE' | 'IMAGE';
export type PipelineState =
  | 'CANCELLED'
  | 'CANCELLING'
  | 'FAILED'
  | 'PAUSED'
  | 'PENDING'
  | 'QUEUED'
  | 'RUNNING'
  | 'SUCCEEDED'
  | 'UNSPECIFIED';
export interface Model {
  id: string;
  displayName: string;
  pipelineId: string;
  createTime: Date;
  updateTime: Date;
  etag: string;
  modelType: ModelType;
  inputs?: object;
  deployedModels?: DeployedModel[];
}

export interface ClassificationPrediction {
  Scores: number[];
  Classes: number[];
}

export interface RegressionPrediction {
  Value: number;
  UpperBound: number;
  LowerBound: number;
}

export interface DeployedModel {
  deployedModelId: string;
  endpoint: string;
}

export interface Endpoint {
  deployedModelId: string;
  id: string;
  displayName: string;
  models: number;
  updateTime: Date;
}

export interface Pipeline {
  id: string;
  displayName: string;
  createTime: Date;
  updateTime: Date;
  elapsedTime: number | string;
  datasetId: string;
  trainBudgetMilliNodeHours: number | null;
  budgetMilliNodeHours: number | null;
  targetColumn: string | null;
  transformationOptions: any | null;
  predictionType: string | null;
  optimizationObjective: string | null;
  objective: string;
  state: string;
  error: string | null;
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

function formatTime(data: Model | Pipeline) {
  data.createTime = new Date(data.createTime);
  data.updateTime = new Date(data.updateTime);
  if ('elapsedTime' in data) {
    const humanizer = humanizeDuration.humanizer({
      round: true,
      language: 'shortEn',
      largest: 2,
      languages: {
        shortEn: {
          y: () => 'y',
          mo: () => 'mo',
          w: () => 'w',
          d: () => 'day',
          h: () => 'hr',
          m: () => 'min',
          s: () => 'sec',
        },
      },
    });
    data.elapsedTime = humanizer(Math.round(data.elapsedTime as number) * 1000);
  }
}

export abstract class ModelService {
  static async listModels(): Promise<Model[]> {
    const data = await requestAPI<Model[]>('v1/models');
    for (let i = 0; i < data.length; ++i) {
      formatTime(data[i]);
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
    formatTime(data);
    return data;
  }

  static async listPipelines(): Promise<Pipeline[]> {
    const data = await requestAPI<Pipeline[]>('v1/pipelines');
    for (let i = 0; i < data.length; ++i) {
      formatTime(data[i]);
    }
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

  static async getEndpoints(modelId: string): Promise<Endpoint[]> {
    const body = {
      modelId: modelId,
    };
    const requestInit: RequestInit = {
      body: JSON.stringify(body),
      method: 'POST',
    };
    const data = await requestAPI<Endpoint[]>('v1/getEndpoints', requestInit);
    for (let i = 0; i < data.length; ++i) {
      data[i].updateTime = new Date(data[i].updateTime);
    }
    return data;
  }

  static async checkDeploying(model: Model): Promise<Endpoint[]> {
    const body = {
      modelName: model.displayName,
    };
    const requestInit: RequestInit = {
      body: JSON.stringify(body),
      method: 'POST',
    };
    const data = await requestAPI<Endpoint[]>('v1/checkDeploying', requestInit);
    for (let i = 0; i < data.length; ++i) {
      data[i].updateTime = new Date(data[i].updateTime);
    }
    return data;
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
    inputs: object
  ): Promise<RegressionPrediction | ClassificationPrediction> {
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
