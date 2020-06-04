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

import { ProjectState } from '../../service/project_state';
import { getProjectState } from '../../test_helpers';
import { ResourceStatuses } from './resource_statuses';

describe('ResourceStatuses', () => {
  it('Renders needing both resources', () => {
    const projectState = getProjectState();
    const props = {
      projectState,
      showCloudFunction: true,
      isCreatingBucket: false,
      isDeployingFunction: false,
    };
    const component = shallow(<ResourceStatuses {...props} />);
    expect(component).toMatchSnapshot();
  });

  it('Renders with GCS bucket only', () => {
    const projectState = getProjectState();
    const props = {
      projectState,
      showCloudFunction: false,
      isCreatingBucket: false,
      isDeployingFunction: false,
    };
    const component = shallow(<ResourceStatuses {...props} />);
    expect(component).toMatchSnapshot();
  });

  it('Renders with both resources', () => {
    const projectState: ProjectState = {
      ...getProjectState(),
      hasGcsBucket: true,
      hasCloudFunction: true,
    };
    const props = {
      projectState,
      showCloudFunction: true,
      isCreatingBucket: false,
      isDeployingFunction: false,
    };
    const component = shallow(<ResourceStatuses {...props} />);
    expect(component).toMatchSnapshot();
  });

  it('Renders with errors', () => {
    const projectState = getProjectState();
    const props = {
      projectState,
      showCloudFunction: true,
      isCreatingBucket: false,
      bucketCreationError: 'Unable to create bucket',
      isDeployingFunction: false,
      functionDeploymentError: 'Unable to deploy function',
    };
    const component = shallow(<ResourceStatuses {...props} />);
    expect(component).toMatchSnapshot();
  });

  it('Renders with pending operations', () => {
    const projectState = getProjectState();
    const props = {
      projectState,
      showCloudFunction: true,
      isCreatingBucket: true,
      isDeployingFunction: true,
    };
    const component = shallow(<ResourceStatuses {...props} />);
    expect(component).toMatchSnapshot();
  });
});
