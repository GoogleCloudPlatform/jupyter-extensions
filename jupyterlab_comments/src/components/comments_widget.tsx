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
import { File } from '../service/file';
import { DetachedComment } from '../service/comment';
import { PageConfig } from '@jupyterlab/coreutils';
import { httpGitRequest } from '../git';
import { stylesheet } from 'typestyle';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import Typography from '@material-ui/core/Typography';
import CssBaseline from '@material-ui/core/CssBaseline';
import Divider from '@material-ui/core/Divider';
import { JupyterFrontEnd, ILabShell } from '@jupyterlab/application';
import { IDocumentManager } from '@jupyterlab/docmanager';
import { showErrorMessage } from '@jupyterlab/apputils';


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
  header: {
    borderBottom: 'var(--jp-border-width) solid var(--jp-border-color2)',
    fontWeight: 600,
    fontSize: 'var(--jp-ui-font-size0, 11px)',
    letterSpacing: '1px',
    margin: 0,
    padding: '8px 12px',
    textTransform: 'uppercase',
  },
  root: {
    backgroundColor: 'white',
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
        <ListItem button>
          <ListItemText primary= {comment.text} />
        </ListItem>
        <Divider variant="inset" component="li"/>
        </div>
      );
    return (
      <div className = {localStyles.root}>
        <CssBaseline />
          <Typography color="primary" variant="h5" gutterBottom>
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
                console.log(obj);
                const content = obj.comment;
                const hash = obj.hash;
                const children = obj.children;
                let comment : DetachedComment = {
                  author: content.author,
                  text: content.description,
                  timestamp: content.timestamp,
                  range: content.location.range,
                  hash: hash,
                };
                if (children) {
                  comment.children = children;
                }
                if (content.parent) {
                  comment.parent = parent;
                }
                comments.push(comment);
              });
              this.setState({detachedComments : comments, fileName: filePath});
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
