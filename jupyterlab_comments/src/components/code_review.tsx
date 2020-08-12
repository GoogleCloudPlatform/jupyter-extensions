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

import * as React from 'react';
import { Divider, Grid, List, Typography } from '@material-ui/core';
import RateReviewIcon from '@material-ui/icons/RateReview';
import { CodeReviewComment, ReviewRequest } from '../service/comment';
import { Comment } from './comment';
import { timeAgo } from '../service/timestamp';
import { RegularFile, NotebookFile } from '../service/file';

interface Props {
  commentsList: Array<CodeReviewComment>;
  reviewRequest: ReviewRequest;
  file: RegularFile | NotebookFile;
}

const style = {
  commentListHeader: {
    fontSize: 19,
    weight: 'bold',
    color: 'black',
    backgroundColor: 'primary',
    paddingLeft: 10,
  },
  commentListDescription: {
    fontSize: 13,
    color: 'grey',
    paddingLeft: 10,
  },
  reviewIcon: {
    paddingLeft: 10,
  },
};

export class CodeReview extends React.Component<Props> {
  render() {
    const comments = this.props.commentsList.map(comment => (
      <>
        <Comment
          reviewComment={comment}
          file={this.props.file}
          key={comment.timestamp}
        />
        <Divider />
      </>
    ));
    const reviewTimeStamp = timeAgo(
      new Date().getTime(),
      this.props.reviewRequest.timestamp
    );
    return (
      <List
        subheader={
          <Grid container direction="column" spacing={0}>
            <Grid container direction="row" spacing={0}>
              <Grid item style={style.reviewIcon}>
                <RateReviewIcon color="primary" />
              </Grid>
              <Grid item>
                <Typography
                  color="primary"
                  style={style.commentListHeader}
                  gutterBottom
                >
                  {'Review requested: ' + this.props.reviewRequest.description}
                </Typography>
              </Grid>
            </Grid>
            <Grid item>
              <Typography
                color="primary"
                style={style.commentListDescription}
                gutterBottom
              >
                {'Requested by: ' + this.props.reviewRequest.requester}
              </Typography>
            </Grid>
            <Grid item>
              <Typography color="primary" style={style.commentListDescription}>
                {'Opened ' + reviewTimeStamp}
              </Typography>
            </Grid>
          </Grid>
        }
      >
        {' '}
        {comments}{' '}
      </List>
    );
  }
}
