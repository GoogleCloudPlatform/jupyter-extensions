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
  DoubleValueSpec,
  IntegerValueSpec,
} from '../../types';
import { Column } from 'material-table';
import { MetricsInputs, ParameterInputs } from '.';
import { ErrorCheckFunction } from '../../utils/use_error_state_map';
import { Deque } from '@blakeembrey/deque';

export type TrialColumn = Column<Trial>;

export interface ParameterSpecObject {
  [parameterName: string]: ParameterSpec;
}

export interface ValidateParameterInputs {
  [parameterName: string]: ErrorCheckFunction<string>;
}

function parametersToColumnsTree(
  parameters: ParameterSpec[],
  list: TrialColumn[] = []
): TrialColumn[] {
  parameters.forEach(parameter => {
    list.push({
      // Attach parameter to name to avoid name collision with other columns properties like state and name
      field: `${parameter.parameter}Parameter`,
      title: parameter.parameter,
    });
    switch (parameter.type) {
      case 'CATEGORICAL':
      case 'DISCRETE':
      case 'INTEGER':
        if (parameter.childParameterSpecs) {
          parametersToColumnsTree(parameter.childParameterSpecs, list);
        }
    }
  });
  return list;
}

/**
 * Converts a list of parameters to valid columns for `material-table`.
 * It handles parameter trees as well.
 * @param parameters The parameter list to convert into a columns.
 */
export function parametersToColumns(
  parameters: ParameterSpec[]
): TrialColumn[] {
  return parametersToColumnsTree(parameters);
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
    trialInfeasible: trial.trialInfeasible,
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

/**
 * Returns a number associated with state for sorting in the `material-table`.
 * @param state The trial state.
 */
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

export function parameterSpecToParameterSpecObject(
  parameterSpecs: ParameterSpec[]
): ParameterSpecObject {
  return parameterSpecs.reduce(
    (prev, parameterSpec) => ({
      ...prev,
      [parameterSpec.parameter]: parameterSpec,
    }),
    {}
  );
}

/**
 * Creates an empty object of parameters names to `''`.
 * @param parameterSpecs The parameter specifications
 */
export function parameterSpecToInputsValues(
  parameterSpecs: ParameterSpec[]
): ParameterInputs {
  return parameterSpecs.reduce(
    (prev, parameterSpec) => ({ ...prev, [parameterSpec.parameter]: '' }),
    {}
  );
}

export function flattenParameterSpecTree(
  specs: ParameterSpec[]
): ParameterSpec[] {
  const list: ParameterSpec[] = [];
  const items = [...specs];
  while (items.length > 0) {
    const item = items.pop();
    list.push(item);
    switch (item.type) {
      case 'DISCRETE':
      case 'CATEGORICAL':
      case 'INTEGER':
        if (item.childParameterSpecs)
          for (const child of item.childParameterSpecs) items.push(child);
        break;
    }
  }
  return list;
}

/**
 * Converts parameter input values to parameter list for a trial.
 * @param inputs The parameter input values (which are strings).
 * @param parameterSpecs The parameter specifications.
 */
export function inputValuesToParameterList(
  inputs: ParameterInputs,
  roots: ParameterSpec[]
): Parameter[] {
  const parameters: Parameter[] = [];

  for (const root of roots) {
    const nodes = new Deque<ParameterSpec>();
    nodes.push(root);
    while (nodes.size > 0) {
      // go through every item in current level and add to list
      for (let i = 0; i < nodes.size; ++i) {
        const spec = nodes.popLeft();
        const inputValue = inputs[spec.parameter];

        switch (spec.type) {
          case 'CATEGORICAL': {
            const stringValue = inputValue;
            parameters.push({
              parameter: spec.parameter,
              stringValue,
            });
            if (spec.childParameterSpecs)
              nodes.extend(
                spec.childParameterSpecs.filter(child =>
                  child.parentCategoricalValues!.values.includes(stringValue)
                )
              );
            break;
          }
          case 'INTEGER': {
            const intValue = inputValue;
            parameters.push({
              parameter: spec.parameter,
              intValue,
            });
            if (spec.childParameterSpecs)
              nodes.extend(
                spec.childParameterSpecs.filter(child =>
                  child.parentIntValues!.values.includes(intValue)
                )
              );
            break;
          }
          case 'DISCRETE':
            {
              const floatValue = parseFloat(inputValue);
              parameters.push({
                parameter: spec.parameter,
                floatValue,
              });
              if (spec.childParameterSpecs)
                nodes.extend(
                  spec.childParameterSpecs.filter(child =>
                    child.parentDiscreteValues!.values.includes(floatValue)
                  )
                );
            }
            break;
          case 'DOUBLE':
            parameters.push({
              parameter: spec.parameter,
              floatValue: parseFloat(inputValue),
            });
            break;
        }
      }
    }
  }

  return parameters;
}

/**
 * Creates input validation functions to make sure inputs match the type and
 * value they are supposed to. For example a discrete input must have 1,2,3 and
 * nothing else.
 * @param parameterSpecs The parameter specifications.
 * @param parameterSpecObject The map of parameter specification name to spec.
 */
export function parameterSpecToValidateInput(
  parameterSpecs: ParameterSpec[],
  parameterSpecObject = parameterSpecToParameterSpecObject(parameterSpecs)
): ValidateParameterInputs {
  return parameterSpecs.reduce(
    (prev, parameterSpec) => ({
      ...prev,
      [parameterSpec.parameter]: (name: string, value: string) => {
        const spec = parameterSpecObject[name];
        switch (spec.type) {
          case 'CATEGORICAL':
            if (!(spec as any).categoricalValueSpec.values.includes(value)) {
              return 'Invalid categorical value.';
            }
            break;
          case 'DISCRETE':
            if (
              !((spec as any).discreteValueSpec.values as number[])
                .map(value => value.toString(10))
                .includes(value)
            ) {
              return 'Invalid discrete value.';
            }
            break;
          case 'DOUBLE': {
            const { minValue = 0, maxValue = 0 } = (spec as any)
              .doubleValueSpec as DoubleValueSpec;
            const number = parseFloat(value);
            if (number < minValue) {
              return `Number must be greater than ${minValue}`;
            } else if (number > maxValue) {
              return `Number must be less than ${maxValue}`;
            }
            break;
          }
          case 'INTEGER': {
            const {
              minValue: minValueString = '0',
              maxValue: maxValueString = '0',
            } = (spec as any).integerValueSpec as IntegerValueSpec;
            const number = parseInt(value, 10);
            const minValue = parseInt(minValueString, 10);
            const maxValue = parseInt(maxValueString);
            if (number !== parseFloat(value)) {
              return 'Number must be an integer';
            } else if (number < minValue) {
              return `Number must be greater than ${minValue}`;
            } else if (number > maxValue) {
              return `Number must be less than ${maxValue}`;
            }
            break;
          }
        }
      },
    }),
    {}
  );
}
