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
 **/
import React, { useState } from 'react';
import { TextField, Button, Grid } from '@material-ui/core';
import {
  newDetachedCommentReply,
  newReviewCommentReply,
} from '../service/add_comment';
import Icon from '@material-ui/core/Icon';
import { getServerRoot } from '../service/jupyterConfig';

interface Props {
  currFilePath: string;
  hash: string;
  commentType: 'detached' | 'review';
  reviewHash?: string;
}

const style = {
  editor: {
    padding: 10,
    width: 400,
  },
};

function SendButton(props) {
  return (
    <Button
      type="submit"
      color="primary"
      size="small"
      endIcon={<Icon>send</Icon>}
      className="sendReply"
    >
      Send
    </Button>);
}

function ReplyEditor(props) {
  const [comment, setComment] = useState('');
  const serverRoot = getServerRoot();

  const handleSubmit = event => {
    event.preventDefault();
    switch (props.commentType) {
      case 'review':
        newReviewCommentReply(
          props.currFilePath,
          serverRoot,
          comment,
          props.hash,
          props.reviewHash
        );
        break;
      case 'detached':
        newDetachedCommentReply(
          props.currFilePath,
          serverRoot,
          comment,
          props.hash
        );
        break;
    }
    setComment(''); //clear comment text field
  };
  return (
    <form
      onSubmit={handleSubmit}
      style={style.editor}
      className="commentSubmit"
    >
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/icon?family=Material+Icons"
      />
      <Grid container direction="row" spacing={0}>
        <Grid item>
          <TextField
            label="Reply to this comment"
            value={comment}
            rows={3}
            onChange={e => setComment(e.target.value)}
            variant="outlined"
            size="small"
            style={{ margin: 2 }}
            className="replyCommentTextField"
          />
        </Grid>
        <Grid item>
          <SendButton/>
        </Grid>
      </Grid>
    </form>
  );
}


export class NewReplyComment extends React.Component<Props> {
  render() {
    return <ReplyEditor {...this.props} />;
  }
}
