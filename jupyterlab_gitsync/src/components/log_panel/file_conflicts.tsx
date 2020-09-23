import * as React from 'react';
import { classes, style } from 'typestyle';

import { logPanelClass, logEntryClass } from '../../style/log';

import { IFile } from '../../service/tracker';
import { Props } from '../panel';

import {
  Divider,
  Grid,
  IconButton,
  List,
  ListItem,
  Typography,
  Tooltip,
} from '@material-ui/core';

import CompareIcon from '@material-ui/icons/Compare';
import CheckBoxIcon from '@material-ui/icons/CheckBox';
import CheckBoxOutlineBlankIcon from '@material-ui/icons/CheckBoxOutlineBlank';

const disableHoverClass = style({
  $nest: {
    '&:hover': {
      backgroundColor: 'transparent !important',
    },
  },
});

interface ConflictItemProps extends Props {
  file: IFile;
}

interface ConflictItemState {
  resolved: boolean;
}

class ConflictItem extends React.Component<
  ConflictItemProps,
  ConflictItemState
> {
  constructor(props) {
    super(props);
    this.state = {
      resolved: false,
    };
  }

  render(): React.ReactElement {
    return (
      <ListItem className={classes(logEntryClass)}>
        <Grid container alignItems="center" justify="space-between" spacing={2}>
          <Grid item>
            <Tooltip title={this.props.file.path}>
              <Typography variant="body2">
                {this.props.file.path.substring(
                  this.props.file.path.lastIndexOf('/') + 1
                )}
              </Typography>
            </Tooltip>
          </Grid>
          <Grid item>
            <IconButton
              title={this.state.resolved ? 'View Resolved File' : 'View Diff'}
              onClick={() => this._onView()}
            >
              <CompareIcon fontSize="small" />
            </IconButton>
            <IconButton
              className={
                this.state.resolved ? classes(disableHoverClass) : undefined
              }
              title={this.state.resolved ? 'Resolved' : 'Mark As Resolved'}
              onClick={() => this._onResolve()}
              disableFocusRipple={this.state.resolved}
              disableRipple={this.state.resolved}
            >
              {this.state.resolved ? (
                <CheckBoxIcon fontSize="small" />
              ) : (
                <CheckBoxOutlineBlankIcon fontSize="small" />
              )}
            </IconButton>
          </Grid>
        </Grid>
      </ListItem>
    );
  }

  private async _onView() {
    if (this.state.resolved) await this.props.file.reveal();
    else await this.props.file.viewDiff();
  }

  private async _onResolve() {
    await this.props.file.markResolved();
    this.setState({ resolved: true });
  }
}

const hiddenClass = style({
  display: 'none',
});

interface ConflictListState {
  hidden: boolean;
  resolved: boolean;
  entries: IFile[];
}

export class ConflictList extends React.Component<Props, ConflictListState> {
  constructor(props) {
    super(props);
    this.state = {
      hidden: true,
      resolved: false,
      entries: [],
    };
  }

  componentDidMount() {
    this._addListeners();
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
        id="FileConflictsList"
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
        <React.Fragment key={`${entry.path}-fragment`}>
          {index ? <Divider /> : undefined}
          <ConflictItem service={this.props.service} file={entry} />
        </React.Fragment>
      );
    });
  }

  private _addListeners() {
    this.props.service.tracker.conflictState.connect((tracker, conflict) => {
      this.setState({ entries: tracker.conflicts });
    });
  }
}
