import { LearnMoreLink, COLORS } from 'gcp_jupyterlab_shared';
import * as React from 'react';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import { classes, stylesheet } from 'typestyle';
import Button from '@material-ui/core/Button';
import Snackbar from '@material-ui/core/Snackbar';

interface Props {
  cloudBucket: string;
  shareLink: string;
  handleClose?: () => void;
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
    this.handleClickOpen = this.handleClickOpen.bind(this);
    this.handleCopy = this.handleCopy.bind(this);
    this.handleClose = this.handleClose.bind(this);
    this.handleSnackbarClose = this.handleSnackbarClose.bind(this);
  }

  handleClickOpen() {
    this.setState({ openDialog: true });
  }

  handleCopy() {
    navigator.clipboard.writeText(this.props.shareLink);
    this.setState({ openSnackbar: true });
  }

  handleClose() {
    this.setState({ openDialog: false, openSnackbar: false });
    if (this.props.handleClose) {
      this.props.handleClose();
    }
  }

  handleSnackbarClose() {
    this.setState({ openSnackbar: false });
  }

  render() {
    return (
      <React.Fragment>
        <p onClick={this.handleClickOpen} className={localStyles.fullWidth}>
          Share run result
        </p>
        <Dialog
          open={this.state.openDialog}
          onClose={this.handleClose}
          aria-labelledby="share-dialog-title"
          aria-describedby="share-dialog-description"
          maxWidth="sm"
          fullWidth={true}
        >
          <DialogTitle id="share-dialog-title">Share run result</DialogTitle>
          <DialogContent>
            <DialogContentText
              className={localStyles.text}
              id="share-dialog-description"
            >
              To share this run result with people or groups, grant view
              permissions to the Cloud Storage bucket containing all results. If
              this has been done before, skip steps 2 through 4.
            </DialogContentText>
            <ol className={classes(localStyles.inlineStart, localStyles.text)}>
              <li>Click the "COPY LINK" button below</li>
              <li>
                Go to the{' '}
                <LearnMoreLink
                  href={this.props.cloudBucket}
                  text="results bucket"
                />
                .
              </li>
              <li>Click "Add"</li>
              <li>
                Enter one or more emails then select the "Storage Object Viewer"
                role
              </li>
            </ol>
            <DialogContentText
              className={localStyles.text}
              id="share-dialog-description"
            >
              You can now share the link you copied with the people or groups
              granted view permission. Note: these people or groups are able to
              view any run result within this Google Cloud project as long as
              they own the links to those run results.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={this.handleClose} color="primary">
              Cancel
            </Button>
            <Button onClick={this.handleCopy} color="primary" autoFocus>
              Copy Link
            </Button>
          </DialogActions>
        </Dialog>
        <Snackbar
          open={this.state.openSnackbar}
          onClose={this.handleSnackbarClose}
          message="Copied to clipboard"
        />
      </React.Fragment>
    );
  }
}
