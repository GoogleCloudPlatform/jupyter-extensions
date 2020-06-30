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
import { DetachedComment, createCommentFromJSON } from '../service/comment'
import { PageConfig } from '@jupyterlab/coreutils';
import { httpGitRequest } from '../git';
import { stylesheet } from 'typestyle';
import List from '@material-ui/core/List';
import Typography from '@material-ui/core/Typography';
import CssBaseline from '@material-ui/core/CssBaseline';
import Divider from '@material-ui/core/Divider';
import { JupyterFrontEnd, ILabShell } from '@jupyterlab/application';
import { IDocumentManager } from '@jupyterlab/docmanager';
import { Comment } from '../components/comment'


interface Props {
  file: File,
  context: Context,
}

interface State {
  detachedComments: DetachedComment[],
  reviewComments: object[],
  fileName: string,
}

export interface Context {
  app: JupyterFrontEnd,
  labShell: ILabShell,
  docManager: IDocumentManager,

}

const localStyles = stylesheet({
  root: {
    backgroundColor: 'white',
  },
  header: {
    paddingLeft: 10,
    paddingTop: 10,
  },
});

export class CommentsComponent extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      reviewComments: [],
      detachedComments: [],
      fileName: this.props.file.filePath,
    };
    var context = props.context;
    //Track when the user switches to viewing a different file
    context.labShell.currentChanged.connect(() => {
        if (context.docManager.contextForWidget(context.labShell.currentWidget)) {
          console.log("Fetching comments for a different file");
          this.getDetachedComments();
        }
     });
  }

  async componentDidMount() {
    try {
      this.getDetachedComments();
    } catch (err) {
      console.warn('Unexpected error', err);
    }
  }

  componentDidUpdate(prevProps: Props) {
    console.log("componentDidUpdate()");
  }

  render() {
    //TODO (mkalil): render entire comment threads, not just top level comments
    const commentsList = this.state.detachedComments.map((comment) =>
        <div>
        <Comment data={comment}/>
        <Divider/>
        </div>
      );
    return (
      <div className = {localStyles.root}>
        <CssBaseline />
          <Typography color="primary" variant="h5" className={localStyles.header} gutterBottom>
              Comments for {this.state.fileName}
          </Typography>
        <List>{commentsList}</List>
      </div>
    );
  }

  private async getDetachedComments() {
    const serverRoot = PageConfig.getOption('serverRoot');
    const context = this.props.context;
    var currWidget = context.labShell.currentWidget;
    var filePath = context.docManager.contextForWidget(currWidget).path;
    //Fetch detached comments
    httpGitRequest("detachedComments", "GET", filePath, serverRoot).then(response => response.json().then(data => {
          if (data) {
            if (data.error_message) {
              showErrorMessage("Git repository error", "The file: " + filePath + " is not stored in a Git repository");
            } else {
              let comments : Array<DetachedComment> = new Array<DetachedComment>();
              data.forEach(function(obj) {
                var comment = createCommentFromJSON(obj);
                comments.push(comment);
              });
              const shortenedFilePath = trimPath(filePath);
              this.setState({detachedComments : comments, fileName: shortenedFilePath});
            }
          }
    }));
  }
}

export class CommentsWidget extends ReactWidget {
  constructor(private file : File, private context : Context) {
    super();
    this.addClass('comments-widget');
  }

  render() {
    return <CommentsComponent file = {this.file} context = {this.context} />;
  }
}
