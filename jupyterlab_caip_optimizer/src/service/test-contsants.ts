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
} from '../types';

export const fakeMetric1 = {
  goal: GoalType.GOAL_TYPE_UNSPECIFIED,
  metric: 'metric-1',
} as MetricSpec;

export const fakeMetric2 = {
  goal: GoalType.MAXIMIZE,
  metric: 'metric-2',
} as MetricSpec;

export const fakeMetrics: MetricSpec[] = [fakeMetric1, fakeMetric2];

export const fakeParam1 = {
  parameter: 'param-1',
  type: ParameterType.CATEGORICAL,
  categoricalValueSpec: {
    values: ['a', 'b', 'c'],
  },
} as ParameterSpec;

export const fakeParam2 = {
  parameter: 'param-2',
  type: ParameterType.DISCRETE,
  discreteValueSpec: {
    values: [1, 2, 3],
  },
} as ParameterSpec;

export const fakeParameters: ParameterSpec[] = [fakeParam1, fakeParam2];

export const fakeStudyConfig = {
  metrics: fakeMetrics,
  parameters: fakeParameters,
  algorithm: Algorithm.ALGORITHM_UNSPECIFIED,
} as StudyConfig;

export const fakeStudy = {
  name: 'study-1',
  studyConfig: fakeStudyConfig,
} as Study;

export const fakeStudyResponse = {
  name: 'study-1',
  studyConfig: fakeStudyConfig,
  state: State.ACTIVE,
  createTime: '1',
};

export const fakeStudyResponse2 = {
    name: 'study-2',
    studyConfig: fakeStudyConfig,
    state: State.INACTIVE,
    createTime: '2',
} as Study;

export const fakeStudyListResponse: Study[] = [
    fakeStudyResponse,
    fakeStudyResponse2,
];