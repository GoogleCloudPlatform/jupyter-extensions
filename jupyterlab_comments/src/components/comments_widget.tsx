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

import { ReactWidget, showErrorMessage } from '@jupyterlab/apputils';
import * as React from 'react';
import { File, trimPath } from '../service/file'
import { DetachedComment, createDetachedCommentFromJSON, CodeReviewComment, createReviewCommentFromJSON } from '../service/comment'
import { PageConfig } from '@jupyterlab/coreutils';
import { httpGitRequest, refreshIntervalRequest } from '../service/request';
import { stylesheet } from 'typestyle';
import List from '@material-ui/core/List';
import Typography from '@material-ui/core/Typography';
import CssBaseline from '@material-ui/core/CssBaseline';
import Divider from '@material-ui/core/Divider';
import { JupyterFrontEnd, ILabShell } from '@jupyterlab/application';
import { IDocumentManager } from '@jupyterlab/docmanager';
import { Comment } from '../components/comment'
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import AppBar from '@material-ui/core/AppBar';

interface Props {
  file: File,
  context: Context,
  refreshInterval: number,
}

interface State {
  detachedComments: DetachedComment[],
  reviewComments: CodeReviewComment[],
  fileName: string,
  serverRoot: string,
  activeTab: number,
}

export interface Context {
  app: JupyterFrontEnd,
  labShell: ILabShell,
  docManager: IDocumentManager,

}

const localStyles = stylesheet({
  root: {
    backgroundColor: 'white',
    overflow: 'auto',
    overflowY: 'auto',
  },
  header: {
    paddingLeft: 10,
    paddingTop: 10,
  },
});

export class CommentsComponent extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    const serverRoot = PageConfig.getOption('serverRoot');
    this.state = {
      reviewComments: [],
      detachedComments: [],
      fileName: this.props.file.filePath,
      serverRoot: serverRoot,
      activeTab: 0,
    };
    //Track when the user switches to viewing a different file
    var context = this.props.context;
    context.labShell.currentChanged.connect(() => {
        if (context.docManager.contextForWidget(context.labShell.currentWidget)) {
          this.getLocalComments();
        }
     });
  }


  async componentDidMount() {
    try {
      this.getLocalComments();
      const refreshInterval = this.props.refreshInterval * 1000;
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
          <Typography color="primary" variant="h5" className={localStyles.header} gutterBottom>
              Comments for {this.state.fileName}
          </Typography>
        <AppBar position="static">
          <Tabs value={activeTab} onChange={this.tabChange}>
            <Tab label="Review" value={0}/>
            <Tab label="Detached" value={1}/>
          </Tabs>
        </AppBar>
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
              showErrorMessage("Git repository error", "The file: " + filePath + " is not stored in a Git repository");
            } else {
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
              showErrorMessage("Git repository error", "The file: " + filePath + " is not stored in a Git repository");
            } else {
              if (data.comments) {
                data.comments.forEach(function(obj) {
                  var comment = createReviewCommentFromJSON(obj, data.revision, data.request);
                  comments.push(comment);
                });
                this.setState({reviewComments : comments, fileName: shortenedFilePath});
              }
            }
          }
          this.setState({reviewComments : comments, fileName: shortenedFilePath});

    }));
  }

  private async pullFromRemoteRepo(serverRoot: string, filePath: string) {
    httpGitRequest("remotePull", "POST", filePath, serverRoot);
  }

  private async getLocalComments() {
    const context = this.props.context;
    const currWidget = context.labShell.currentWidget;
    const filePath = context.docManager.contextForWidget(currWidget).path;
    this.getDetachedComments(this.state.serverRoot, filePath);
    this.getCodeReviewComments(this.state.serverRoot, filePath);
  }

  private async getLocalAndRemoteComments() {
    const context = this.props.context;
    const currWidget = context.labShell.currentWidget;
    const filePath = context.docManager.contextForWidget(currWidget).path;
    this.pullFromRemoteRepo(this.state.serverRoot, filePath);
    this.getDetachedComments(this.state.serverRoot, filePath);
    this.getCodeReviewComments(this.state.serverRoot, filePath);
  }
}

export class CommentsWidget extends ReactWidget {
  constructor(private file : File, private context : Context) {
    super();
    this.addClass('comments-widget');
  }

  render() {
    let interval: number = 10; //set a default refresh interval of 10 seconds
    refreshIntervalRequest().then(response => response.json().then(data => {
      if (data) {
        //update interval with value configured by the user in the Jupyter config file
        interval = data.interval;
      }
    }));
    return <CommentsComponent file = {this.file} context = {this.context} refreshInterval = {interval} />;
  }
}
