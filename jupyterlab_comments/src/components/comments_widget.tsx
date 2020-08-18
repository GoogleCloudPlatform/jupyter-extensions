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

import { ReactWidget } from '@jupyterlab/apputils';
import * as React from 'react';
import { trimPath } from '../service/file';

import {
  DetachedComment,
  createDetachedCommentFromJSON,
  CodeReviewComment,
  createReviewCommentFromJSON,
  ReviewRequest,
} from '../service/comment';
import { httpGitRequest, refreshIntervalRequest } from '../service/request';
import { stylesheet } from 'typestyle';
import {
  List,
  Typography,
  CssBaseline,
  Divider,
  Tabs,
  Tab,
  AppBar,
  Grid,
} from '@material-ui/core';
import { createMuiTheme, ThemeProvider } from '@material-ui/core/styles';
import CommentIcon from '@material-ui/icons/Comment';
import { ILabShell } from '@jupyterlab/application';
import { IDocumentManager } from '@jupyterlab/docmanager';
import { IDocumentWidget } from '@jupyterlab/docregistry';
import { Comment } from '../components/comment';
import { NewCommentThread } from '../components/start_thread';
import { getServerRoot, Context } from '../service/jupyterConfig';
import { CodeReview } from '../components/code_review';
import { RegularFile, NotebookFile } from '../service/file';

interface Props {
  context: Context;
}

interface State {
  detachedComments: DetachedComment[];
  reviewComments: Array<[ReviewRequest, Array<CodeReviewComment>]>;
  fileName: string;
  serverRoot: string;
  activeTab: number;
  errorMessage: string;
}

// export interface Context {
//   labShell: ILabShell;
//   docManager: IDocumentManager;
// }

const localStyles = stylesheet({
  root: {
    backgroundColor: 'white',
    height: '100%',
    overflowY: 'auto',
  },
  header: {
    paddingLeft: 10,
    paddingTop: 10,
  },
  tabs: {
    textAlign: 'center',
  },
  commentsList: {
    flexDirection: 'column',
    minHeight: '100vh',
  },
});

const theme = createMuiTheme({
  palette: {
    primary: {
      main: '#3f51b5',
    },
    secondary: {
      main: '#002984',
    },
  },
});

