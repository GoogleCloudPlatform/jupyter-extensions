import * as React from 'react';
import { classes, style } from 'typestyle';
import { animateScroll } from "react-scroll";

import { 
  logPanelClass,
  logEntryClass,
  logEntryTimeClass,
  logEntryValueClass,
} from '../../style/log';

import { Props } from '../panel';

import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import Divider from '@material-ui/core/Divider';
import Typography from '@material-ui/core/Typography';

interface SyncLogState {
  hidden: boolean;
  entries: {
    date: Date;
    value: string;
    error?: boolean;
  }[];
}

const hiddenClass = style({
  display: 'none', 
});

export class SyncLog extends React.Component<Props, SyncLogState> {
  scroll: boolean = false;

  constructor(props) {
    super(props);
    this.state = {
      hidden: false,
      entries: [],
    }
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
    return(
      <List 
        id="GitSyncLog" 
        className={this.state.hidden ? classes(logPanelClass, hiddenClass) : classes(logPanelClass)}
      >
        {this._renderEntries()}
      </List>
    );
  }

  private _renderEntries(){
    return this.state.entries.map((entry, index) => {
      return (
        <React.Fragment key={`${index}-fragment`}>
          {(index) ? <Divider /> : undefined }
          <ListItem key={`${index}-listItem`} className={classes(logEntryClass)}>
            <Typography 
              className={classes(logEntryTimeClass)} 
              color="textSecondary"
              variant="body2"
              key={`${index}-time`}
            > 
              {entry.date.toTimeString().split(' ')[0]} 
            </Typography>
            <Typography 
              className={classes(logEntryValueClass)} 
              color={entry.error ? "error" : "textPrimary"}
              variant="body2"
              key={`${index}-value`}
            > 
              {entry.value}
            </Typography>
          </ListItem>
        </React.Fragment>
      )
    });
  }

  private _addListeners() {
    this.props.service.statusChange.connect((_, value) => {
      let entries = this.state.entries;
      switch (value.status) {
        case 'sync':
          entries.push({
            date: new Date(),
            value: 'Saved local changes. Syncing repository...',
          });
          break;
        case 'up-to-date':
          entries[entries.length -1] = {
            date: new Date(),
            value: 'Synced and merged changes from remote repository.',
          };
          break;
        case 'warning':
          entries.push({
            date: new Date(),
            value: value.error,
            error: true,
          });
          break;
      }
      this.scroll = true;
      this.setState({ entries: entries});
    });

    this.props.service.setupChange.connect((_, value) => {
      let entries = this.state.entries;
      entries.push({
        date: new Date(),
        value: value.value,
      });
      this.scroll = true;
      this.setState({ entries: entries });
    });

    this.props.service.stateChange.connect((_, running) => {
      let entries = this.state.entries;
      if (running){
        entries.push({
          date: new Date(),
          value: 'Starting sync with git repository.',
        });
      }
      else if (!running){
        entries.push({
          date: new Date(),
          value: 'Stopping sync service.',
        });
      }
      this.scroll = true;
      this.setState({ entries: entries });
    });
  }

  private _scrollToBottom() {
    this.scroll = false;
    animateScroll.scrollToBottom({
      containerId: "GitSyncLog",
      duration: 500
    });
  }
}