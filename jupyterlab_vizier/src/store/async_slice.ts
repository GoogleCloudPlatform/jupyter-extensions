import {
  SliceCaseReducers,
  ValidateSliceCaseReducers,
  createSlice,
  PayloadAction,
} from '@reduxjs/toolkit';

export interface AsyncState<T> {
  data?: T;
  error: null | string;
  loading: boolean;
}

export const createAsyncSlice = <
  T,
  Reducers extends SliceCaseReducers<AsyncState<T>>
>({
  name,
  initialState,
  reducers,
}: {
  name: string;
  initialState: AsyncState<T>;
  reducers: ValidateSliceCaseReducers<AsyncState<T>, Reducers>;
}) => {
  return createSlice({
    name,
    initialState,
    reducers: {
      start: state => {
        state.loading = true;
      },
      success: (state: AsyncState<T>, action: PayloadAction<T>) => {
        state.loading = false;
        state.error = null;
        state.data = action.payload;
      },
      error: (state, action: PayloadAction<AsyncState<T>['error']>) => {
        state.loading = false;
        state.error = action.payload;
      },
      ...reducers,
    },
  });
};