export class CommentsComponent extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    const serverRoot = getServerRoot();
    this.state = {
      reviewComments: [],
      detachedComments: [],
      serverRoot: serverRoot,
      activeTab: 0,
      errorMessage: '',
      fileName: '',
    };
    //Track when the user switches to viewing a different file
    this.props.context.labShell.currentChanged.connect(() => {
      this.getLocalAndRemoteComments();
    });
  }

  async componentDidMount() {
    try {
      this.getLocalAndRemoteComments();
      const refresh = await refreshIntervalRequest().then(response =>
        response.json().then(data => data.interval)
      );
      const refreshInterval = refresh * 1000;
      //Set timer for fetching new comments from the remote repository
      setInterval(() => {
        console.log('Refreshed');
        this.getLocalAndRemoteComments();
      }, refreshInterval);
    } catch (err) {
      console.warn('Unexpected error', err);
    }
  }

  tabChange = (event, activeTab) => {
    this.setState({ activeTab: activeTab });
  };

  isNotebook(widget: any) {
    /*widget.content is an instance of the Notebook class for Notebook files,
    or an instance of the FileEditor class for non-Notebook files.
    A FileEditor contains an 'editor' instance variable,
    while a Notebook does not
    */
    return !widget.content.editor;
  }

  render() {
    const activeTab = this.state.activeTab;
    const currFilePath = this.getCurrentFilePath();
    const currWidget = this.props.context.labShell.currentWidget;
    let file: NotebookFile | RegularFile;
    if (this.isNotebook(currWidget)) {
      file = new NotebookFile(currWidget);
    } else {
      file = new RegularFile(currWidget as IDocumentWidget);
    }
    const detachedCommentsList = this.state.detachedComments.map(comment => (
      <>
        <Comment detachedComment={comment} file={file} />
        <Divider />
      </>
    ));
    const numDetachedComments = this.state.detachedComments.length;
    const detachedLabel: string =
      'Detached (' + numDetachedComments.toString() + ')';
    const reviewCommentsList = this.state.reviewComments.map(
      reviewCommentsArr => (
        <>
          <CodeReview
            reviewRequest={reviewCommentsArr[0]}
            commentsList={reviewCommentsArr[1]}
            file={file}
          />
          <NewCommentThread
            serverRoot={this.state.serverRoot}
            currFilePath={currFilePath}
            commentType="review"
            reviewHash={reviewCommentsArr[0].reviewHash}
          />
        </>
      )
    );
    return (
      <ThemeProvider theme={theme}>
        <div className={localStyles.root}>
          <CssBaseline />
          {!this.state.errorMessage && (
            <Grid
              container
              direction="row"
              spacing={1}
              className={localStyles.header}
            >
              <Grid item>
                <CommentIcon color="primary" />
              </Grid>
              <Grid item>
                <Typography variant="h5">
                  Comments for {this.state.fileName}
                </Typography>
              </Grid>
            </Grid>
          )}

          <AppBar position="static">
            <Tabs
              value={activeTab}
              onChange={this.tabChange}
              indicatorColor="secondary"
              className={localStyles.tabs}
            >
              <Tab label="Code Reviews" value={0} />
              <Tab label={detachedLabel} value={1} />
            </Tabs>
          </AppBar>

          {this.state.errorMessage && (
            <Typography
              variant="subtitle1"
              className={localStyles.header}
              gutterBottom
            >
              {' '}
              {this.state.errorMessage}
            </Typography>
          )}
          {!this.state.errorMessage &&
            (this.state.activeTab === 0 ? (
              <>
                <List className={localStyles.commentsList}>
                  {reviewCommentsList}{' '}
                </List>
              </>
            ) : (
              <>
                <NewCommentThread
                  serverRoot={this.state.serverRoot}
                  currFilePath={currFilePath}
                  commentType="detached"
                />
                <List className={localStyles.commentsList}>
                  {' '}
                  {detachedCommentsList}{' '}
                </List>
              </>
            ))}
        </div>
      </ThemeProvider>
    );
  }

  private async getDetachedComments(serverRoot: string, filePath: string) {
    httpGitRequest('detachedComments', 'GET', filePath, serverRoot).then(
      response =>
        response.json().then(data => {
          const comments: Array<DetachedComment> = new Array<DetachedComment>();
          const shortenedFilePath = trimPath(filePath);
          if (data) {
            if (data.error_message) {
              //file not stored inside a git repo
              this.setState({
                errorMessage:
                  'No comments to display: file not stored in any Git repository',
              });
            } else {
              this.setState({ errorMessage: '' }); //remove error message
              data.forEach(function(obj) {
                const comment = createDetachedCommentFromJSON(obj, filePath);
                comments.push(comment);
              });
              comments.reverse();
            }
          }
          this.setState({
            detachedComments: comments,
            fileName: shortenedFilePath,
          });
        })
    );
  }

  private async getAllCodeReviewComments(serverRoot: string, filePath: string) {
    httpGitRequest('reviewComments', 'GET', filePath, serverRoot).then(
      response =>
        response.json().then(data => {
          //Each Array<CodeReviewComment> stores all the comments on this file for a different code review
          const reviews: Array<[
            ReviewRequest,
            Array<CodeReviewComment>
          ]> = new Array<[ReviewRequest, Array<CodeReviewComment>]>();
          const shortenedFilePath = trimPath(filePath);
          if (data) {
            if (data.error_message) {
              //file not stored in git repo
              this.setState({
                errorMessage:
                  'No comments to display: file not stored in any Git repository',
              });
            } else {
              this.setState({ errorMessage: '' }); //remove error message
              data.forEach(function(review) {
                const request = review.request;
                const comments: Array<CodeReviewComment> = new Array<
                  CodeReviewComment
                >();
                if (review.comments) {
                  review.comments.forEach(function(commentObj) {
                    const comment = createReviewCommentFromJSON(
                      commentObj,
                      review.revision,
                      review.request,
                      filePath
                    );
                    comments.push(comment);
                  });
                  comments.reverse();
                  reviews.push([request, comments]);
                }
              });
            }
          }
          this.setState({
            reviewComments: reviews,
            fileName: shortenedFilePath,
          });
        })
    );
  }

  private async pullFromRemoteRepo(serverRoot: string, filePath: string) {
    httpGitRequest('remotePull', 'POST', filePath, serverRoot);
  }

  private async getLocalAndRemoteComments() {
    const context = this.props.context;
    const currWidget = context.labShell.currentWidget;
    if (currWidget) {
      const currentFile = context.docManager.contextForWidget(currWidget);
      if (!(currentFile === undefined)) {
        const filePath = context.docManager.contextForWidget(currWidget).path;
        this.getLocalReviewAndDetachedComments(this.state.serverRoot, filePath);
        this.pullFromRemoteRepo(this.state.serverRoot, filePath);
        this.getLocalReviewAndDetachedComments(this.state.serverRoot, filePath);
      } else {
        this.clearComments();
        this.setState({ errorMessage: 'Open a file to view commments' });
      }
    } else {
      this.clearComments();
      this.setState({ errorMessage: 'Open a file to view commments' });
    }
  }

  //File path is relative to the JupyterLab server root
  private getCurrentFilePath() {
    const context = this.props.context;
    const currWidget = context.labShell.currentWidget;
    if (currWidget) {
      const currentFile = context.docManager.contextForWidget(currWidget);
      if (!(currentFile === undefined)) {
        const filePath = context.docManager.contextForWidget(currWidget).path;
        return filePath;
      }
    }
  }

  private async getLocalReviewAndDetachedComments(
    serverRoot: any,
    filePath: any
  ) {
    this.getDetachedComments(serverRoot, filePath);
    this.getAllCodeReviewComments(serverRoot, filePath);
    // this.getCurrentCodeReviewComments(serverRoot, filePath);
  }

  private clearComments() {
    this.setState({ detachedComments: [], reviewComments: [], fileName: '' });
  }
}

export class CommentsWidget extends ReactWidget {
  constructor(private context: Context) {
    super();
    this.addClass('comments-widget');
  }

  render() {
    return (
      <div className={localStyles.root}>
        <CommentsComponent context={this.context} />
      </div>
    );
  }
}
