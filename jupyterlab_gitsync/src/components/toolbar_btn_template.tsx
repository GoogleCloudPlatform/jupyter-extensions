import * as React from 'react';
import { classes, style } from 'typestyle';
import {
  toolbarItemClass,
  toolbarButtonClass,
  toolbarButtonIconClass,
} from '../style/toolbar';

import { Props } from './panel';

export interface State {
  label: string;
  style: ReturnType<typeof style>;
  options?: any;
}

export class ToolbarButton extends React.Component<Props, State> {
  constructor(
    props: Props,
    init_label: string,
    init_style: ReturnType<typeof style>,
    init_options?: any,
  ) {
    super(props);
    this.state = {
      label: init_label,
      style: init_style,
      options: init_options ? init_options : undefined,
    };
  }

  render(): React.ReactElement {
    return (
      <div
        className={classes(
          'jp-ToolbarButton',
          'jp-Toolbar-item',
          toolbarItemClass
        )}
      >
        <button
          className={classes(
            'bp3-button',
            'bp3-minimal',
            'jp-ToolbarButtonComponent',
            'minimal',
            'jp-Button',
            toolbarButtonClass
          )}
          title={this.state.label}
          onClick={this._onClick}
        >
          <span className={classes('bp3-button-text')}>
            <span
              className={classes(
                'jp-ToolbarButtonComponent-icon',
                toolbarButtonIconClass,
                this.state.style
              )}
            >
              {' '}
            </span>
          </span>
        </button>
      </div>
    );
  }

  protected _onClick = (): void => {
    return;
  };
}
