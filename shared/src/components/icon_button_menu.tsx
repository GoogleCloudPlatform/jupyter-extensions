/**
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import * as React from 'react';
import { withStyles, IconButton, Menu, MenuItem } from '@material-ui/core';
import { MoreVert } from '@material-ui/icons';

export type MenuCloseHandler = () => void;

interface Props {
  menuItems: (closeHandler: MenuCloseHandler) => React.ReactNode;
  icon?: React.ReactNode;
}

interface State {
  anchorEl: null | HTMLElement;
}

/** Menu item with smaller padding and fontSize */
export const SmallMenuItem = withStyles({
  root: {
    fontSize: '13px',
    padding: '4px',
  },
})(MenuItem);

/** Component for rendering a menu triggered by an icon button. */
export class IconButtonMenu extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { anchorEl: null };
    this._onMenuClose = this._onMenuClose.bind(this);
  }

  render() {
    const { icon, menuItems } = this.props;
    const { anchorEl } = this.state;
    const iconElement = icon || <MoreVert />;
    return (
      <span>
        <IconButton onClick={e => this._onOpenMenu(e)}>
          {iconElement}
        </IconButton>
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          keepMounted
          onClose={this._onMenuClose}
        >
          {menuItems(this._onMenuClose)}
        </Menu>
      </span>
    );
  }

  private _onOpenMenu(event: React.MouseEvent<HTMLButtonElement>) {
    this.setState({ anchorEl: event.currentTarget });
  }

  private _onMenuClose() {
    this.setState({ anchorEl: null });
  }
}
