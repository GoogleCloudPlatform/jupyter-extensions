import * as React from 'react';
import { Icon, Tooltip, IconButton } from '@material-ui/core';
import SyntaxHighlighter from 'react-syntax-highlighter';
import { docco } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import { Clipboard } from '@jupyterlab/apputils';

interface Props {
  code: string;
  copy?: boolean;
}

interface State {
  copyAlertOpen: boolean;
}

export class CopyCode extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      copyAlertOpen: false,
    };
  }

  render() {
    return (
      <div style={{ position: 'relative' }}>
        <SyntaxHighlighter language="python" style={docco} wrapLines={true}>
          {this.props.code}
        </SyntaxHighlighter>
        {this.props.copy !== false && (
          <div>
            <Tooltip title="Copy">
              <IconButton
                size="small"
                onClick={_ => {
                  Clipboard.copyToSystem(this.props.code);
                  this.setState({ copyAlertOpen: true });
                }}
                style={{ position: 'absolute', top: '16px', right: '16px' }}
              >
                <Icon>content_copy</Icon>
              </IconButton>
            </Tooltip>
          </div>
        )}
      </div>
    );
  }
}