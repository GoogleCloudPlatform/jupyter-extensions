/**
 * For easier testing of code using nested objects
 */
import {
  Study,
  StudyConfig,
  MetricSpec,
  ParameterSpec,
  State,
  Trial,
  Measurement,
  TrialState,
} from '../types';

export const fakeProjectId = 'project-id';
export const fakeRegion = 'us-region';

export const fakeStudyName =
  'projects/project-id/locations/us-region/studies/study-default';
export const cleanFakeStudyName = 'study-default';

export const fakeTrialName =
  'projects/project-id/locations/us-region/studies/study-default/trials/trial-default';
export const cleanFakeTrialName = 'trial-default';

export const fakeOperationName =
  'projects/project-id/locations/us-region/operations/operation-name';
export const fakeCleanOperationName = 'operation-name';

export const fakeCreateTime = '2020-07-23T18:34:52Z';

export const fakeMetricUnspecified = {
  goal: 'GOAL_TYPE_UNSPECIFIED',
  metric: 'metric-unspecified',
} as MetricSpec;

export const fakeMetricMaximize = {
  goal: 'MAXIMIZE',
  metric: 'metric-maximize',
} as MetricSpec;

export const fakeMetrics: MetricSpec[] = [
  fakeMetricUnspecified,
  fakeMetricMaximize,
];

export const fakeParamCategorical = {
  parameter: 'param-categorical',
  type: 'CATEGORICAL',
  categoricalValueSpec: {
    values: ['a', 'b', 'c', 'categorical-type'],
  },
} as ParameterSpec;

export const fakeParamDiscrete = {
  parameter: 'param-discrete',
  type: 'DISCRETE',
  discreteValueSpec: {
    values: [1, 2, 3, 556],
  },
} as ParameterSpec;

export const fakeParameters: ParameterSpec[] = [
  fakeParamCategorical,
  fakeParamDiscrete,
];

export const fakeStudyConfig = {
  metrics: fakeMetrics,
  parameters: fakeParameters,
  algorithm: 'ALGORITHM_UNSPECIFIED',
} as StudyConfig;

export const fakeStudy = {
  name: fakeStudyName,
  studyConfig: fakeStudyConfig,
} as Study;

export const fakeStudyResponseActive = {
  name: fakeStudyName,
  studyConfig: fakeStudyConfig,
  state: State.ACTIVE,
  createTime: fakeCreateTime,
};

export const fakeStudyResponseInactive = {
  name: 'study-inactive',
  studyConfig: fakeStudyConfig,
  state: State.INACTIVE,
  createTime: '2',
} as Study;

export const fakeStudyListResponse: Study[] = [
  fakeStudyResponseActive,
  fakeStudyResponseInactive,
];

export const fakeTrial: Trial = {
  name: fakeTrialName,
  state: TrialState.ACTIVE,
  parameters: [
    {
      parameter: 'param-discrete',
      floatValue: 556,
    },
    {
      parameter: 'param-categorical',
      stringValue: 'categorical-type',
    },
  ],
  measurements: [],
  startTime: '1',
  endTime: '2',
  clientId: 'optimizer-extension',
};

export const fakeTrialWithFinalMeasurement: Trial = {
  ...fakeTrial,
  state: TrialState.COMPLETED,
  finalMeasurement: {
    stepCount: '1',
    metrics: [
      {
        metric: 'metric-maximize',
        value: 101,
      },
      {
        metric: 'metric-unspecified',
        value: 666,
      },
    ],
  },
};

export const fakeMeasurement: Measurement = {
  elapsedTime: '1',
  stepCount: '100',
  metrics: [
    {
      metric: 'a',
      value: 77,
    },
  ],
};

export const fakePendingSuggestOperation = {
  name: fakeOperationName,
  metadata: {
    '@type': 'type.googleapis.com/google.cloud.ml.v1.SuggestTrialsMetadata',
    study: fakeStudyName,
    createTime: '2020-07-17T16:05:11Z',
    suggestionCount: 10,
    clientId: 'optimizer-extension',
  },
};

export const fakeSuggestOperationGetSuccess = {
  name: fakeOperationName,
  metadata: {
    '@type': 'type.googleapis.com/google.cloud.ml.v1.SuggestTrialsMetadata',
    study: fakeStudyName,
    createTime: '2020-07-17T16:05:11Z',
    suggestionCount: 10,
    clientId: 'optimizer-extension',
  },
  done: true,
  response: {
    '@type': 'type.googleapis.com/google.cloud.ml.v1.SuggestTrialsResponse',
    trials: [
      {
        name:
          'projects/project-id/locations/us-region/studies/study-default/trials/new-trial',
        state: 'ACTIVE',
        // matches fakeStudyConfig parameters
        parameters: [
          {
            parameter: 'param-categorical',
            stringValue: 'a',
          },
          {
            parameter: 'param-discrete',
            floatValue: 1,
          },
        ],
        startTime: '2020-07-17T16:05:21Z',
        clientId: 'optimizer-extension',
      },
    ],
    studyState: 'ACTIVE',
    startTime: '2020-07-17T16:05:11Z',
    endTime: '2020-07-17T16:05:21Z',
  },
};
