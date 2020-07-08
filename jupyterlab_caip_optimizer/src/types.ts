// Internal

export interface AsyncState<T> {
  loading: boolean;
  error?: string;
  data?: T;
}

// Optimizer API
export interface MetricSpec {
  goal: GoalType;
  metric: string;
}

export enum GoalType {
  MAXIMIZE = 'MAXIMIZE',
  MINIMIZE = 'MINIMIZE',
  GOAL_TYPE_UNSPECIFIED = 'GOAL_TYPE_UNSPECIFIED',
}

export enum ParameterType {
  DOUBLE = 'DOUBLE',
  INTEGER = 'INTEGER',
  CATEGORICAL = 'CATEGORICAL',
  DISCRETE = 'DISCRETE',
  PARAMETER_TYPE_UNSPECIFIED = 'PARAMETER_TYPE_UNSPECIFIED',
}

export enum ScaleType {
  UNIT_LINEAR_SCALE = 'UNIT_LINEAR_SCALE',
  UNIT_LOG_SCALE = 'UNIT_LOG_SCALE',
  UNIT_REVERSE_LOG_SCALE = 'UNIT_REVERSE_LOG_SCALE',
  SCALE_TYPE_UNSPECIFIED = 'SCALE_TYPE_UNSPECIFIED',
}

export interface DoubleValueSpec {
  minValue: number;
  maxValue: number;
}

export interface IntegerValueSpec {
  minValue: bigint;
  maxValue: bigint;
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

export interface MatchingParentIntValueSpec {
  values: bigint[];
}

export interface MatchingParentCategoricalValueSpec {
  values: string[];
}

export type ParameterSpec = ParameterSpecBase &
  (
    | {
        doubleValueSpec: DoubleValueSpec;
      }
    | {
        integerValueSpec: IntegerValueSpec;
      }
    | {
        categoricalValueSpec: CategoricalValueSpec;
      }
    | {
        discreteValueSpec: DiscreteValueSpec;
      }
  ) &
  (
    | {
        parentDiscreteValues: MatchingParentDiscreteValueSpec;
      }
    | {
        parentIntValues: MatchingParentIntValueSpec;
      }
    | {
        parentCategoricalValues: MatchingParentCategoricalValueSpec;
      }
    | {}
  );

export interface DecayCurveAutomatedStoppingConfig {
  useElapsedTime: boolean;
}

export interface MedianAutomatedStoppingConfig {
  useElapsedTime: boolean;
}

export enum Algorithm {
  ALGORITHM_UNSPECIFIED = 'ALGORITHM_UNSPECIFIED',
  GAUSSIAN_PROCESS_BANDIT = 'GAUSSIAN_PROCESS_BANDIT',
  GRID_SEARCH = 'GRID_SEARCH',
  RANDOM_SEARCH = 'RANDOM_SEARCH',
}

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
        intValue: bigint; // could we use bigint?
      }
    | {
        stringValue: string;
      }
  );

/**
 * Optional params are "output only" by Optimizer API
 */
export interface Trial {
  name?: string;
  state: State;
  parameters: Parameter[];
  finalMeasurement: Measurement;
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

export interface MetadataRequired {
  projectId: string;
  region: string;
}
