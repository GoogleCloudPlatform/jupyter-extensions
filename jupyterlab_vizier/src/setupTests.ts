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

import * as Enzyme from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
// Removes canvas mock not found error
import 'jest-canvas-mock';
// Add react-testing-library custom matchers
import '@testing-library/jest-dom';

Enzyme.configure({
  adapter: new Adapter(),
});

// TODO: remove when jupyterlab updates react version to 16.9.0
// Removes invalid react-dom version warning from 'react-testing-library'
const originalError = global.console.error;
beforeAll(() => {
  global.console.error = jest.fn((...args) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Please upgrade to at least react-dom@16.9.0')
    ) {
      return;
    }
    return originalError(...args);
  });

  // https://github.com/mui-org/material-ui/issues/15726#issuecomment-493124813
  // TODO: remove upgrading to jest v26
  global.document.createRange = () => ({
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    setStart: () => {},
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    setEnd: () => {},
    // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
    // @ts-ignore
    commonAncestorContainer: {
      nodeName: 'BODY',
      ownerDocument: document,
    },
  });
});

afterAll(() => {
  (global.console.error as jest.Mock).mockRestore();
});
