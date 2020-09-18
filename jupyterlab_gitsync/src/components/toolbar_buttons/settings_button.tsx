import React from 'react';

import { Props } from '../panel';

import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  Input,
  InputAdornment,
  Slider,
  Tooltip,
  Typography,
} from '@material-ui/core';

import HelpOutlineIcon from '@material-ui/icons/HelpOutline';
import SettingsIcon from '@material-ui/icons/Settings';
import TimerIcon from '@material-ui/icons/Timer';

interface SettingsButtonState {
  open: boolean;
  value: number | string;
}

export class SettingsButton extends React.Component<
  Props,
  SettingsButtonState
> {
  readonly maxInterval = 120;

  constructor(props) {
    super(props);
    this.state = {
      open: false,
      value: this.props.service.syncInterval / 1000,
    };
  }

  render() {
    return (
      <React.Fragment>
        <IconButton
          title="Settings"
          color="inherit"
          onClick={() => this._onClick()}
        >
          <SettingsIcon fontSize="small" />
        </IconButton>

        <Dialog
          open={this.state.open}
          onClose={() => this._onClose()}
          fullWidth
        >
          <DialogTitle>Settings</DialogTitle>
          <DialogContent>
            <Grid container alignItems="center" spacing={2}>
              <Grid item xs={11}>
                <Typography id="input-slider">Sync Frequency</Typography>
              </Grid>
              <Grid item xs={1}>
                <Tooltip title="Time between each sync with remote repository. After each sync, the extension will wait before syncing again.">
                  <HelpOutlineIcon color="disabled" />
                </Tooltip>
              </Grid>
              <Grid item xs={1}>
                <TimerIcon />
              </Grid>
              <Grid item xs={7}>
                <Slider
                  value={
                    typeof this.state.value === 'number'
                      ? this.state.value / (this.maxInterval / 100)
                      : 0
                  }
                  onChange={(event, value) =>
                    this._onSliderChange(event, value)
                  }
                  aria-labelledby="sync-interval-slider"
                />
              </Grid>
              <Grid item xs={4}>
                <Input
                  value={this.state.value}
                  onChange={event => this._onInputChange(event)}
                  onBlur={() => this._onBlur()}
                  margin="dense"
                  inputProps={{
                    step: 1,
                    min: 0,
                    max: this.maxInterval,
                    type: 'number',
                    'aria-labelledby': 'sync-interval-slider',
                  }}
                  endAdornment={
                    <InputAdornment position="end">seconds</InputAdornment>
                  }
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => this._onClose()} color="primary">
              Cancel
            </Button>
            <Button
              onClick={() => this._onSave()}
              color="primary"
              variant="contained"
            >
              Save
            </Button>
          </DialogActions>
        </Dialog>
      </React.Fragment>
    );
  }

  private _onClick(): void {
    this.setState({ open: true });
  }

  private _onClose(): void {
    this.setState({ open: false });
  }

  private _onSave(): void {
    this.props.service.syncInterval =
      typeof this.state.value === 'number' ? this.state.value * 1000 : 0;
    this.setState({ open: false });
  }

  private _onSliderChange(event, value): void {
    const interval = Math.round(value * (this.maxInterval / 100));
    this.setState({ value: interval });
  }

  private _onInputChange(event): void {
    const interval =
      event.target.value === '' ? '' : Number(event.target.value);
    this.setState({ value: interval });
  }

  private _onBlur(): void {
    if (this.state.value < 0) {
      this.setState({ value: 0 });
    } else if (this.state.value > this.maxInterval) {
      this.setState({ value: this.maxInterval });
    }
  }
}
