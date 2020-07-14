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
import { trimPath } from '../service/file'
import { DetachedComment, createDetachedCommentFromJSON, CodeReviewComment, createReviewCommentFromJSON } from '../service/comment'
import { PageConfig } from '@jupyterlab/coreutils';
import { httpGitRequest, refreshIntervalRequest } from '../service/request';
import { stylesheet } from 'typestyle';
import { List, Typography, CssBaseline, Divider, Tabs, Tab, AppBar  } from '@material-ui/core';
import { JupyterFrontEnd, ILabShell } from '@jupyterlab/application';
import { IDocumentManager } from '@jupyterlab/docmanager';
import { Comment } from '../components/comment'

interface Props {
  context: Context,
}

interface State {
  detachedComments: DetachedComment[],
  reviewComments: CodeReviewComment[],
  fileName: string,
  serverRoot: string,
  activeTab: number,
  errorMessage: string,
}

export interface Context {
  app: JupyterFrontEnd,
  labShell: ILabShell,
  docManager: IDocumentManager,

}

const localStyles = stylesheet({
  root: {
    backgroundColor: 'white',
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    paddingLeft: 10,
    paddingTop: 10,
  },
  tabs: {
    textAlign: 'center',
    centered: true,
  },
});

export class CommentsComponent extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    const serverRoot = PageConfig.getOption('serverRoot');
    this.state = {
      reviewComments: [],
      detachedComments: [],
      serverRoot: serverRoot,
      activeTab: 0,
      errorMessage: "",
      fileName: "",
    };
    //Track when the user switches to viewing a different file
    var context = this.props.context;
    context.labShell.currentChanged.connect(() => {
        this.getLocalAndRemoteComments();
     });
  }


  async componentDidMount() {
    try {
      this.getLocalAndRemoteComments();
      const refresh = await refreshIntervalRequest().then(response => response.json().then(data => data.interval));
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
    this.setState({activeTab: activeTab});
  };

  render() {
    const activeTab = this.state.activeTab;
    const detachedCommentsList = this.state.detachedComments.map((comment) =>
        <>
        <Comment detachedComment={comment}/>
        <Divider/>
        </>
      );
    const reviewCommentsList = this.state.reviewComments.map((comment) =>
        <>
        <Comment reviewComment={comment}/>
        <Divider/>
        </>
      );
    return (
      <div className = {localStyles.root}>
        <CssBaseline/>
        {(!this.state.errorMessage) &&
          <Typography color="primary" variant="h5" className={localStyles.header} gutterBottom>
              Comments for {this.state.fileName}
          </Typography>}
        <AppBar position="static">
          <Tabs value={activeTab} onChange={this.tabChange} className={localStyles.tabs} >
            <Tab label="Review" value={0}/>
            <Tab label="Detached" value={1}/>
          </Tabs>
        </AppBar>
        {(this.state.errorMessage) && <Typography variant="subtitle1" className={localStyles.header} gutterBottom> {this.state.errorMessage}</Typography>}
        {(this.state.activeTab === 0) ?
          <List>{reviewCommentsList} </List> : <List> {detachedCommentsList} </List>}
      </div>
    );
  }

  private async getDetachedComments(serverRoot : string, filePath: string) {
    httpGitRequest("detachedComments", "GET", filePath, serverRoot).then(response => response.json().then(data => {
          let comments : Array<DetachedComment> = new Array<DetachedComment>();
          const shortenedFilePath = trimPath(filePath);
          if (data) {
            if (data.error_message) {
              //file not stored inside a git repo
              this.setState({errorMessage: "No comments to display: file not stored in any Git repository"});
            } else {
              this.setState({errorMessage: ""}); //remove error message
              data.forEach(function(obj) {
                var comment = createDetachedCommentFromJSON(obj);
                comments.push(comment);
              });
            }
          }
          this.setState({detachedComments : comments, fileName: shortenedFilePath});

    }));
  }

  private async getCodeReviewComments(serverRoot: string, filePath: string) {
    httpGitRequest("reviewComments", "GET", filePath, serverRoot).then(response => response.json().then(data => {
          let comments : Array<CodeReviewComment> = new Array<CodeReviewComment>();
          const shortenedFilePath = trimPath(filePath);
          if (data) {
            if (data.error_message) {
              //file not stored in git repo
              this.setState({errorMessage: "No comments to display: file not stored in any Git repository"});
            } else {
              this.setState({errorMessage: ""}); //remove error message
              if (data.comments) {
                data.comments.forEach(function(obj) {
                  var comment = createReviewCommentFromJSON(obj, data.revision, data.request);
                  comments.push(comment);
                });
              }
            }
          }
          this.setState({reviewComments : comments, fileName: shortenedFilePath});

    }));
  }

  private async pullFromRemoteRepo(serverRoot: string, filePath: string) {
    httpGitRequest("remotePull", "POST", filePath, serverRoot);
  }

  private async getLocalAndRemoteComments() {
    const context = this.props.context;
    const currWidget = context.labShell.currentWidget;
    if (currWidget) {
      var currentFile = context.docManager.contextForWidget(currWidget);
      if (!(currentFile === undefined)) {
        const filePath = context.docManager.contextForWidget(currWidget).path;
        this.getLocalReviewAndDetachedComments(this.state.serverRoot, filePath);
        this.pullFromRemoteRepo(this.state.serverRoot, filePath);
        this.getLocalReviewAndDetachedComments(this.state.serverRoot, filePath);
      } else {
          this.clearComments();
          this.setState({errorMessage: "Open a file to view commments"});
      }
    } else {
      this.clearComments();
      this.setState({errorMessage: "Open a file to view commments"});
    }
  }

  private async getLocalReviewAndDetachedComments(serverRoot: any, filePath: any) {
    this.getDetachedComments(serverRoot, filePath);
    this.getCodeReviewComments(serverRoot, filePath);
  }

  private clearComments() {
    this.setState({detachedComments: [], reviewComments: [], fileName: ""});
  }
}

export class CommentsWidget extends ReactWidget {
  constructor(private context : Context) {
    super();
    this.addClass('comments-widget');
  }

  render() {
    return <div className={localStyles.root}> <CommentsComponent context = {this.context} /> </div>;
  }
}
