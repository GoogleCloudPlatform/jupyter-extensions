/**
 * For easier testing of code using nested objects
 */
import {
  Study,
  StudyConfig,
  MetricSpec,
  ParameterSpec,
  ParameterType,
  Algorithm,
  GoalType,
  State,
  Trial,
  Measurement,
} from '../types';

export const fakeMetricUnspecified = {
  goal: GoalType.GOAL_TYPE_UNSPECIFIED,
  metric: 'metric-unspecified',
} as MetricSpec;

export const fakeMetricMaximize = {
  goal: GoalType.MAXIMIZE,
  metric: 'metric-maximize',
} as MetricSpec;

export const fakeMetrics: MetricSpec[] = [
  fakeMetricUnspecified,
  fakeMetricMaximize,
];

export const fakeParamCategorical = {
  parameter: 'param-categorical',
  type: ParameterType.CATEGORICAL,
  categoricalValueSpec: {
    values: ['a', 'b', 'c', 'categorical-type'],
  },
} as ParameterSpec;

export const fakeParamDiscrete = {
  parameter: 'param-discrete',
  type: ParameterType.DISCRETE,
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
  algorithm: Algorithm.ALGORITHM_UNSPECIFIED,
} as StudyConfig;

export const fakeStudy = {
  name: 'study-default',
  studyConfig: fakeStudyConfig,
} as Study;

export const fakeStudyResponseActive = {
  name: 'study-active',
  studyConfig: fakeStudyConfig,
  state: State.ACTIVE,
  createTime: '1',
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

export const fakeStudyName =
  'projects/project-id/locations/us-region/studies/study-default';
export const cleanFakeStudyName = 'study-default';

export const fakeTrialName =
  'projects/project-id/locations/us-region/studies/study-default/trials/trial-default';
export const cleanFakeTrialName = 'trial-default';

export const fakeOperationName =
  'projects/project-id/locations/us-region/operations/operation-name';
export const fakeCleanOperationName = 'operation-name';

export const fakeTrial: Trial = {
  name: fakeTrialName,
  state: State.ACTIVE,
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
        name: fakeTrialName,
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
