import { snackbarSlice, SnackbarState, OpenAction } from './snackbar';

describe('snackbar reducer', () => {
  it('opens with message and severity', () => {
    const state = {
      message: '',
      severity: 'success',
      open: true,
    } as SnackbarState;
    const newSnack = {
      message: 'Error!',
      severity: 'error',
    } as OpenAction;
    const newState = snackbarSlice.reducer(
      state,
      snackbarSlice.actions.open(newSnack)
    );

    expect(newState).toEqual({
      message: newSnack.message,
      severity: newSnack.severity,
      open: true,
    });
  });
  it('closes', () => {
    const state = {
      message: 'Error',
      severity: 'success',
      open: true,
    } as SnackbarState;
    const newState = snackbarSlice.reducer(
      state,
      snackbarSlice.actions.close()
    );
    // note is keeps the same message/severity since the snackbar takes time to fade out
    // removing them would suddenly change the snackbar while fading out
    expect(newState).toEqual({
      ...state,
      open: false,
    });
  });
});
