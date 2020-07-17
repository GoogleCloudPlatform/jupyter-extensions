/**
 * For easier testing of code using nested objects
 */
import { Study, StudyConfig, MetricSpec, ParameterSpec, State } from '../types';

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
    values: ['a', 'b', 'c'],
  },
} as ParameterSpec;

export const fakeParamDiscrete = {
  parameter: 'param-discrete',
  type: 'DISCRETE',
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
  algorithm: 'ALGORITHM_UNSPECIFIED',
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
