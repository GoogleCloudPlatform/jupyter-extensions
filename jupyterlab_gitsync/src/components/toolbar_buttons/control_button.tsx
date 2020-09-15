import React from 'react';

import { Props } from '../panel';

import { IconButton } from '@material-ui/core';
import PlayArrowIcon from '@material-ui/icons/PlayArrow';
import PauseIcon from '@material-ui/icons/Pause';

interface ControlButtonState {
  title: string;
  icon: any;
  isRunning: boolean;
}

export class ControlButton extends React.Component<Props, ControlButtonState> {
  constructor(props) {
    super(props);
    this.state = {
      title: 'Start Auto Sync',
      icon: <PlayArrowIcon fontSize="small" />,
      isRunning: false,
    };
  }

  componentDidMount() {
    this._addListeners();
  }

  render() {
    return (
      <IconButton
        title={this.state.title}
        color="inherit"
        onClick={() => this._onClick()}
      >
        {this.state.icon}
      </IconButton>
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
      title: 'Pause Auto Sync',
      icon: <PauseIcon fontSize="small" />,
      isRunning: true,
    });
  }

  private _setStopState() {
    this.setState({
      title: 'Start Auto Sync',
      icon: <PlayArrowIcon fontSize="small" />,
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
