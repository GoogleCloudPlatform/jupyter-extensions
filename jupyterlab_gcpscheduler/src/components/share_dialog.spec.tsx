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

/* eslint-disable @typescript-eslint/no-unused-vars */
import { shallow } from 'enzyme';
import * as React from 'react';
import { ShareDialog } from './share_dialog';

Object.assign(navigator, {
  clipboard: {
    writeText: jest.fn(),
  },
});

describe('ShareDialog', () => {
  const mockOnHandleClose = jest.fn();
  jest.spyOn(navigator.clipboard, 'writeText');
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('Renders closed', () => {
    const component = shallow(
      <ShareDialog
        cloudBucket="http://storage.bucket"
        shareLink="http://share.link"
        handleClose={mockOnHandleClose}
      />
    );
    expect(component).toMatchSnapshot();
    expect(component.state('openDialog')).toBe(false);
  });

  it('Renders open', () => {
    const component = shallow(
      <ShareDialog
        cloudBucket="http://storage.bucket"
        shareLink="http://share.link"
        handleClose={mockOnHandleClose}
      />
    );
    component.find('p').simulate('click');
    expect(component).toMatchSnapshot();
    expect(component.state('openDialog')).toBe(true);
  });

  it('Handles copy', () => {
    const component = shallow(
      <ShareDialog
        cloudBucket="http://storage.bucket"
        shareLink="http://share.link"
        handleClose={mockOnHandleClose}
      />
    );
    component.find('p').simulate('click');
    component
      .find('WithStyles(ForwardRef(Button))')
      .at(1)
      .simulate('click');
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      'http://share.link'
    );
    expect(component.state('openSnackbar')).toBe(true);
  });

  it('Handles cancel', () => {
    const component = shallow(
      <ShareDialog
        cloudBucket="http://storage.bucket"
        shareLink="http://share.link"
        handleClose={mockOnHandleClose}
      />
    );
    component.find('p').simulate('click');
    component
      .find('WithStyles(ForwardRef(Button))')
      .at(0)
      .simulate('click');
    expect(component.state('openSnackbar')).toBe(false);
    expect(component.state('openDialog')).toBe(false);
    expect(mockOnHandleClose).toHaveBeenCalled();
  });
});
