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

import { Menu, MenuItem, IconButton } from '@material-ui/core';
import { shallow } from 'enzyme';
import * as React from 'react';

import { IconButtonMenu, MenuCloseHandler } from './icon_button_menu';
import { Add } from '@material-ui/icons';

describe('IconButtonMenu', () => {
  const menuItemsProp = (closeHandler: MenuCloseHandler) => (
    <React.Fragment>
      <MenuItem onClick={closeHandler}>Item 1</MenuItem>
      <MenuItem onClick={closeHandler}>Item 2</MenuItem>
      <MenuItem onClick={closeHandler}>Item 3</MenuItem>
    </React.Fragment>
  );

  it('Renders menu items', () => {
    const iconButtonMenu = shallow(
      <IconButtonMenu menuItems={menuItemsProp} />
    );

    expect(iconButtonMenu).toMatchSnapshot();
  });

  it('Renders with provided icon', () => {
    const iconButtonMenu = shallow(
      <IconButtonMenu menuItems={menuItemsProp} icon={<Add />} />
    );

    expect(iconButtonMenu).toMatchSnapshot();
  });

  it('Opens from icon button and closes when an item is clicked', () => {
    const iconButtonMenu = shallow(
      <IconButtonMenu menuItems={menuItemsProp} />
    );
    expect(iconButtonMenu.find(Menu).prop('open')).toBe(false);

    const openMenuButton = iconButtonMenu.find(IconButton);
    openMenuButton.simulate('click', {
      currentTarget: openMenuButton.getElement(),
    });

    expect(iconButtonMenu.find(Menu).prop('open')).toBe(true);
    const menuItems = iconButtonMenu.find(MenuItem);
    expect(menuItems.length).toBe(3);
    menuItems.first().simulate('click');
    expect(iconButtonMenu.find(Menu).prop('open')).toBe(false);
  });
});
