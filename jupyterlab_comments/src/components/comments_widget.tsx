import { ReactWidget } from '@jupyterlab/apputils';
import * as React from 'react';
import { File } from '../service/file'
import { PageConfig } from '@jupyterlab/coreutils';
import { httpGitRequest } from '../git'


interface Props {
  file: File,
}

interface State {
  hasLoaded: boolean,
}

export class CommentsComponent extends React.Component<Props, State> {

  constructor(props: Props) {
    super(props);
    this.state = {
      hasLoaded: false,
    };
  }

  async componentDidMount() {
    try {
      //empty
    } catch (err) {
      console.warn('Unexpected error', err);
    }
  }

  componentDidUpdate(prevProps: Props) {
    this.getDetachedComments();
  }

  render() {
    return (<header> This is a test component </header>);
  }

  private async getDetachedComments() {
    const serverRoot = PageConfig.getOption('serverRoot');
    const filePath = this.props.file.filePath;
    //Fetch detached comments
    httpGitRequest("detachedComments", "GET", filePath, serverRoot).then(response => response.json().then(content => {
          console.log("Returned by backend request: " + JSON.stringify(content));
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
