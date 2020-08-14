import { ServerConnection } from '@jupyterlab/services';
import { URLExt } from '@jupyterlab/coreutils';

export interface ModelDetailsObject {
  id: string;
  name: string;
  description: string;
  labels: string[];
  date_created: string;
  expires: string;
  location: string;
  last_modified: string;
  model_type: string;
  schema_labels: ModelSchema[];
  feature_columns: ModelSchema[];
  training_runs: string[];
}

export interface ModelSchema {
  name: string;
  type: string;
}

export interface ModelDetails {
  details: ModelDetailsObject;
}

interface TrainingRunDetailsObject {
  actual_iterations?: number; // int
  data_split_column?: any;
  data_split_eval_fraction?: number; // float
  data_split_method?: string; // model enum
  distance_type?: string; // model enum
  early_stop?: string; // BoolValue to string
  initial_learn_rate?: number; // float
  input_label_columns?: string; // could be an array?
  kmeans_initialization_column?: string;
  kmeans_initialization_method?: string; // model enum
  l1_regularization?: number; // DoubleValue
  l2_regularization?: number; // DoubleValue
  label_class_weights?: any; // _MODEL_TRAININGRUN_TRAININGOPTIONS_LABELCLASSWEIGHTSENTRY
  learn_rate?: number; // float
  learn_rate_strategy?: string; // model enum
  loss_type?: string; // model enum
  max_iterations?: number; // int
  min_relative_progress?: number; // DoubleValue
  model_uri?: string;
  num_clusters?: number; // int
  optimization_strategy?: string; // model enum
  warm_start?: string; // BoolValue
}

interface TrainingRunDetails {
  details: TrainingRunDetailsObject;
}

export class ModelDetailsService {
  async listModelDetails(modelId: string): Promise<ModelDetails> {
    return new Promise((resolve, reject) => {
      const serverSettings = ServerConnection.makeSettings();
      const requestUrl = URLExt.join(
        serverSettings.baseUrl,
        'bigquery/v1/modeldetails'
      );
      const body = { modelId: modelId };
      const requestInit: RequestInit = {
        body: JSON.stringify(body),
        method: 'POST',
      };
      ServerConnection.makeRequest(
        requestUrl,
        requestInit,
        serverSettings
      ).then(response => {
        response.json().then(content => {
          if (content.error) {
            console.error(content.error);
            reject(content.error);
            return [];
          }
          resolve({
            details: content.details,
          });
        });
      });
    });
  }

  async getTrainingRunDetails(
    modelId: string,
    runIndex: number
  ): Promise<TrainingRunDetails> {
    return new Promise((resolve, reject) => {
      const serverSettings = ServerConnection.makeSettings();
      const requestUrl = URLExt.join(
        serverSettings.baseUrl,
        'bigquery/v1/trainingRunDetails'
      );
      const body = { modelId: modelId, runIndex: runIndex };
      const requestInit: RequestInit = {
        body: JSON.stringify(body),
        method: 'POST',
      };
      ServerConnection.makeRequest(
        requestUrl,
        requestInit,
        serverSettings
      ).then(response => {
        response.json().then(content => {
          if (content.error) {
            console.error(content.error);
            reject(content.error);
            return [];
          }
          resolve({
            details: content.details,
          });
        });
      });
    });
  }
}
