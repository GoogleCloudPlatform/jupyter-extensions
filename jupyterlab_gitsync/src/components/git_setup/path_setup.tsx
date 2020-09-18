import * as React from 'react';
import { classes } from 'typestyle';

import { Props } from '../panel';

import {
  setupHelperTextClass,
  setupItemClass,
  setupItemInnerClass,
} from '../../style/setup';

import { FormControl, FormHelperText, OutlinedInput } from '@material-ui/core';

interface GitPathState {
  path: string;
}

export class GitPathSetup extends React.Component<Props, GitPathState> {
  constructor(props) {
    super(props);
    this.state = {
      path: this.props.service.git.path
        ? this._shortenPath(this.props.service.git.path)
        : 'No Git Repository Found',
    };
  }

  componentDidMount() {
    this._addListeners();
  }

  render(): React.ReactElement {
    return (
      <FormControl
        className={classes(setupItemClass)}
        disabled
        variant="outlined"
      >
        <FormHelperText className={setupHelperTextClass}>
          Repository
        </FormHelperText>
        <OutlinedInput
          className={classes(setupItemInnerClass)}
          value={this.state.path}
          style={{ color: 'var(--jp-ui-font-color0)' }}
        />
      </FormControl>
    );
  }

  private _addListeners() {
    this.props.service.setupChange.connect((_, value) => {
      if (value.status === 'success' && value.attrib === 'path')
        this.setState({
          path: this.props.service.git.path
            ? this._shortenPath(this.props.service.git.path)
            : 'No Git Repository Found',
        });
    });
  }

  private _shortenPath(path: string): string {
    return path.substring(path.lastIndexOf('/') + 1);
  }
}
