import { LearnMoreLink, COLORS } from 'gcp_jupyterlab_shared';
import * as React from 'react';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import { stylesheet } from 'typestyle';
import Button from '@material-ui/core/Button';
import Snackbar from '@material-ui/core/Snackbar';

interface ShareDialogProps {
  schedule: boolean;
  learnMoreLink: string;
  cloudBucket: string;
  shareLink: string;
}

const localStyles = stylesheet({
  text: {
    fontSize: '13px !important',
    color: COLORS.base + ' !important',
  },
  fullWidth: {
    width: '100%',
  },
  inlineStart: {
    paddingInlineStart: '15px',
  },
});

export function ShareDialog(props: ShareDialogProps) {
  const [openDialog, setOpenDialog] = React.useState(false);
  const [openSnackbar, setOpenSnackbar] = React.useState(false);

  const handleClickOpen = () => {
    setOpenDialog(true);
  };

  const handleCopyThenClose = () => {
    navigator.clipboard.writeText(props.shareLink);
    setOpenSnackbar(true);
    setOpenDialog(false);
  };

  const handleClose = () => {
    setOpenDialog(false);
  };

  const handleSnackbarClose = () => {
    setOpenSnackbar(false);
  };

  return (
    <React.Fragment>
      <p onClick={handleClickOpen} className={localStyles.fullWidth}>
        Share run
      </p>
      <Dialog
        open={openDialog}
        onClose={handleClose}
        aria-labelledby="share-dialog-title"
        aria-describedby="share-dialog-description"
        maxWidth="sm"
        fullWidth={true}
      >
        <DialogTitle id="share-dialog-title">
          Share with people and groups
        </DialogTitle>
        <DialogContent>
          {props.schedule && (
            <DialogContentText
              className={localStyles.text}
              id="share-dialog-description"
            >
              <b>
                Sharing this schedule with other users will automatically share
                the output of all the past and future runs triggered by this
                schedule with them through the Notebook Viewer.
              </b>{' '}
              Please go to the Cloud Storage console and grant them Read
              permissions to the output notebook for this schedule.{' '}
              <LearnMoreLink href={props.learnMoreLink}></LearnMoreLink>
              <ol className={localStyles.inlineStart}>
                <li>
                  Click <LearnMoreLink text="here" href={props.cloudBucket} />
                  to view the output folder for this schedule.
                </li>
                <li>
                  Go to the "PERMISSIONS" tab to view all the permission for the
                  bucket.
                </li>
                <li>Click "ADD" to grant Read permission to other users.</li>
                <li>
                  After permissions are granted in the Cloud Storage console,
                  share the link to the output of any run triggered by this
                  schedule.
                </li>
              </ol>
            </DialogContentText>
          )}
          {!props.schedule && (
            <DialogContentText
              className={localStyles.text}
              id="share-dialog-description"
            >
              In order to share the output of this single run with other users
              through the Notebook Viewer, please go to the Cloud Storage
              console and grant them Read permissions to the output notebook for
              this run.{' '}
              <LearnMoreLink href={props.learnMoreLink}></LearnMoreLink>
              <ol className={localStyles.inlineStart}>
                <li>
                  Click <LearnMoreLink text="here" href={props.cloudBucket} />
                  to view the bucket for this run.
                </li>
                <li>
                  Go to the "PERMISSIONS" tab to view all the permission for the
                  bucket.
                </li>
                <li>Click "ADD" to grant Read permission to other users.</li>
                <li>
                  After permissions are granted in the Cloud Storage console,
                  click "COPY LINK" below to share the link to the output in
                  Notebook Viewer.
                </li>
              </ol>
            </DialogContentText>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} color="primary">
            Cancel
          </Button>
          {!props.schedule && (
            <Button onClick={handleCopyThenClose} color="primary" autoFocus>
              Copy Link
            </Button>
          )}
        </DialogActions>
      </Dialog>
      <Snackbar
        open={openSnackbar}
        onClose={handleSnackbarClose}
        message="Copied to clipboard"
      />
    </React.Fragment>
  );
}
