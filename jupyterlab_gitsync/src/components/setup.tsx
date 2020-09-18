import * as React from 'react';
import { classes } from 'typestyle';

import { GitPathSetup, GitBranchSetup } from './git_setup';

import { setupClass } from '../style/setup';

import { Props } from './panel';

export class GitSetup extends React.Component<Props, {}> {
  constructor(props) {
    super(props);
  }

  render(): React.ReactElement {
    return (
      <div className={classes(setupClass)}>
        <GitPathSetup service={this.props.service} />
        <GitBranchSetup service={this.props.service} />
      </div>
    );
  }
}
