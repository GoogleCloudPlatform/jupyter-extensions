import * as React from 'react';

interface ErrorState<T> {
  value: T;
  error: boolean;
  helperText: string;
}

type ErrorStateReturn<T> = [ErrorState<T>, (value: T) => void];

export function useErrorState<V>(
  defaultValue: V,
  checkError: (value: V) => string | undefined
): ErrorStateReturn<V> {
  const [input, setInput] = React.useState<ErrorState<V>>({
    value: defaultValue,
    error: false,
    helperText: '',
  });

  const setValue = (value: V) => {
    const error = checkError(value);
    if (error) {
      setInput({
        value,
        error: true,
        helperText: error,
      });
    } else {
      setInput({
        value,
        error: false,
        helperText: '',
      });
    }
  };

  return [input, setValue];
}
