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

import { shallow } from 'enzyme';
import * as React from 'react';

import { getProjectState } from '../../test_helpers';
import { ServiceStatuses } from './service_statuses';

describe('ServiceStatuses', () => {
  it('Renders with all disabled', () => {
    const serviceStatuses = getProjectState().serviceStatuses;
    const props = {
      serviceStatuses,
      isActivating: false,
    };
    const component = shallow(<ServiceStatuses {...props} />);
    expect(component).toMatchSnapshot();
  });

  it('Renders with all enabled', () => {
    const serviceStatuses = getProjectState().serviceStatuses;
    serviceStatuses.forEach(s => (s.enabled = true));
    const props = {
      serviceStatuses,
      isActivating: false,
    };
    const component = shallow(<ServiceStatuses {...props} />);
    expect(component).toMatchSnapshot();
  });

  it('Renders with error', () => {
    const serviceStatuses = getProjectState().serviceStatuses;
    const props = {
      serviceStatuses,
      isActivating: false,
      activationError: 'Unable to activate services',
    };
    const component = shallow(<ServiceStatuses {...props} />);
    expect(component).toMatchSnapshot();
  });

  it('Renders with pending activation', () => {
    const serviceStatuses = getProjectState().serviceStatuses;
    const props = {
      serviceStatuses,
      isActivating: true,
    };
    const component = shallow(<ServiceStatuses {...props} />);
    expect(component).toMatchSnapshot();
  });
});
