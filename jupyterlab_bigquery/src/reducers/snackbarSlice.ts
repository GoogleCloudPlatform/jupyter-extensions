import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface SnackbarState {
  open: boolean;
  message: string;
  autoHideDuration: number;
}

const initialState: SnackbarState = {
  open: false,
  message: '',
  autoHideDuration: null,
};

const snackbarSlice = createSlice({
  name: 'snackbar',
  initialState,
  reducers: {
    openSnackbar(
      state,
      action: PayloadAction<{ message: string; autoHideDuration: number }>
    ) {
      const { message, autoHideDuration } = action.payload;
      state.open = true;
      state.message = message;
      state.autoHideDuration = autoHideDuration ?? null;
    },
    closeSnackbar(state) {
      state.open = false;
    },
  },
});

export const { openSnackbar, closeSnackbar } = snackbarSlice.actions;

export default snackbarSlice.reducer;
