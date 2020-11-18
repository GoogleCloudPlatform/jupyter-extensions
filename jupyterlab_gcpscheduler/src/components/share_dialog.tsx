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

interface Props {
  schedule: boolean;
  learnMoreLink: string;
  cloudBucket: string;
  shareLink: string;
}

interface State {
  openDialog: boolean;
  openSnackbar: boolean;
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

export class ShareDialog extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { openDialog: false, openSnackbar: false };
  }

  render() {
    const handleClickOpen = () => {
      this.setState({ openDialog: true });
    };

    const handleCopyThenClose = () => {
      navigator.clipboard.writeText(this.props.shareLink);
      this.setState({ openDialog: false, openSnackbar: true });
    };

    const handleClose = () => {
      this.setState({ openDialog: false });
    };

    const handleSnackbarClose = () => {
      this.setState({ openSnackbar: false });
    };

    return (
      <React.Fragment>
        <p onClick={handleClickOpen} className={localStyles.fullWidth}>
          Share run
        </p>
        <Dialog
          open={this.state.openDialog}
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
            {this.props.schedule && (
              <DialogContentText
                className={localStyles.text}
                id="share-dialog-description"
              >
                <b>
                  Sharing this schedule with other users will automatically
                  share the output of all the past and future runs triggered by
                  this schedule with them through the Notebook Viewer.
                </b>{' '}
                Please go to the Cloud Storage console and grant them Read
                permissions to the output notebook for this schedule.{' '}
                <LearnMoreLink href={this.props.learnMoreLink}></LearnMoreLink>
                <ol className={localStyles.inlineStart}>
                  <li>
                    Click{' '}
                    <LearnMoreLink text="here" href={this.props.cloudBucket} />
                    to view the output folder for this schedule.
                  </li>
                  <li>
                    Go to the "PERMISSIONS" tab to view all the permission for
                    the bucket.
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
            {!this.props.schedule && (
              <DialogContentText
                className={localStyles.text}
                id="share-dialog-description"
              >
                In order to share the output of this single run with other users
                through the Notebook Viewer, please go to the Cloud Storage
                console and grant them Read permissions to the output notebook
                for this run.{' '}
                <LearnMoreLink href={this.props.learnMoreLink}></LearnMoreLink>
                <ol className={localStyles.inlineStart}>
                  <li>
                    Click{' '}
                    <LearnMoreLink text="here" href={this.props.cloudBucket} />
                    to view the bucket for this run.
                  </li>
                  <li>
                    Go to the "PERMISSIONS" tab to view all the permission for
                    the bucket.
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
            {!this.props.schedule && (
              <Button onClick={handleCopyThenClose} color="primary" autoFocus>
                Copy Link
              </Button>
            )}
          </DialogActions>
        </Dialog>
        <Snackbar
          open={this.state.openSnackbar}
          onClose={handleSnackbarClose}
          message="Copied to clipboard"
        />
      </React.Fragment>
    );
  }
}
