/**
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import React, { useState } from 'react';
import {
  Button,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from '@material-ui/core';
import { ReactWidget } from '@jupyterlab/apputils';
import { getServerRoot, Context } from '../service/jupyterConfig';
import { newDetachedCommentThread } from '../service/add_comment';

const style = {
  textField: {
    width: 400,
  },
};

function NewCommentDialog(props) {
  const [open, setOpen] = useState(true);
  const [comment, setComment] = useState('');

  const handleCloseCancel = () => {
    setOpen(false);
  };

  const handleCloseSend = () => {
    setOpen(false);
    const lineNumber = props.selection.start.line;
    newDetachedCommentThread(
      props.currFilePath,
      props.serverRoot,
      comment,
      lineNumber
    );
  };

  return (
    <div>
      <Dialog
        open={open}
        onClose={handleCloseCancel}
        aria-labelledby="form-dialog-title"
      >
        <DialogTitle id="form-dialog-title">Add a comment</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            multiline
            margin="dense"
            rows={3}
            value={comment}
            variant="outlined"
            size="medium"
            label="Start a new comment thread"
            onChange={e => setComment(e.target.value)}
            style={style.textField}
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
