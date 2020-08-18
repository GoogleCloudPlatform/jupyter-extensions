import React, { useState } from 'react';
import {
  Button,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@material-ui/core';
import { ReactWidget } from '@jupyterlab/apputils';
import { getServerRoot, Context } from '../service/jupyterConfig';

function NewCommentDialog(props) {
  const [open, setOpen] = useState(true);
  const [comment, setComment] = useState('');

  const handleCloseCancel = () => {
    setOpen(false);
  };

  const handleCloseSend = () => {
    setOpen(false);
    console.log(comment);
  };

  return (
    <div>
      <Dialog
        open={open}
        onClose={handleCloseCancel}
        aria-labelledby="form-dialog-title"
      >
        <DialogTitle id="form-dialog-title">Subscribe</DialogTitle>
        <DialogContent>
          <DialogContentText>Start a new comment thread</DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            id="name"
            label="Start typing..."
            value={comment}
            onChange={e => setComment(e.target.value)}
            fullWidth
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseCancel} color="primary">
            Cancel
          </Button>
          <Button onClick={handleCloseSend} color="primary">
            Send
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}

interface Props {
  serverRoot: string;
  currFilePath: string;
  commentType: 'detached' | 'review';
  selection: object;
}

class DialogComponent extends React.Component<Props> {
  render() {
    return <NewCommentDialog {...this.props} />;
  }
}

export class NewCommentDialogWidget extends ReactWidget {
  context: Context;
  selection: object;

  constructor(selection: object, context: Context) {
    super();
    this.selection = selection;
    this.context = context;
  }
  render() {
    const serverRoot = getServerRoot();
    const currWidget = this.context.labShell.currentWidget;
    const filePath = this.context.docManager.contextForWidget(currWidget).path;
    return (
      <DialogComponent
        selection={this.selection}
        serverRoot={serverRoot}
        commentType="detached"
        currFilePath={filePath}
      />
    );
  }
}
