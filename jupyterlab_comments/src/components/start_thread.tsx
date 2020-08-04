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
import { TextField, Button, Grid, Icon } from '@material-ui/core';
import { newDetachedCommentThread } from '../service/add_comment';

interface Props {
  serverRoot: string;
  currFilePath: string;
}

const style = {
  editor: {
    padding: 20,
  },
  submit: {
    paddingLeft: 225,
    display: 'inlineBlock',
  },
  textField: {
    width: 300,
  },
};

export function DetachedCommentEditor(props) {
  const [comment, setComment] = useState('Start a new comment thread');

  const handleSubmit = event => {
    event.preventDefault();
    newDetachedCommentThread(props.currFilePath, props.serverRoot, comment);
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
            id="outlined-helperText"
            label="Add a new comment"
            value={comment}
            onChange={e => setComment(e.target.value)}
            variant="outlined"
            size="medium"
            style={style.textField}
            className="newThreadTextField"
          />
        </Grid>
        <Grid item style={style.submit}>
          <Button
            type="submit"
            color="primary"
            size="medium"
            endIcon={<Icon>send</Icon>}
            className="sendThread"
          >
            Send
          </Button>
        </Grid>
      </Grid>
    </form>
  );
}

export class NewCommentThread extends React.Component<Props> {
  render() {
    return <DetachedCommentEditor {...this.props} />;
  }
}
