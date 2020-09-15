import * as React from 'react';
import { classes } from 'typestyle';

import { SyncLog } from './log_panel';

import { Props } from './panel';

import { logDisplayClass, logDisplayTabClass } from '../style/log';

import { Tab, Tabs } from '@material-ui/core';

interface LogDisplayState {
  value: number;
}

export class LogDisplay extends React.Component<Props, LogDisplayState> {
  SyncLogElement = React.createRef<SyncLog>();

  constructor(props) {
    super(props);
    this.state = {
      value: 0,
    };
  }

  render(): React.ReactElement {
    return (
      <div className={classes(logDisplayClass)}>
        <Tabs
          value={this.state.value}
          variant="fullWidth"
          indicatorColor="primary"
          textColor="primary"
          onChange={(event, value) => this._onChange(event, value)}
        >
          <Tab label="Sync Log" className={classes(logDisplayTabClass)} />
          <Tab label="Conflicts" className={classes(logDisplayTabClass)} />
        </Tabs>
        <SyncLog service={this.props.service} ref={this.SyncLogElement} />
      </div>
    );
  }

  private _onChange(event, value) {
    if (value !== 0) {
      this.SyncLogElement.current.hideComponent();
    } else {
      this.SyncLogElement.current.unhideComponent();
    }

    this.setState({
      value: value,
    });
  }
}
