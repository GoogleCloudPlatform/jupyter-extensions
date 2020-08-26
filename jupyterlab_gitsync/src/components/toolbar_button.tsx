import * as React from 'react';
import { classes } from 'typestyle';
import {
  toolbarItemClass,
  toolbarButtonClass,
  toolbarButtonIconClass,
} from '../style/toolbar';

import { Props } from './panel';

interface ToolbarButtonProps extends Props {
  title: string;
  style: string;
  onClick: () => void;
}

export class ToolbarButton extends React.Component<ToolbarButtonProps, {}> {
  render(): React.ReactElement {
    const { title, style, onClick } = this.props;
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
          title={title}
          onClick={onClick}
        >
          <span className={classes('bp3-button-text')}>
            <span
              className={classes(
                'jp-ToolbarButtonComponent-icon',
                toolbarButtonIconClass,
                style
              )}
            ></span>
          </span>
        </button>
      </div>
    );
  }
}
