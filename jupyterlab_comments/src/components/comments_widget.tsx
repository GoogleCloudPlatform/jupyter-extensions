import { ReactWidget } from '@jupyterlab/apputils';
import * as React from 'react';
import { File } from '../service/file'
import { PageConfig } from '@jupyterlab/coreutils';
import { httpGitRequest } from '../git'
import { stylesheet } from 'typestyle';

interface Props {
  file: File,
}

interface State {
  detachedComments: object[],
  reviewComments: object[],
  fileName: string,
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
});

export class CommentsComponent extends React.Component<Props, State> {

  constructor(props: Props) {
    super(props);
    this.state = {
      reviewComments: [],
      detachedComments: [],
      fileName: this.props.file.filePath,
    };
  }

  async componentDidMount() {
    try {
      this.getDetachedComments();
    } catch (err) {
      console.warn('Unexpected error', err);
    }
  }

  componentDidUpdate(prevProps: Props) {
    console.log("componentDidUpdate");
  }

  render() {
    const commentsList = this.state.detachedComments.map((commentJSON) =>
        <li key={commentJSON["timestamp"]}> {commentJSON["description"]}</li>
      );
    return (
      <div>
        <header className={localStyles.header}> Comments for {this.state.fileName} </header>
        <ul>{commentsList}</ul>
      </div>


      );
  }

  private async getDetachedComments() {
    const serverRoot = PageConfig.getOption('serverRoot');
    const filePath = this.props.file.filePath;
    //Fetch detached comments
    httpGitRequest("detachedComments", "GET", filePath, serverRoot).then(response => response.json().then(comments => {
          comments.forEach(function(comment) {
            console.log(comment);
          });
          this.setState({detachedComments : comments});

    }));
  }

}

export class CommentsWidget extends ReactWidget {
  constructor(readonly file : File) {
    super();
    this.addClass('comments-widget');
  }

  render() {
    return <CommentsComponent file={this.file} />;
  }


}
