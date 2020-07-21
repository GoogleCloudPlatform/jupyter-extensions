/**
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {
  ParameterSpec,
  MetricSpec,
  Parameter,
  Measurement,
  Trial,
  State,
  Metric,
} from '../../types';
import { Column } from 'material-table';
import { MetricsInputs } from '.';

export type TrialColumn = Column<Trial>;

/**
 * Converts a paramter to a valid column for `material-table`
 * @param parameter The parameter to make into a column.
 */
export function parameterToColumn(parameter: ParameterSpec): TrialColumn {
  return {
    // Attach parameter to name to avoid name collision with other properties like state and name
    field: `${parameter.parameter}Parameter`,
    title: parameter.parameter,
  };
}

/**
 * Converts a metric specification to a valid column for `material-table`
 * @param metricSpec The metric specification to make into a column.
 */
export function metricToColumn(metricSpec: MetricSpec): TrialColumn {
  return { title: metricSpec.metric, field: `${metricSpec.metric}Metric` };
}

/**
 * Converts a trial's parameter value to a valid data object for `material-table`
 * @param parameter A trial parameter value.
 */
export function parameterToData(parameter: Parameter) {
  if ('floatValue' in parameter) {
    return { [`${parameter.parameter}Parameter`]: parameter.floatValue };
  } else if ('intValue' in parameter) {
    return { [`${parameter.parameter}Parameter`]: parameter.intValue };
  } else {
    return { [`${parameter.parameter}Parameter`]: parameter.stringValue };
  }
}

/**
 * Converts a list of parameter values to data values for `material-table`
 * @param parameters Trial's parameter list to convert.
 */
export function parametersToData(parameters: Parameter[]) {
  return parameters.reduce(
    (prev, parameter) => ({ ...prev, ...parameterToData(parameter) }),
    {}
  );
}

/**
 * Converts a measurement to a valid data object for `material-table`.
 * @param finalMeasurement The final measurement for a trial's metric.
 */
export function finalMeasurementToData(finalMeasurement: Measurement) {
  return finalMeasurement.metrics.reduce(
    (prev, metric) => ({ ...prev, [`${metric.metric}Metric`]: metric.value }),
    {}
  );
}

/**
 * Converts a trial's `finalMeasurement` and parameter values to a object list for `material-table`
 * @param trial The trial to convert to data for `material-table`
 */
export function trialToData(trial: Trial): any {
  let trialData = {
    name: trial.name,
    state: trial.state,
    ...parametersToData(trial.parameters),
  };
  if (trial.finalMeasurement) {
    trialData = {
      ...trialData,
      ...finalMeasurementToData(trial.finalMeasurement),
    };
  }
  return trialData;
}

export function trialStateValue(state: State): number {
  switch (state) {
    case 'STATE_UNSPECIFIED':
      return 0;
    case 'COMPLETED':
      return 1;
    case 'INACTIVE':
      return 2;
    case 'ACTIVE':
      return 3;
    default:
      return -1;
  }
}

export function metricSpecsToMetrics(metricSpecs: MetricSpec[]): MetricsInputs {
  return metricSpecs.reduce(
    (obj, { metric }) => ({ ...obj, [metric]: '' }),
    {}
  );
}

export function metricsToMeasurement(metrics: MetricsInputs): Measurement {
  const apiMetrics: Metric[] = Object.keys(metrics).map(
    metricName =>
      ({
        metric: metricName,
        value: parseFloat(metrics[metricName]),
      } as Metric)
  );
  return {
    stepCount: '1',
    metrics: apiMetrics,
  };
}

export function clearMetrics(metrics: MetricsInputs): MetricsInputs {
  return Object.keys(metrics).reduce(
    (prev, metricName) => ({ ...prev, [metricName]: '' }),
    {}
  );
}
