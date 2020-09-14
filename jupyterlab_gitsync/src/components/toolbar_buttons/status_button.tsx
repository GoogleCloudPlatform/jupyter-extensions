import React from 'react';

import { Props } from '../panel';

import { IconButton } from '@material-ui/core';
import CircularProgress from '@material-ui/core/CircularProgress';
import SyncProblemIcon from '@material-ui/icons/SyncProblem';
import DoneAllIcon from '@material-ui/icons/DoneAll';
import DoneIcon from '@material-ui/icons/Done';


interface StatusButtonState {
  title: string;
  icon: any;
  status: string;
}

export class StatusButton extends React.Component<Props, StatusButtonState> {
  constructor(props) {
    super(props);
    this.state = {
      title: 'All Files Up To Date',
      icon: <DoneAllIcon fontSize='small'/>,
      status: 'up-to-date',
    };
  }

  componentDidMount() {
    this._addListeners();
  }

  render() {
    return (
      <IconButton
        title={this.state.title}
        color='inherit'
        disabled
      >
        {this.state.icon}
      </IconButton>
    );
  }

  private _setUpToDateState(): void {
    this.setState({
      title: 'All Files Up To Date',
      icon: <DoneAllIcon fontSize='small'/>,
      status: 'up-to-date',
    })
  }

  private _setSyncState(): void {
    this.setState({
      title: 'Syncing with Remote Repository',
      icon: <CircularProgress size={20} />,
      status: 'sync',
    })
  }

  private _setDirtyState(): void {
    this.setState({
      title: 'Files have Unpushed Changes',
      icon: <DoneIcon fontSize='small'/>,
      status: 'dirty',
    })
  }

  private _setWarningState(): void {
    this.setState({
      title: 'Error has Occurred',
      icon: <SyncProblemIcon fontSize='small'/>,
      status: 'warning',
    })
  }

  private _addListeners() {
    this.props.service.statusChange.connect((_, value) => {
      console.log(value.status);
      if (value.status != this.state.status){
        switch (value.status) {
          case 'up-to-date':
            this._setUpToDateState();
            break;
          case 'sync':
            this._setSyncState();
            break;
          case 'dirty':
            this._setDirtyState();
            break;
          case 'warning':
            this._setWarningState();
            break;
        }
      }
    });
  }
}