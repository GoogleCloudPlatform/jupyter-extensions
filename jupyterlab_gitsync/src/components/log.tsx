import * as React from 'react';
import { classes } from 'typestyle';

import { SyncLog, ConflictList } from './log_panel';

import { Props } from './panel';

import { logDisplayClass, logDisplayTabClass } from '../style/log';

import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Tab,
  Tabs,
} from '@material-ui/core';

interface LogDisplayState {
  value: number;
  conflict: boolean;
  dialog: {
    open: boolean;
    msg: any;
  };
}

export class LogDisplay extends React.Component<Props, LogDisplayState> {
  private SyncLogElement = React.createRef<SyncLog>();
  private ConflictListElement = React.createRef<ConflictList>();

  constructor(props) {
    super(props);
    this.state = {
      value: 0,
      conflict: false,
      dialog: {
        open: false,
        msg: undefined,
      },
    };
  }

  componentDidMount() {
    this._addListeners();
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
          <Tab
            label="Conflicts"
            className={classes(logDisplayTabClass)}
            disabled={!this.state.conflict}
          />
        </Tabs>
        <SyncLog service={this.props.service} ref={this.SyncLogElement} />
        <ConflictList
          service={this.props.service}
          ref={this.ConflictListElement}
        />

        <Dialog
          open={this.state.dialog.open}
          onClose={() => this._onClose()}
          fullWidth
        >
          <DialogTitle>File Conflicts</DialogTitle>
          <DialogContent>
            <DialogContentText>{this.state.dialog.msg} </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => this._onClose()} color="primary">
              Cancel
            </Button>
            <Button onClick={() => this._onView()} color="primary" autoFocus>
              View Files
            </Button>
          </DialogActions>
        </Dialog>
      </div>
    );
  }

  private _onChange(event, value) {
    if (value === 0) {
      this.ConflictListElement.current.hideComponent();
      this.SyncLogElement.current.unhideComponent();
    } else if (value === 1) {
      this.SyncLogElement.current.hideComponent();
      this.ConflictListElement.current.unhideComponent();
    }

    this.setState({
      value: value,
    });
  }

  private _onClose() {
    this.setState({
      dialog: {
        open: false,
        msg: undefined,
      },
    });
  }

  private _onView() {
    this.setState({
      dialog: {
        open: false,
        msg: undefined,
      },
    });
    this._onChange(null, 1);
  }

  private _addListeners() {
    this.props.service.tracker.conflictState.connect((tracker, conflict) => {
      if (conflict) {
        const conflicts = tracker.conflicts;
        const repoPath = this.props.service.git.path.substring(
          this.props.service.git.path.lastIndexOf('/') + 1
        );
        const numConflicts = tracker.conflicts.length;
        let value = [];
        if (numConflicts === 1) {
          const fname = conflicts[0].path.substring(
            conflicts[0].path.lastIndexOf('/') + 1
          );
          value = ['File ', fname, ' has a conflict.'];
        } else if (numConflicts === 2) {
          const fname1 = conflicts[0].path.substring(
            conflicts[0].path.lastIndexOf('/') + 1
          );
          const fname2 = conflicts[1].path.substring(
            conflicts[1].path.lastIndexOf('/') + 1
          );
          value = ['Files ', fname1, ' and ', fname2, ' have conflicts.'];
        } else {
          const fname1 = conflicts[0].path.substring(
            conflicts[0].path.lastIndexOf('/') + 1
          );
          const fname2 = conflicts[1].path.substring(
            conflicts[1].path.lastIndexOf('/') + 1
          );
          value = [
            'Files ',
            fname1,
            ', ',
            fname2,
            `, and ${numConflicts - 2} other files have conflicts.`,
          ];
        }
        value[
          value.length - 1
        ] += ` Automatic syncing for ${repoPath} will be suspended until all 
        conflicts are resolved. Would you like to view the conflicting files?`;

        const msg = this._makeMessage(value, 'dialog');
        this.setState({
          conflict: true,
          dialog: {
            open: true,
            msg: msg,
          },
        });
      } else this.setState({ conflict: false });
    });
  }

  private _makeMessage(arr, id) {
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
