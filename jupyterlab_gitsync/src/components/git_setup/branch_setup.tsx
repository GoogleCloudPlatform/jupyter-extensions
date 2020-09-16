import * as React from 'react';
import { classes } from 'typestyle';

import { Props } from '../panel';

import {
  setupHelperTextClass,
  setupItemClass,
  setupItemInnerClass,
} from '../../style/setup';

import FormControl from '@material-ui/core/FormControl';
import FormHelperText from '@material-ui/core/FormHelperText';
import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';

interface GitBranchState {
  disabled: boolean;
  currBranch: string;
  branches: string[];
}

export class GitBranchSetup extends React.Component<Props, GitBranchState> {
  constructor(props) {
    super(props);
    this.state = {
      disabled: false,
      currBranch: '',
      branches: [],
    };
  }

  componentDidMount() {
    this._addListeners();
    this._setBranches();
  }

  render(): React.ReactElement {
    return (
      <FormControl
        className={classes(setupItemClass)}
        disabled={this.state.disabled}
        variant="outlined"
      >
        <FormHelperText className={setupHelperTextClass}>Branch</FormHelperText>
        <Select
          className={classes(setupItemInnerClass)}
          value={this.state.currBranch}
          onChange={event => this._onChange(event)}
        >
          {this._renderBranches()}
        </Select>
      </FormControl>
    );
  }

  private _renderBranches() {
    if (this.state.branches) {
      return this.state.branches.map(branch => {
        return (
          <MenuItem key={branch} value={branch}>
            {branch}
          </MenuItem>
        );
      });
    } else {
      this.setState({
        currBranch: 'Cannot Switch Branch',
        disabled: true,
      });
      return (
        <MenuItem key="DEFAULT_VAL" value="Cannot Switch Branch"></MenuItem>
      );
    }
  }

  private _onChange(event) {
    if (event.target.value) {
      this.setState({ currBranch: event.target.value });
      this.props.service.setup(null, event.target.value);
    }
  }

  /* Only allow branch changes if we have successfully set up a git path */
  /* or we are not currently changing a branch already */
  private _addListeners() {
    this.props.service.git.setupChange.connect((_, status) => {
      if (status === 'start' && !this.state.disabled)
        this.setState({ disabled: true });
      else if (status === 'finish') {
        this.setState({
          disabled: false,
          currBranch: this.props.service.git.branch,
          branches: this.props.service.git.branches,
        });
      } else if (status === 'change') {
        this.setState({
          disabled: false,
          currBranch: this.props.service.git.branch,
        });
      }
    });
  }

  private _setBranches() {
    setTimeout(() => {
      this.setState({
        currBranch: this.props.service.git.branch,
        branches: this.props.service.git.branches,
      });
    }, 2000);
  }
}
