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
import { TextField, Grid } from '@material-ui/core';
import {
  newDetachedCommentThread,
  newReviewCommentThread,
} from '../service/add_comment';
import { SendButton } from './send_button';

interface Props {
  serverRoot: string;
  currFilePath: string;
  commentType: 'detached' | 'review';
  reviewHash?: string;
}

const style = {
  editor: {
    padding: 20,
  },
  submit: {
    paddingLeft: 320,
    display: 'inlineBlock',
  },
  textField: {
    width: 400,
  },
};

export function CommentEditor(props) {
  const [comment, setComment] = useState('');

  const handleSubmit = event => {
    event.preventDefault();
    switch (props.commentType) {
      case 'review':
        newReviewCommentThread(
          props.currFilePath,
          props.serverRoot,
          comment,
          props.reviewHash
        );
        break;
      case 'detached':
        newDetachedCommentThread(props.currFilePath, props.serverRoot, comment);
        break;
    }
    setComment(''); //clear comment editor field
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
      <Grid container direction="column">
        <Grid item>
          <TextField
            multiline
            rows={3}
            label="Start a new comment thread"
            value={comment}
            onChange={e => setComment(e.target.value)}
            variant="outlined"
            size="medium"
            style={style.textField}
            className="newThreadTextField"
          />
        </Grid>
        <Grid item style={style.submit}>
          <SendButton type="sendThread" />
        </Grid>
      </Grid>
    </form>
  );
}

export class NewCommentThread extends React.Component<Props> {
  render() {
    return <CommentEditor {...this.props} />;
  }
}
