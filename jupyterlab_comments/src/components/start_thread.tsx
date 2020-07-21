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
import { TextField, Button, Grid } from '@material-ui/core';
import { httpGitRequest } from '../service/request';

interface Props {
  serverRoot: string;
  currFilePath: string;
}

const style = {
  editor: {
    padding: 25,
  },
};

async function newDetachedCommentThread(
  currFilePath,
  serverRoot,
  commentString
) {
  const body: Record<string, string> = {
    comment: commentString,
  };
  httpGitRequest(
    'addDetachedComment',
    'POST',
    currFilePath,
    serverRoot,
    body
  ).then(response => {  });
}

export function CommentEditor(props) {
  const [comment, setComment] = useState('');

  const handleSubmit = event => {
    event.preventDefault();
    console.log(comment);
    newDetachedCommentThread(props.currFilePath, props.serverRoot, comment);
    setComment(''); //clear comment text field
  };
  return (
    <form onSubmit={handleSubmit} style={style.editor}>
      <Grid container direction="row">
        <Grid item>
          <TextField
            id="outlined-helperText"
            label="Add a new comment"
            defaultValue="Start a new comment thread"
            value={comment}
            onChange={e => setComment(e.target.value)}
            variant="outlined"
          />
        </Grid>
        <Grid item>
          <Button type="submit" color="primary" size="medium">
            {' '}
            Submit{' '}
          </Button>
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
