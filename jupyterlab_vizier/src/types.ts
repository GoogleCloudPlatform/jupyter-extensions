// Internal

export interface AsyncState<T> {
  loading: boolean;
  error?: string;
  data?: T;
}

export interface MetricSpec {
  goal: GoalType;
  metric: string;
}

/**
 * 'Const assignment" used to control the string inputs in dropdown input fields.
 * String enums don't support reverse mapping, and plain string literal types aren't iterable.
 */
export const GoalTypeList = [
  'MAXIMIZE',
  'MINIMIZE',
  'GOAL_TYPE_UNSPECIFIED',
] as const;

export type GoalType = typeof GoalTypeList[number];

export const ParameterTypeList = [
  'DOUBLE',
  'INTEGER',
  'CATEGORICAL',
  'DISCRETE',
  'PARAMETER_TYPE_UNSPECIFIED',
] as const;

export type ParameterType = typeof ParameterTypeList[number];

export const ScaleTypeList = [
  'UNIT_LINEAR_SCALE',
  'UNIT_LOG_SCALE',
  'UNIT_REVERSE_LOG_SCALE',
  'SCALE_TYPE_UNSPECIFIED',
] as const;

export type ScaleType = typeof ScaleTypeList[number];

export interface DoubleValueSpec {
  minValue?: number;
  maxValue?: number;
}

/**
 * Integer values are expected to be strings by Vizier API.
 * (https://cloud.google.com/ai-platform/optimizer/docs/reference/rest/v1/projects.locations.studies#IntegerValueSpec)
 */
export interface IntegerValueSpec {
  minValue?: string;
  maxValue?: string;
}

export interface CategoricalValueSpec {
  values: string[];
}

export interface DiscreteValueSpec {
  values: number[];
}

export interface ParameterSpecBase {
  parameter: string;
  type: ParameterType;
  scaleType?: ScaleType;
  childParameterSpecs?: ParameterSpec[];
}

export interface MatchingParentDiscreteValueSpec {
  values: number[];
}

/**
 * Integer values are expected to be strings by Vizier API.
 * (https://cloud.google.com/ai-platform/optimizer/docs/reference/rest/v1/projects.locations.studies#matchingparentintvaluespec)
 */
export interface MatchingParentIntValueSpec {
  values: string[];
}

export interface MatchingParentCategoricalValueSpec {
  values: string[];
}

export interface ParameterSpecChildren {
  childParameterSpecs?: ParameterSpec[];
}

// NOTE: this types are a union
export type ParameterSpecParent = {
  parentDiscreteValues?: MatchingParentDiscreteValueSpec;
  parentIntValues?: MatchingParentIntValueSpec;
  parentCategoricalValues?: MatchingParentCategoricalValueSpec;
};

export type UnspecifiedParameter = ParameterBase &
  ParameterSpecParent & {
    type: 'PARAMETER_TYPE_UNSPECIFIED';
  };

export type DoubleParameterSpec = ParameterSpecBase &
  ParameterSpecParent & {
    type: 'DOUBLE';
    doubleValueSpec: DoubleValueSpec;
  };

export type IntegerParameterSpec = ParameterSpecBase &
  ParameterSpecChildren &
  ParameterSpecParent & {
    type: 'INTEGER';
    integerValueSpec: IntegerValueSpec;
  };

export type CategoricalParameterSpec = ParameterSpecBase &
  ParameterSpecChildren &
  ParameterSpecParent & {
    type: 'CATEGORICAL';
    categoricalValueSpec: CategoricalValueSpec;
  };

export type DiscreteParameterSpec = ParameterSpecBase &
  ParameterSpecChildren &
  ParameterSpecParent & {
    type: 'DISCRETE';
    discreteValueSpec: DiscreteValueSpec;
  };

export type ParameterSpec =
  | UnspecifiedParameter
  | DoubleParameterSpec
  | IntegerParameterSpec
  | CategoricalParameterSpec
  | DiscreteParameterSpec;

export interface DecayCurveAutomatedStoppingConfig {
  useElapsedTime: boolean;
}

export interface MedianAutomatedStoppingConfig {
  useElapsedTime: boolean;
}

export const AlgorithmList = [
  'ALGORITHM_UNSPECIFIED',
  'GAUSSIAN_PROCESS_BANDIT',
  'GRID_SEARCH',
  'RANDOM_SEARCH',
] as const;

export type Algorithm = typeof AlgorithmList[number];

export type AutomatedStoppingConfig =
  | {
      decayCurveStoppingConfig: DecayCurveAutomatedStoppingConfig;
    }
  | {
      medianAutomatedStoppingConfig: MedianAutomatedStoppingConfig;
    };

export interface StudyConfig {
  metrics: MetricSpec[];
  parameters: ParameterSpec[];
  algorithm: Algorithm;
  automatedStoppingConfig?: AutomatedStoppingConfig;
}

export interface Study {
  name: string;
  studyConfig: StudyConfig;
  state?: State; // TODO: check if return enum would match State enum declared here?
  createTime?: string;
  inactiveReason?: string;
  // Lazy loaded from api
  trials?: Trial[];
}

export enum State {
  STATE_UNSPECIFIED = 'STATE_UNSPECIFIED',
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  COMPLETED = 'COMPLETED',
}

export interface Metric {
  metric: string;
  value: number;
}

export interface Measurement {
  elapsedTime?: string;
  stepCount: string;
  metrics: Metric[];
}

export interface ParameterBase {
  parameter: string;
}

export type Parameter = ParameterBase &
  (
    | {
        floatValue: number;
      }
    | {
        intValue: string;
      }
    | {
        stringValue: string;
      }
  );

export enum TrialState {
  STATE_UNSPECIFIED = 'STATE_UNSPECIFIED',
  REQUESTED = 'REQUESTED',
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  STOPPING = 'STOPPING',
}

/**
 * Optional params are "output only" by Vizier API
 */
export interface Trial {
  name?: string;
  state: TrialState;
  parameters: Parameter[];
  finalMeasurement?: Measurement;
  measurements: Measurement[];
  startTime?: string;
  endTime?: string;
  clientId?: string;
  trialInfeasible?: boolean;
  infeasibleReason?: string;
}

export interface MetadataFull {
  project: string;
  numericProjectId: string;
  framework: string;
  id: string;
  name: string;
  frameworkTitle: string;
  dlvmImageVersion: string;
  machineType: string;
  zone: string;
}

export type OperationMetadata<BODY extends {}> = BODY & {
  '@type': string;
};

export interface OperationBase<BODY> {
  name: string;
  metadata: OperationMetadata<BODY>;
  done?: boolean;
}

export type Operation<BODY = {}, METADATA = {}> = OperationBase<METADATA> &
  (
    | {
        error: {
          code: number;
          message: string;
          details: OperationMetadata<BODY>[];
        };
      }
    | {
        response: OperationMetadata<BODY>;
      }
  );

export interface SuggestTrialsMetadata {
  suggestionCount: number;
}

export interface SuggestTrialsResponse {
  trials: Trial[];
  studyState: State;
  startTime: string;
  endTime: string;
}

export type SuggestTrialOperation = Operation<
  SuggestTrialsResponse,
  SuggestTrialsMetadata
>;
