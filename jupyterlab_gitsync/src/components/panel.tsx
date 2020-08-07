import { ReactWidget, UseSignal } from '@jupyterlab/apputils';
import { Signal } from '@phosphor/signaling';
import * as React from 'react';

import { GitSyncService } from '../service/service';
import { Toolbar } from './toolbar';
import { GitSetup } from './setup';

import {
  // NOTE: keep in alphabetical order
  panel,
} from '../style/panel';

export interface Props {
  service: GitSyncService;
}

export class Panel extends React.Component<Props> {
  constructor(props: Props) {
    super(props);
  }

  render() {
    return (
      <div className={panel}>
        {this._renderToolbar()}
        {this._renderSetup()}
      </div>
    );
  }

  private _renderToolbar(): React.ReactElement {
    return <Toolbar service={this.props.service} />;
  }

  private _renderSetup(): React.ReactElement {
    return <GitSetup service={this.props.service} />;
  }
}

/** Widget to be registered in the left-side panel. */
export class GitSyncWidget extends ReactWidget {
  id = 'gitsync';
  private visibleSignal = new Signal<GitSyncWidget, boolean>(this);

  constructor(private readonly service: GitSyncService) {
    super();
    this.title.iconClass = 'jp-Icon jp-Icon-20 jp-git-icon';
    this.title.caption = 'Git Sync Widget';
  }

  onAfterHide() {
    this.visibleSignal.emit(false);
  }

  onAfterShow() {
    this.visibleSignal.emit(true);
  }

  render() {
    return (
      <UseSignal signal={this.visibleSignal}>
        {isVisible => <Panel service={this.service} />}
      </UseSignal>
    );
  }
}
