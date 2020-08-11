import { TemporaryParameter, TemporaryParentParameter } from './types';

export function isParentParameter(
  parameter: TemporaryParameter
): parameter is TemporaryParentParameter {
  return (
    parameter.type === 'CATEGORICAL' ||
    parameter.type === 'DISCRETE' ||
    parameter.type === 'INTEGER'
  );
}

export function getOptions(parameter: TemporaryParentParameter): string[] {
  switch (parameter.type) {
    case 'DISCRETE':
    case 'CATEGORICAL':
      return parameter.metadata.valueList;
    case 'INTEGER': {
      const list: string[] = [];
      const min = parseInt(parameter.metadata.minValue, 10);
      const max = parseInt(parameter.metadata.maxValue, 10);
      for (let i = min; i <= max; ++i) {
        list.push(i.toString(10));
      }
      return list;
    }
  }
}
