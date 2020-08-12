import React from 'react';
import { style } from 'typestyle';

import { Props } from './panel';
import { ToolbarButton } from './toolbar_button';

interface ControlButtonState {
  title: string;
  style: string;
  isRunning: boolean;
}

export class ControlButton extends React.Component<Props, ControlButtonState> {
  constructor(props) {
    super(props);
    this.state = {
      title: 'Stop Auto Sync',
      style: style({ backgroundImage: 'var(--jp-icon-stop)' }),
      isRunning: true,
    };
  }

  componentDidMount() {
    this.props.service.start();
    this._addListeners();
  }

  render() {
    const { title, style } = this.state;
    return (
      <ToolbarButton
        title={title}
        service={this.props.service}
        style={style}
        onClick={() => this._onClick()}
      />
    );
  }

  private _onClick(): void {
    if (this.props.service.running) {
      this.props.service.stop();
    } else {
      this.props.service.start();
    }
  }

  private _setRunState() {
    this.setState({
      title: 'Stop Auto Sync',
      style: style({
        backgroundImage: 'var(--jp-icon-stop)',
      }),
      isRunning: true,
    });
  }

  private _setStopState() {
    this.setState({
      title: 'Start Auto Sync',
      style: style({
        backgroundImage: 'var(--jp-icon-run)',
      }),
      isRunning: false,
    });
  }

  private _addListeners() {
    this.props.service.stateChange.connect((_, running) => {
      if (running && !this.state.isRunning) this._setRunState();
      else if (!running && this.state.isRunning) this._setStopState();
    });
  }
}

export class StatusButton extends React.Component<Props, {}> {
  // TO DO (ashleyswang): add status button to show sync state of repo 
  private readonly title = 'Save All Open Files';
  private readonly style = style({ backgroundImage: 'var(--jp-icon-stop)' });

  render() {
    return (
      <ToolbarButton
        title={this.title}
        service={this.props.service}
        style={this.style}
        onClick={() => this._onClick()}
      />
    );
  }

  private _onClick(): void {
    this.props.service.tracker.saveAll();
  }
}

export class SaveButton extends React.Component<Props, {}> {
  private readonly title = 'Save All Open Files';
  private readonly style = style({ backgroundImage: 'var(--jp-icon-save)' });

  render() {
    return (
      <ToolbarButton
        title={this.title}
        service={this.props.service}
        style={this.style}
        onClick={() => this._onClick()}
      />
    );
  }

  private _onClick(): void {
    this.props.service.tracker.saveAll();
  }
}

export class SyncButton extends React.Component<Props, {}> {
  private readonly title = 'Sync With Remote Repo';
  private readonly style = style({ backgroundImage: 'var(--jp-icon-refresh)' });

  render() {
    return (
      <ToolbarButton
        title={this.title}
        service={this.props.service}
        style={this.style}
        onClick={() => this._onClick()}
      />
    );
  }

  private _onClick(): void {
    this.props.service.git.sync();
  }
}

export class ReloadButton extends React.Component<Props, {}> {
  private readonly title = 'Reload All Open Files';
  private readonly style = style({ backgroundImage: 'var(--jp--icon-bug)' });

  render() {
    return (
      <ToolbarButton
        title={this.title}
        service={this.props.service}
        style={this.style}
        onClick={() => this._onClick()}
      />
    );
  }

  private _onClick(): void {
    this.props.service.tracker.current.reload();
  }
}