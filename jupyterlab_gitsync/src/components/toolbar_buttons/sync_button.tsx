import React from 'react';

import { Props } from '../panel';

import { IconButton } from '@material-ui/core';
import SyncIcon from '@material-ui/icons/Sync';

interface SyncButtonState {
  disabled: boolean;
}

export class SyncButton extends React.Component<Props, SyncButtonState> {
  constructor(props) {
    super(props);
    this.state = {
      disabled: false,
    };
  }

  componentDidMount() {
    this._addListeners();
  }

  render() {
    return (
      <IconButton
        title="Sync Repository Once"
        color="inherit"
        onClick={() => this._onClick()}
        disabled={this.state.disabled}
      >
        <SyncIcon fontSize="small" />
      </IconButton>
    );
  }

  private _onClick(): void {
    this.props.service.sync();
  }

  private _addListeners() {
    this.props.service.blockedChange.connect((_, blocked) => {
      this.setState({ disabled: blocked });
    });
  }
}
