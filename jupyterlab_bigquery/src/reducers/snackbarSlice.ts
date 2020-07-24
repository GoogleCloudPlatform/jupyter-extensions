import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface SnackbarState {
  open: boolean;
  message: string;
}

const initialState: SnackbarState = {
  open: false,
  message: 'Error',
};

const snackbarSlice = createSlice({
  name: 'snackbar',
  initialState,
  reducers: {
    openSnackbar(state, action: PayloadAction<string>) {
      const snackbarMessage = action.payload;
      state.open = true;
      state.message = snackbarMessage;
    },
    closeSnackbar(state) {
      state.open = false;
      state.message = initialState.message;
    },
  },
});

export const { openSnackbar, closeSnackbar } = snackbarSlice.actions;

export default snackbarSlice.reducer;
