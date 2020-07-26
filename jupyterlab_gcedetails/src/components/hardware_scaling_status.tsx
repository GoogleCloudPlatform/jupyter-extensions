import * as React from 'react';

enum Status {
  'Authorizing' = 1,
  'Stopping Instance' = 2,
  'Reshaping Instance' = 3,
  'Starting Instance' = 4,
  'Failed' = -1,
}

interface State {
  status: Status;
  authToken?: string;
}
export class HardwareScalingStatus extends React.Component<{}, State> {
  private authPopup: any;
  private readonly listener = (message: MessageEvent) => {
    this.authPopup.close();
    window.removeEventListener('message', this.listener);
    if (message.data['error']) {
      this.setState({
        status: Status.Failed,
      });
    } else {
      this.setState({
        status: Status['Reshaping Instance'],
        authToken: message.data['credentials'],
      });
    }
  };
  private readonly oAuthHost =
    'https://jupyterlab-interns-sandbox.uc.r.appspot.com/authorize';
  constructor(props: {}) {
    super(props);
    this.state = {
      status: Status.Authorizing,
    };
  }

  componentDidMount() {
    window.addEventListener('message', this.listener);
    this.authPopup = window.open(
      `${this.oAuthHost}/authorize`,
      '_authPopup',
      'left=100,top=100,width=400,height=400'
    );
  }

  componentWillUnmount() {
    window.removeEventListener('message', this.listener);
  }
  /* Will implement after
  render() {
  }
  */
}
