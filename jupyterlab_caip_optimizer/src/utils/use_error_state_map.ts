import * as React from 'react';
import { ErrorState } from './use_error_state';

export type ErrorStateMap<V> = {
  [inputName: string]: ErrorState<V>;
};

export type ErrorStateArrayReturn<O, V> = [
  ErrorStateMap<V>,
  (name: keyof O, value: V) => void,
  () => void
];

export type ErrorCheckFunction<V> = (
  name: string,
  value: V
) => string | undefined;

function getDefaultState<O extends object, V = O[keyof O]>(
  object: O
): ErrorStateMap<V> {
  return Object.keys(object).reduce(
    (prev, key) => ({
      ...prev,
      [key]: {
        value: object[key],
        error: false,
        helperText: '',
      },
    }),
    {}
  );
}

export function errorStateMapToValueObject<V>(
  object: ErrorStateMap<V>
): { [name: string]: V } {
  return Object.keys(object).reduce(
    (prev, key) => ({ ...prev, [key]: object[key].value }),
    {}
  );
}

export function useErrorStateMap<O extends object, V = O[keyof O]>(
  defaultValues: O,
  checkError: {
    [inputName in keyof O]: ErrorCheckFunction<V>;
  }
): ErrorStateArrayReturn<O, V> {
  const [map, setMap] = React.useState<ErrorStateMap<V>>(() =>
    getDefaultState(defaultValues)
  );

  const setValue = (name: keyof O, value: V) => {
    const error = checkError[name](name as string, value);

    if (error) {
      setMap({
        ...map,
        [name]: {
          value,
          error: true,
          helperText: error,
        },
      });
    } else {
      setMap({
        ...map,
        [name]: {
          value,
          error: false,
          helperText: '',
        },
      });
    }
  };

  const clear = () => {
    setMap(getDefaultState(defaultValues));
  };

  return [map, setValue, clear];
}
