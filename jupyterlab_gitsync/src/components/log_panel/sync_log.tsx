import * as React from 'react';
import { classes, style } from 'typestyle';
import { animateScroll } from 'react-scroll';

import {
  logPanelClass,
  logEntryClass,
  logEntryTimeClass,
  logEntryValueClass,
} from '../../style/log';

import { Props } from '../panel';

import { Box, Divider, List, ListItem, Typography } from '@material-ui/core';

const hiddenClass = style({
  display: 'none',
});

interface SyncLogState {
  hidden: boolean;
  entries: {
    date: Date;
    value: any;
    id: string;
    error?: boolean;
  }[];
}

export class SyncLog extends React.Component<Props, SyncLogState> {
  scroll = false;

  constructor(props) {
    super(props);
    this.state = {
      hidden: false,
      entries: [],
    };
  }

  componentDidMount() {
    this._addListeners();
  }

  componentDidUpdate() {
    if (this.scroll) this._scrollToBottom();
  }

  hideComponent() {
    this.setState({
      hidden: true,
    });
  }

  unhideComponent() {
    this.setState({
      hidden: false,
    });
  }

  render(): React.ReactElement {
    return (
      <List
        id="GitSyncLog"
        className={
          this.state.hidden
            ? classes(logPanelClass, hiddenClass)
            : classes(logPanelClass)
        }
      >
        {this._renderEntries()}
      </List>
    );
  }

  private _renderEntries() {
    return this.state.entries.map((entry, index) => {
      return (
        <React.Fragment key={`${entry.id}-fragment`}>
          {index ? <Divider /> : undefined}
          <ListItem
            key={`${entry.id}-listItem`}
            className={classes(logEntryClass)}
          >
            <Typography
              className={classes(logEntryTimeClass)}
              color="textSecondary"
              variant="body2"
              key={`${entry.id}-timestamp`}
            >
              {entry.date.toTimeString().split(' ')[0]}
            </Typography>
            <Typography
              className={classes(logEntryValueClass)}
              color={entry.error ? 'error' : 'textPrimary'}
              variant="body2"
              key={`${entry.id}-value`}
              component="div"
            >
              {entry.value}
            </Typography>
          </ListItem>
        </React.Fragment>
      );
    });
  }

  private _addListeners() {
    this.props.service.statusChange.connect((_, value) => {
      const entries = this.state.entries;
      switch (value.status) {
        case 'sync': {
          entries.push({
            date: new Date(),
            value: 'Saved local changes. Syncing repository...',
            id: this._token(),
          });
          break;
        }
        case 'up-to-date': {
          const i = this._findLast(
            entries,
            x => x.value === 'Saved local changes. Syncing repository...'
          ).index;
          entries[i] = {
            date: new Date(),
            value: 'Synced and merged changes from remote repository.',
            id: this._token(),
          };
          break;
        }
        case 'warning': {
          entries.push({
            date: new Date(),
            value: value.error,
            id: this._token(),
            error: true,
          });
          break;
        }
      }
      this.scroll = true;
      this.setState({ entries: entries });
    });

    this.props.service.setupChange.connect((_, response) => {
      const entries = this.state.entries;
      const id = this._token();
      const value = this._makeSetupEntry(response.value, id);
      entries.push({
        date: new Date(),
        value: value,
        id: id,
      });
      this.scroll = true;
      this.setState({ entries: entries });
    });

    this.props.service.runningChange.connect((_, running) => {
      const entries = this.state.entries;
      if (running) {
        entries.push({
          date: new Date(),
          value: 'Starting sync with git repository.',
          id: this._token(),
        });
      } else if (!running) {
        entries.push({
          date: new Date(),
          value: 'Stopping sync service.',
          id: this._token(),
        });
      }
      this.scroll = true;
      this.setState({ entries: entries });
    });
  }

  private _scrollToBottom() {
    this.scroll = false;
    animateScroll.scrollToBottom({
      containerId: 'GitSyncLog',
      duration: 500,
    });
  }

  private _token(): string {
    let token = '';
    while (token.length < 32)
      token += Math.random()
        .toString(36)
        .substr(2);
    return token;
  }

  private _findLast(arr, condition) {
    for (let i = arr.length - 1; i > -1; i--) {
      const item = arr[i];
      if (condition(item)) {
        return { value: item, index: i };
      }
    }
  }

  private _makeSetupEntry(arr, id) {
    return arr.map((value, index) => {
      if (index % 2) {
        return (
          <Box
            key={`${id}-innerBox${index}`}
            fontWeight="fontWeightBold"
            display="inline"
          >
            {value}
          </Box>
        );
      } else {
        return (
          <React.Fragment key={`${id}-innerFrag${index}`}>
            {value}
          </React.Fragment>
        );
      }
    });
  }
}
