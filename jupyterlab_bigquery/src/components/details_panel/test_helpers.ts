export const FakeDatasetDetailsFull = {
  id: 'projectId.datasetId',
  description: 'description of dataset',
  project: 'projectId',
  labels: ['label: value', 'another label: another value'],
  name: 'datasetId',
  location: 'US',
  link: 'Fakelink.com',
  /* eslint-disable @typescript-eslint/camelcase*/
  date_created: '2020-06-15T19:15:23.255000+00:00',
  last_modified: '2020-07-14T16:52:02.528000+00:00',
  default_expiration: 17280000000,
  /* eslint-enable @typescript-eslint/camelcase*/
};

export const FakeDatasetDetailsEmpty = {
  id: 'projectId.datasetId',
  description: null,
  project: 'projectId',
  labels: null,
  name: 'datasetId',
  location: 'US',
  link: 'Fakelink.com',
  /* eslint-disable @typescript-eslint/camelcase*/
  date_created: '2020-06-15T19:15:23.255000+00:00',
  last_modified: '2020-07-14T16:52:02.528000+00:00',
  default_expiration: null,
  /* eslint-enable @typescript-eslint/camelcase*/
};

export const FakeTableDetailsFull = {
  id: 'projectId.datasetId.tableId',
  project: 'projectId',
  dataset: 'datsetId',
  name: 'tableId',
  description: 'description of table',
  labels: ['label: value', 'another label: another value'],
  expires: '2020-08-15T16:52:02.528000+00:00',
  location: 'US',
  link: 'Fakelink.com',
  /* eslint-disable @typescript-eslint/camelcase*/
  date_created: '2020-06-15T19:15:23.255000+00:00',
  last_modified: '2020-07-14T16:52:02.528000+00:00',
  num_rows: 123456,
  num_bytes: 12345600,
  /* eslint-enable @typescript-eslint/camelcase*/
  schema: [
    {
      name: 'record',
      type: 'RECORD',
      description: 'this field is a record',
      mode: 'NULLABLE',
    },
    {
      name: 'record.child',
      type: 'STRING',
      description: 'this field is a string and a child',
      mode: 'NULLABLE',
    },
  ],
};

export const FakeTableDetailsEmpty = {
  id: 'projectId.datasetId.tableId',
  project: 'projectId',
  dataset: 'datsetId',
  name: 'tableId',
  description: null,
  labels: null,
  expires: null,
  location: 'US',
  link: 'Fakelink.com',
  /* eslint-disable @typescript-eslint/camelcase*/
  date_created: '2020-06-15T19:15:23.255000+00:00',
  last_modified: '2020-07-14T16:52:02.528000+00:00',
  num_rows: 123456,
  num_bytes: 12345600,
  /* eslint-enable @typescript-eslint/camelcase*/
  schema: [],
};

export const FakeViewDetailsFull = {
  id: 'projectId.datasetId.viewId',
  project: 'projectId',
  name: 'viewId',
  description: 'description of view',
  labels: ['label: value', 'another label: another value'],
  expires: '2020-08-15T16:52:02.528000+00:00',
  location: 'US',
  link: 'Fakelink.com',
  query: 'SELECT * FROM `projectId.datasetId.tableId` LIMIT 100',
  /* eslint-disable @typescript-eslint/camelcase*/
  date_created: '2020-06-15T19:15:23.255000+00:00',
  last_modified: '2020-07-14T16:52:02.528000+00:00',
  legacy_sql: true,
  /* eslint-enable @typescript-eslint/camelcase*/
};

export const FakeModelDetailsFullSchema = {
  id: 'projectId.datasetId.modelId',
  name: 'modelId',
  description: 'description of model',
  labels: ['label: value', 'another label: another value'],
  expires: '2020-08-15T16:52:02.528000+00:00',
  location: 'US',
  /* eslint-disable @typescript-eslint/camelcase*/
  date_created: '2020-06-15T19:15:23.255000+00:00',
  last_modified: '2020-07-14T16:52:02.528000+00:00',
  model_type: 'LINEAR_REGRESSION',
  schema_labels: [{ name: 'predicted_field', type: 'FLOAT' }],
  feature_columns: [
    { name: 'feature_0', type: 'INTEGER' },
    { name: 'feature_1', type: 'FLOAT' },
  ],
  training_runs: ['2020-06-15T19:15:23.255000+00:00'],
  /* eslint-enable @typescript-eslint/camelcase*/
};

export const FakeModelDetailsEmptySchema = {
  id: 'projectId.datasetId.modelId',
  name: 'modelId',
  description: null,
  labels: null,
  expires: null,
  location: 'US',
  /* eslint-disable @typescript-eslint/camelcase*/
  date_created: '2020-06-15T19:15:23.255000+00:00',
  last_modified: '2020-07-14T16:52:02.528000+00:00',
  model_type: 'LINEAR_REGRESSION',
  schema_labels: [],
  feature_columns: [],
  training_runs: ['2020-06-15T19:15:23.255000+00:00'],
  /* eslint-enable @typescript-eslint/camelcase*/
};

export const FakeTrainingRunDetails = {
  /* eslint-disable @typescript-eslint/camelcase*/
  actual_iterations: 3,
  data_split_column: 'column_name_1',
  data_split_eval_fraction: 0.3,
  data_split_method: 'RANDOM',
  distance_type: 'EUCLIDEAN',
  early_stop: 'False',
  initial_learn_rate: 0.1,
  input_label_columns: "['column1', 'column2']",
  kmeans_initialization_column: 'column_name_2',
  kmeans_initialization_method: 'RANDOM',
  l1_regularization: 0.5,
  l2_regularization: 0.6,
  label_class_weights: '[0.2, 0.3]',
  learn_rate: 0.7,
  learn_rate_strategy: 'LINE_SEARCH',
  loss_type: 'MEAN_SQUARED_LOSS',
  max_iterations: 20,
  min_relative_progress: 0.4,
  model_uri: 'model.uri.string',
  num_clusters: 7,
  optimization_strategy: 'BATCH_GRADIENT_DESCENT',
  warm_start: 'True',
  /* eslint-enable @typescript-eslint/camelcase*/
};
