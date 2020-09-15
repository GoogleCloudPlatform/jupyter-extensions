import * as React from 'react';
import { classes } from 'typestyle';

import {
  ControlButton,
  SettingsButton,
  StatusButton,
  SyncButton,
} from './toolbar_buttons';

import { toolbarClass } from '../style/toolbar';

import { Props } from './panel';

export class Toolbar extends React.Component<Props> {
  /**
   * Returns a React component for rendering a panel toolbar.
   *
   * @param props - component properties
   * @returns React component
   */
  constructor(props: Props) {
    super(props);
  }

  /**
   * Renders the component.
   *
   * @returns React element
   */
  render(): React.ReactElement {
    return (
      <div className={classes('jp-Toolbar', toolbarClass)}>
        <StatusButton service={this.props.service} />
        <ControlButton service={this.props.service} />
        <SyncButton service={this.props.service} />
        <SettingsButton service={this.props.service} />
      </div>
    );
  }
}
