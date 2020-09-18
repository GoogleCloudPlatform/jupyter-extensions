import * as React from 'react';
import { Snackbar as MaterialSnackbar } from '@material-ui/core';
import { Alert as MaterialAlert, AlertProps } from '@material-ui/lab';
import { SnackbarState, snackbarSlice } from '../../store/snackbar';
import { connect, Provider } from 'react-redux';
import { RootState, AppDispatch } from '../../store/store';
import { ReactWidget } from '@jupyterlab/apputils';
import { Store } from 'redux';
import { ThemeProvider } from '@material-ui/core/styles';
import { theme } from '../../utils/theme';

const mapStateToProps = (state: RootState) => ({
  ...state.snackbar,
});

const mapDispatchToProps = (dispatch: AppDispatch) => ({
  close: () => dispatch(snackbarSlice.actions.close()),
});

type Props = SnackbarState & { close: () => void };

function Alert(props: AlertProps) {
  return <MaterialAlert elevation={6} variant="filled" {...props} />;
}

export const SnackbarUnwrapped = ({
  open,
  message,
  severity,
  close,
}: Props) => {
  const handleClose = (event?: React.SyntheticEvent, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }

    close();
  };
  return (
    <MaterialSnackbar open={open} onClose={handleClose}>
      <Alert onClose={handleClose} severity={severity}>
        {message}
      </Alert>
    </MaterialSnackbar>
  );
};

export const Snackbar = connect(
  mapStateToProps,
  mapDispatchToProps
)(SnackbarUnwrapped);

/** Top-level widget exposed to JupyterLab and connects to redux store */
export class SnackbarWidget extends ReactWidget {
  constructor(private readonly reduxStore: Store) {
    super();
    this.id = 'optimizer-snackbar';
  }

  render() {
    return (
      <Provider store={this.reduxStore}>
        <ThemeProvider theme={theme}>
          {/* Snackbar lives here since this will always be loaded */}
          <Snackbar />
        </ThemeProvider>
      </Provider>
    );
  }
}
