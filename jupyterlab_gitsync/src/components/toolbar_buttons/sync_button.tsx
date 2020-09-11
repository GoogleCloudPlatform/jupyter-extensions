import React from 'react';

import { Props } from '../panel';

import { IconButton } from '@material-ui/core';
import SyncIcon from '@material-ui/icons/Sync';

export class SyncButton extends React.Component<Props, {}> {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <IconButton
        title='Sync Repository Once'
        color='inherit'
        onClick={() => this._onClick()}
      >
        <SyncIcon fontSize='small'/>
      </IconButton>
    );
  }

  private _onClick(): void {
    this.props.service.sync();
  }
}