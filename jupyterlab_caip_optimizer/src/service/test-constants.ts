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
    values: ['a', 'b', 'c'],
  },
} as ParameterSpec;

export const fakeParamDiscrete = {
  parameter: 'param-discrete',
  type: ParameterType.DISCRETE,
  discreteValueSpec: {
    values: [1, 2, 3],
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

export const fakeTrial: Trial = {
  name:
    'projects/222309772370/locations/us-central1/studies/study-default/trial-default',
  state: State.ACTIVE,
  parameters: [
    {
      parameter: 'a',
      floatValue: 55.55,
    },
    {
      parameter: 'b',
      stringValue: 'category',
    },
  ],
  measurements: [],
  startTime: '1',
  endTime: '2',
  clientId: 'optimizer-extension',
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
