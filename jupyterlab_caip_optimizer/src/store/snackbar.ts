import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AppThunk } from './store';

export interface OpenAction {
  severity: 'error' | 'warning' | 'info' | 'success';
  message: string;
}

export interface SnackbarState {
  open: boolean;
  severity: 'error' | 'warning' | 'info' | 'success';
  message: string;
}

export const snackbarSlice = createSlice({
  name: 'snackbar',
  initialState: {
    open: false,
    message: '',
    severity: 'info',
  } as SnackbarState,
  reducers: {
    open: (state, action: PayloadAction<OpenAction>) => {
      state.message = action.payload.message;
      state.severity = action.payload.severity;
      state.open = true;
    },
    close: state => {
      state.open = false;
    },
  },
});

const wait = async (time: number) =>
  new Promise(resolve => setTimeout(() => resolve(), time));

export const createSnack = (
  message: string,
  severity: OpenAction['severity'] = 'info',
  waitMs = 2000
): AppThunk => async (dispatch, getState) => {
  dispatch(
    snackbarSlice.actions.open({
      message,
      severity,
    })
  );
  await wait(waitMs);
  // If not already closed from user close the snackbar
  if (getState().snackbar.open) {
    dispatch(snackbarSlice.actions.close());
  }
};
