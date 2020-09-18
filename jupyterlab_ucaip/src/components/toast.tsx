import * as React from 'react';

import CloseIcon from '@material-ui/icons/Close';
import { Snackbar, IconButton } from '@material-ui/core';
import MuiAlert, { AlertProps } from '@material-ui/lab/Alert';

function Alert(props: AlertProps) {
  return <MuiAlert elevation={6} variant="filled" {...props} />;
}

interface Props {
  open: boolean;
  message?: string;
  onClose: () => void;
  closeButton?: boolean;
  error?: boolean;
  autoHideDuration?: number;
}

export default function Toast(props: React.PropsWithChildren<Props>) {
  const handleClose = (
    event: React.SyntheticEvent | React.MouseEvent,
    reason?: string
  ) => {
    if (reason === 'clickaway') {
      return;
    }
    props.onClose();
  };

  const getAction = () => {
    if (!props.error) {
      return (
        <React.Fragment>
          {props.children}
          {props.closeButton && (
            <IconButton
              size="small"
              aria-label="close"
              color="inherit"
              onClick={handleClose}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          )}
        </React.Fragment>
      );
    }
    return null;
  };

  const getError = () => {
    if (props.error) {
      return (
        <Alert onClose={handleClose} severity="error">
          {props.children}
        </Alert>
      );
    }
    return null;
  };

  return (
    <Snackbar
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'right',
      }}
      open={props.open}
      onClose={handleClose}
      message={props.message}
      action={getAction()}
      autoHideDuration={props.autoHideDuration}
    >
      {getError()}
    </Snackbar>
  );
}
