import * as React from 'react';

import CloseIcon from '@material-ui/icons/Close';
import { Snackbar, IconButton } from '@material-ui/core';
import { connect } from 'react-redux';
import { closeSnackbar } from '../../reducers/snackbarSlice';

export const COPIED_AUTOHIDE_DURATION = 2000;

interface Props {
  open: boolean;
  message: string;
  closeSnackbar: any;
  autoHideDuration: number;
}

function CustomSnackbar(props: React.PropsWithChildren<Props>) {
  const handleClose = (
    event: React.SyntheticEvent | React.MouseEvent,
    reason?: string
  ) => {
    if (reason === 'clickaway') {
      return;
    }
    props.closeSnackbar();
  };

  return (
    <Snackbar
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'right',
      }}
      autoHideDuration={props.autoHideDuration}
      open={props.open}
      onClose={handleClose}
      message={props.message}
      action={
        <React.Fragment>
          {props.children}
          <IconButton
            size="small"
            aria-label="close"
            color="inherit"
            onClick={handleClose}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </React.Fragment>
      }
    />
  );
}

const mapDispatchToProps = {
  closeSnackbar,
};

export default connect(null, mapDispatchToProps)(CustomSnackbar);
