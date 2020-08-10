import * as React from 'react';
import { classes, style } from 'typestyle';
import {
  toolbarItemClass,
  toolbarButtonClass,
  toolbarButtonIconClass,
} from '../style/toolbar';

import { Props } from './panel';

export interface State {
  state: string;
  label: string;
  style: ReturnType<typeof style>;
}

class ToolbarButton extends React.Component<Props, State> {
  constructor(
    props: Props,
    init_label: string,
    init_style: ReturnType<typeof style>
  ) {
    super(props);
    this.state = {
      state: 'Running',
      label: init_label,
      style: init_style,
    };
  }

  render(): React.ReactElement {
    return (
      <div
        className={classes(
          'jp-ToolbarButton',
          'jp-Toolbar-item',
          toolbarItemClass
        )}
      >
        <button
          className={classes(
            'bp3-button',
            'bp3-minimal',
            'jp-ToolbarButtonComponent',
            'minimal',
            'jp-Button',
            toolbarButtonClass
          )}
          title={this.state.label}
          onClick={this._onClick}
        >
          <span className={classes('bp3-button-text')}>
            <span
              className={classes(
                'jp-ToolbarButtonComponent-icon',
                toolbarButtonIconClass,
                this.state.style
              )}
            >
              {' '}
            </span>
          </span>
        </button>
      </div>
    );
  }

  protected _onClick = (): void => {
    console.log('hi');
  };
}

export class ControlButton extends ToolbarButton {
  constructor(props) {
    super(
      props,
      'Stop Auto Sync',
      style({ backgroundImage: 'var(--jp-icon-stop)' })
    );

    this.props.service.start();
  }

  protected _onClick = (): void => {
    if (this.props.service.isRunning) {
      this._stopSync();
    } else {
      this._startSync();
    }
  };

  private _startSync() {
    this.props.service.start();
    this.setState({
      state: 'Running',
      label: 'Stop Auto Sync',
      style: style({
        backgroundImage: 'var(--jp-icon-stop)',
      }),
    });
  }

  private _stopSync() {
    this.props.service.stop();
    this.setState({
      state: 'Stopped',
      label: 'Start Auto Sync',
      style: style({
        backgroundImage: 'var(--jp-icon-run)',
      }),
    });
  }
}

export class SaveButton extends ToolbarButton {
  constructor(props) {
    super(
      props,
      'Save All Open Files',
      style({ backgroundImage: 'var(--jp-icon-save)' })
    );
  }

  protected _onClick = (): void => {
    this.props.service.files.saveAll();
  };
}

export class SyncButton extends ToolbarButton {
  constructor(props) {
    super(
      props,
      'Sync With Remote Repo',
      style({ backgroundImage: 'var(--jp-icon-refresh)' })
    );
  }

  protected _onClick = (): void => {
    this.props.service.git.sync();
  };
}

export class ReloadButton extends ToolbarButton {
  constructor(props) {
    super(
      props,
      'Reload All Open Files',
      style({ backgroundImage: 'var(--jp-icon-bug)' })
    );
  }

  protected _onClick = (): void => {
    this.props.service.files.current.reload();
  };
}

export class LogEditorButton extends ToolbarButton {
  constructor(props) {
    super(
      props,
      'console.log(editor)',
      style({ backgroundImage: 'var(--jp-icon-bug)' })
    );
  }

  protected _onClick = (): void => {
    console.log(this.props.service.editor);
  };
}
