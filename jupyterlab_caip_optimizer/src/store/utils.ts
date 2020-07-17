import { AsyncThunkPayloadCreator } from '@reduxjs/toolkit';
import { AppDispatch } from './store';

/**
 * Allows dispatching of actions after a success or failure in createAsyncThunk thunk body.
 * This could be useful to create a snackbar message on a success or failure.
 * @param thunk the thunk body to wrap.
 * @param states the actions to run.
 */
export const wrapThunk = <Returned, B, C>(
  thunk: AsyncThunkPayloadCreator<Returned, B, C>,
  {
    success,
    error,
  }: {
    success?: (dispatch: AppDispatch) => void;
    error?: (dispatch: AppDispatch) => void;
  }
): AsyncThunkPayloadCreator<Returned, B, C> => (
  ...args: Parameters<typeof thunk>
) => {
  const dispatch = args[1].dispatch;
  return (thunk(...args) as Promise<Returned>)
    .then(value => {
      if (success !== undefined) {
        success(dispatch);
      }
      return value;
    })
    .catch(errorValue => {
      error(dispatch);
      throw errorValue;
    });
};
