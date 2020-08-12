import { Clipboard } from '@jupyterlab/apputils';
import { Icon, IconButton, Portal, Tooltip } from '@material-ui/core';
import * as React from 'react';
import SyntaxHighlighter from 'react-syntax-highlighter';
import { docco } from 'react-syntax-highlighter/dist/cjs/styles/hljs';
import { AppContext } from '../context';
import { CodeGenService } from '../service/code_gen';
import Toast from './toast';

interface Props {
  code?: string;
  copyEnabled?: boolean;
  generateEnabled?: boolean;
}

interface State {
  copyAlertOpen: boolean;
  generateAlertOpen: boolean;
}

export class CodeComponent extends React.Component<Props, null> {
  constructor(props: Props) {
    super(props);
  }

  render() {
    return (
      <div style={{ position: 'relative' }}>
        <SyntaxHighlighter language="python" style={docco} wrapLines={true}>
          {this.props.children}
        </SyntaxHighlighter>
        <CodeComponentActions
          copyEnabled={this.props.copyEnabled}
          code={this.props.children.toString()}
          generateEnabled={this.props.generateEnabled}
        />
      </div>
    );
  }
}

export class CodeComponentActions extends React.Component<Props, State> {
  static contextType = AppContext;

  constructor(props: Props) {
    super(props);
    this.state = {
      copyAlertOpen: false,
      generateAlertOpen: false,
    };
  }

  render() {
    return (
      <div style={{ position: 'absolute', top: '16px', right: '8px' }}>
        {this.props.copyEnabled !== false && (
          <>
            <Tooltip title="Copy">
              <IconButton
                size="small"
                onClick={_ => {
                  Clipboard.copyToSystem(this.props.code);
                  this.setState({ copyAlertOpen: true });
                }}
              >
                <Icon>content_copy</Icon>
              </IconButton>
            </Tooltip>
            <Portal>
              <Toast
                open={this.state.copyAlertOpen}
                message={'Code copied to clipboard'}
                autoHideDuration={4000}
                onClose={() => {
                  this.setState({ copyAlertOpen: false });
                }}
              />
            </Portal>
          </>
        )}
        {this.props.generateEnabled !== false && (
          <>
            <Tooltip title="Generate code cell">
              <IconButton
                size="small"
                color="primary"
                onClick={_ => {
                  CodeGenService.generateCodeCell(
                    this.context,
                    this.props.code,
                    null
                  );
                  this.setState({ generateAlertOpen: true });
                }}
              >
                <Icon>add_box</Icon>
              </IconButton>
            </Tooltip>
            <Portal>
              <Toast
                open={this.state.generateAlertOpen}
                message={'Generated code cell!'}
                autoHideDuration={4000}
                onClose={() => {
                  this.setState({ generateAlertOpen: false });
                }}
              />
            </Portal>
          </>
        )}
      </div>
    );
  }
}
