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
  modelType: ModelType;
  inputs?: object;
  deployedModels?: DeployedModel[];
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
  trainBudgetMilliNodeHours?: number;
  budgetMilliNodeHours?: number;
  targetColumn?: string;
  transformationOptions?: any;
  predictionType?: string;
  optimizationObjective?: string;
  objective: string;
  state: string;
  error?: string;
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

function createRequest(body: object): RequestInit {
  return {
    body: JSON.stringify(body),
    method: 'POST',
  };
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
    await requestAPI('v1/deleteModel', createRequest(body));
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
    const data = await requestAPI<Endpoint[]>(
      'v1/getEndpoints',
      createRequest(body)
    );
    for (let i = 0; i < data.length; ++i) {
      data[i].updateTime = new Date(data[i].updateTime);
    }
    return data;
  }

  static async getDeployingEndpoints(
    model: Model,
    endpointId: string
  ): Promise<Endpoint[]> {
    const body = {
      modelName: model.displayName,
      endpointId: endpointId,
    };
    const data = await requestAPI<Endpoint[]>(
      'v1/getDeployingEndpoints',
      createRequest(body)
    );
    for (let i = 0; i < data.length; ++i) {
      data[i].updateTime = new Date(data[i].updateTime);
    }
    return data;
  }

  static async getAllEndpoints(): Promise<Endpoint[]> {
    const data = await requestAPI<Endpoint[]>('v1/getAllEndpoints');
    for (let i = 0; i < data.length; ++i) {
      data[i].updateTime = new Date(data[i].updateTime);
    }
    return data;
  }

  static async deployModel(
    modelId: string,
    machineType: string,
    endpointId: string
  ): Promise<void> {
    const body = {
      modelId: modelId,
      machineType: machineType,
      endpointId: endpointId !== '' ? endpointId : null,
    };
    await requestAPI('v1/deployModel', createRequest(body));
  }

  static async undeployModel(
    deployedModelId: string,
    endpointId: string
  ): Promise<void> {
    const body = {
      deployedModelId: deployedModelId,
      endpointId: endpointId,
    };
    await requestAPI('v1/undeployModel', createRequest(body));
  }

  static async deleteEndpoint(endpointId: string): Promise<void> {
    const body = {
      endpointId: endpointId,
    };
    await requestAPI('v1/deleteEndpoint', createRequest(body));
  }

  static async predict(endpointId: string, inputs: object): Promise<object> {
    const body = {
      endpointId: endpointId,
      inputs: inputs,
    };
    return await requestAPI('v1/predict', createRequest(body));
  }
}
