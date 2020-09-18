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
import {
  DetachedComment,
  createDetachedCommentFromJSON,
  CodeReviewComment,
  createReviewCommentFromJSON,
} from '../service/comment';
import {
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Typography,
  Button,
  List,
} from '@material-ui/core';

import ArrowDropDownIcon from '@material-ui/icons/ArrowDropDown';
import ArrowDropUpIcon from '@material-ui/icons/ArrowDropUp';
import { NewReplyComment } from './reply_editor';
import { CommentContext } from './comment_context';
import { RegularFile, NotebookFile } from '../service/file';

const style = {
  inline: {
    display: 'inline',
  },
  username: {
    fontWeight: 500,
    fontSize: 15,
    display: 'inline',
    textAlign: 'left' as const,
  },
  date: {
    display: 'inline',
    textAlign: 'left' as const,
    paddingLeft: 10,
    fontSize: 10,
    color: 'grey',
  },
  threadIndent: {
    paddingLeft: 50,
  },
  commentBottom: {
    display: 'inlineBlock',
    paddingLeft: 60,
  },
  replyButton: {
    paddingLeft: 60,
  },
};

interface Props {
  detachedComment?: DetachedComment;
  reviewComment?: CodeReviewComment;
  file?: RegularFile | NotebookFile;
}

interface State {
  expandThread: boolean;
  showCommentEditor: boolean;
  commentType: 'detached' | 'review';
}

//React component to render a single comment thread
export class Comment extends React.Component<Props, State> {
  constructor(props) {
    super(props);
    const commentType = this.props.detachedComment ? 'detached' : 'review';
    this.state = {
      expandThread: false,
      showCommentEditor: false,
      commentType: commentType,
    };
  }

  render() {
    const data = this.props.detachedComment
      ? this.props.detachedComment
      : this.props.reviewComment;

    return (
      <>
        <ListItem key="context">
          <CommentContext
            range={data.range}
            filePath={data.filePath}
            file={this.props.file}
          />
        </ListItem>
        <ListItem key="comment" alignItems="flex-start">
          <ListItemAvatar>
            <Avatar alt="avatar" />
          </ListItemAvatar>
          <ListItemText
            primary={
              <div>
                <p style={style.username}> {data.author} </p>
                <p style={style.date}> {data.timestamp} </p>
              </div>
            }
            secondary={
              <Typography
                variant="body2"
                style={style.inline}
                color="textPrimary"
              >
                {data.text}
              </Typography>
            }
          />
        </ListItem>
        <div style={style.commentBottom}>
          <Button
            color="primary"
            size="small"
            onClick={() => {
              this.setState({
                showCommentEditor: !this.state.showCommentEditor,
              });
            }}
            className="replyButton"
          >
            {' '}
            Reply{' '}
          </Button>
          {this.state.showCommentEditor &&
            (this.state.commentType === 'detached' ? (
              <NewReplyComment
                currFilePath={data.filePath}
                hash={data.hash}
                commentType={this.state.commentType}
              />
            ) : (
              <NewReplyComment
                currFilePath={data.filePath}
                hash={data.hash}
                commentType={this.state.commentType}
                reviewHash={this.props.reviewComment.request.reviewHash}
              />
            ))}
          {data.children && (
            <Button
              size="small"
              endIcon={
                this.state.expandThread ? (
                  <ArrowDropUpIcon />
                ) : (
                  <ArrowDropDownIcon />
                )
              }
              onClick={() => {
                this.setState({ expandThread: !this.state.expandThread });
              }}
              className="threadButton"
            >
              {' '}
              {this.state.expandThread ? 'Hide thread' : 'Show thread'}{' '}
            </Button>
          )}
        </div>
        <div style={style.threadIndent} className="threadList">
          {this.state.expandThread && data.children && (
            <List>
              {data.children.map((reply, index) => {
                if (this.props.detachedComment) {
                  const detached = createDetachedCommentFromJSON(
                    reply,
                    reply.filePath
                  );
                  return (
                    <Comment
                      detachedComment={detached}
                      file={this.props.file}
                      key={index}
                    />
                  );
                } else {
                  const review = createReviewCommentFromJSON(
                    reply,
                    this.props.reviewComment.revision,
                    this.props.reviewComment.request,
                    data.filePath
                  );
                  return (
                    <Comment
                      reviewComment={review}
                      file={this.props.file}
                      key={index}
                    />
                  );
                }
              })}
            </List>
          )}
        </div>
      </>
    );
  }
}
