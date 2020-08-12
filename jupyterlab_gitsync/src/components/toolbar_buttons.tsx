import { style } from 'typestyle';
import { ToolbarButton } from './toolbar_btn_template';

// TO DO (ashleyswang): Change to non-inheritance implementation of React Component

export class ControlButton extends ToolbarButton {
  constructor(props) {
    super(
      props,
      'Stop Auto Sync',
      style({ backgroundImage: 'var(--jp-icon-stop)' }), 
      { running: true },
    );

    this.props.service.start();
    this._addListeners();
  }

  protected _onClick = (): void => {
    if (this.props.service.running) {
      this.props.service.stop();
    } else {
      this.props.service.start();
    }
  };

  private _setRunState() {
    this.setState({
      label: 'Stop Auto Sync',
      style: style({
        backgroundImage: 'var(--jp-icon-stop)',
      }),
      options: {running: true},
    });
  }

  private _setStopState() {
    this.setState({
      label: 'Start Auto Sync',
      style: style({
        backgroundImage: 'var(--jp-icon-run)',
      }),
      options: {running: false},
    });
  }

  private _addListeners() {
    this.props.service.stateChange.connect((service, running) => {
      if (running && !this.state.options.running)
        this._setRunState();
      else if (!running && this.state.options.running)
        this._setStopState();
    });
  }
}

export class StatusButton extends ToolbarButton {
  // TO DO (ashleyswang): add status indicator icon to show state of repo 
  constructor(props) {
    super(
      props,
      'Save All Open Files',
      style({ backgroundImage: 'var(--jp-icon-save)' })
    );
  }

  protected _onClick = (): void => {
    this.props.service.tracker.saveAll();
  };
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
    this.props.service.tracker.saveAll();
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
    this.props.service.tracker.current.reload();
  };
}