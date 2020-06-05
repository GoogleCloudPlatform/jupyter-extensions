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
import { CheckboxInput, SubmitButton } from 'gcp-jupyterlab-shared';
import * as React from 'react';

import { ProjectState, ProjectStateService } from '../../service/project_state';
import { getProjectState } from '../../test_helpers';
import { Initializer } from './initializer';

describe('Initializer', () => {
  const mockGetProjectState = jest.fn();
  const mockCreateBucket = jest.fn();
  const mockEnableServices = jest.fn();
  const mockCreateCloudFunction = jest.fn();
  const mockDialogClose = jest.fn();
  const mockOnInitialized = jest.fn();
  const mockProjectStateService = ({
    createBucket: mockCreateBucket,
    createCloudFunction: mockCreateCloudFunction,
    enableServices: mockEnableServices,
    getProjectState: mockGetProjectState,
  } as undefined) as ProjectStateService;
  let mockProjectState: ProjectState;

  beforeEach(() => {
    jest.resetAllMocks();
    mockProjectState = getProjectState();
  });

  it('Renders with validating message', () => {
    const initializer = shallow(
      <Initializer
        projectStateService={mockProjectStateService}
        onDialogClose={mockDialogClose}
        onInitialized={mockOnInitialized}
      />
    );
    expect(initializer).toMatchSnapshot();
  });

  it('Renders with error if project state cannot be determined', async () => {
    const getStatePromise = Promise.reject('No project found');
    mockGetProjectState.mockReturnValue(getStatePromise);
    const initializer = shallow(
      <Initializer
        projectStateService={mockProjectStateService}
        onDialogClose={mockDialogClose}
        onInitialized={mockOnInitialized}
      />
    );

    await getStatePromise.catch(() => null);
    expect(initializer).toMatchSnapshot();
  });

  it('Renders with ready message', async () => {
    mockProjectState.schedulerRegion = 'us-central1';
    mockProjectState.canSubmitImmediateJobs = true;
    mockProjectState.canSubmitScheduledJobs = true;
    const getStatePromise = Promise.resolve(mockProjectState);
    mockGetProjectState.mockReturnValue(getStatePromise);
    const initializer = shallow(
      <Initializer
        projectStateService={mockProjectStateService}
        onDialogClose={mockDialogClose}
        onInitialized={mockOnInitialized}
      />
    );

    await getStatePromise.catch(() => null);
    expect(initializer).toMatchSnapshot();
    expect(mockOnInitialized).toHaveBeenCalled();
  });

  it('Renders with app engine content', async () => {
    mockProjectState.allServicesEnabled = true;
    mockProjectState.hasGcsBucket = true;
    mockProjectState.hasCloudFunction = true;
    const getStatePromise = Promise.resolve(mockProjectState);
    mockGetProjectState.mockReturnValue(getStatePromise);
    const initializer = shallow(
      <Initializer
        projectStateService={mockProjectStateService}
        onDialogClose={mockDialogClose}
        onInitialized={mockOnInitialized}
      />
    );

    await getStatePromise.catch(() => null);
    expect(initializer).toMatchSnapshot();

    // Simulate Check Again
    initializer.find(SubmitButton).simulate('click');
    expect(initializer).toMatchSnapshot('Rechecking');
    await getStatePromise.catch(() => null);
    expect(initializer).toMatchSnapshot('After recheck');
    expect(mockGetProjectState).toHaveBeenCalledTimes(2);
  });

  it('Renders with initialization content', async () => {
    const getStatePromise = Promise.resolve(mockProjectState);
    mockGetProjectState.mockReturnValue(getStatePromise);
    const initializer = shallow(
      <Initializer
        projectStateService={mockProjectStateService}
        onDialogClose={mockDialogClose}
        onInitialized={mockOnInitialized}
      />
    );

    await getStatePromise.catch(() => null);
    expect(initializer).toMatchSnapshot();
  });

  it('Renders with initialization content for immediate runs only', async () => {
    const getStatePromise = Promise.resolve(mockProjectState);
    mockGetProjectState.mockReturnValue(getStatePromise);
    const initializer = shallow(
      <Initializer
        projectStateService={mockProjectStateService}
        onDialogClose={mockDialogClose}
        onInitialized={mockOnInitialized}
      />
    );

    await getStatePromise.catch(() => null);
    initializer
      .find(CheckboxInput)
      .simulate('change', { target: { checked: false } });
    expect(initializer).toMatchSnapshot();
  });

  it('Runs initialization sequence', async () => {
    const getStatePromise = Promise.resolve(mockProjectState);
    const enabledServicesPromise = Promise.resolve(true);
    const createBucketPromise = Promise.resolve(true);
    const deployFunctionPromise = Promise.resolve(true);

    mockGetProjectState.mockReturnValueOnce(getStatePromise);
    mockEnableServices.mockReturnValue(enabledServicesPromise);
    mockCreateBucket.mockReturnValue(createBucketPromise);
    mockCreateCloudFunction.mockReturnValue(deployFunctionPromise);

    const initializer = shallow(
      <Initializer
        projectStateService={mockProjectStateService}
        onDialogClose={mockDialogClose}
        onInitialized={mockOnInitialized}
      />
    );

    await getStatePromise.catch(() => null);
    initializer.find(SubmitButton).simulate('click');
    expect(initializer.state('isActivatingServices')).toBe(true);
    await enabledServicesPromise.catch(() => null);
    expect(initializer.state('isActivatingServices')).toBe(false);
    expect(initializer.state('isCreatingBucket')).toBe(true);
    expect(initializer.state('isDeployingFunction')).toBe(true);

    await createBucketPromise.catch(() => null);
    await deployFunctionPromise.catch(() => null);
    expect(initializer.state('isCreatingBucket')).toBe(false);
    expect(initializer.state('isDeployingFunction')).toBe(false);
    expect(initializer).toMatchSnapshot('Shows AppEngine creator');

    expect(mockEnableServices).toHaveBeenCalledWith([
      'storage-api.googleapis.com',
      'ml.googleapis.com',
      'cloudscheduler.googleapis.com',
      'cloudfunctions.googleapis.com',
    ]);
    expect(mockCreateBucket).toHaveBeenCalled();
    expect(mockCreateCloudFunction).toHaveBeenCalled();
    // Gets called after all steps complete
    expect(mockGetProjectState).toHaveBeenCalledTimes(2);
  });

  it('Fails to enable services', async () => {
    const getStatePromise = Promise.resolve(mockProjectState);
    const enabledServicesPromise = Promise.reject('Could not enable services');
    const createBucketPromise = Promise.resolve(true);
    const deployFunctionPromise = Promise.resolve(true);

    mockGetProjectState.mockReturnValueOnce(getStatePromise);
    mockEnableServices.mockReturnValue(enabledServicesPromise);
    mockCreateBucket.mockReturnValue(createBucketPromise);
    mockCreateCloudFunction.mockReturnValue(deployFunctionPromise);

    const initializer = shallow(
      <Initializer
        projectStateService={mockProjectStateService}
        onDialogClose={mockDialogClose}
        onInitialized={mockOnInitialized}
      />
    );

    await getStatePromise.catch(() => null);
    initializer.find(SubmitButton).simulate('click');
    expect(initializer.state('isActivatingServices')).toBe(true);
    await enabledServicesPromise.catch(() => null);
    expect(initializer).toMatchSnapshot();
    expect(initializer.state('serviceActivationError')).toBe(
      'Could not enable services: Unable to enable necessary GCP APIs'
    );
    expect(initializer.state('isActivatingServices')).toBe(false);
    expect(initializer.state('isCreatingBucket')).toBe(false);
    expect(initializer.state('isDeployingFunction')).toBe(false);

    expect(mockEnableServices).toHaveBeenCalledWith([
      'storage-api.googleapis.com',
      'ml.googleapis.com',
      'cloudscheduler.googleapis.com',
      'cloudfunctions.googleapis.com',
    ]);
    expect(mockCreateBucket).not.toHaveBeenCalled();
    expect(mockCreateCloudFunction).not.toHaveBeenCalled();
  });

  it('Fails to create resource', async () => {
    const getStatePromise = Promise.resolve(mockProjectState);
    const enabledServicesPromise = Promise.resolve(true);
    const createBucketPromise = Promise.reject('Could not create bucket');
    const deployFunctionPromise = Promise.resolve(true);

    mockGetProjectState.mockReturnValueOnce(getStatePromise);
    mockEnableServices.mockReturnValue(enabledServicesPromise);
    mockCreateBucket.mockReturnValue(createBucketPromise);
    mockCreateCloudFunction.mockReturnValue(deployFunctionPromise);

    const initializer = shallow(
      <Initializer
        projectStateService={mockProjectStateService}
        onDialogClose={mockDialogClose}
        onInitialized={mockOnInitialized}
      />
    );

    await getStatePromise.catch(() => null);
    initializer.find(SubmitButton).simulate('click');
    expect(initializer.state('isActivatingServices')).toBe(true);
    await enabledServicesPromise.catch(() => null);
    expect(initializer.state('isActivatingServices')).toBe(false);
    expect(initializer.state('isCreatingBucket')).toBe(true);
    expect(initializer.state('isDeployingFunction')).toBe(true);
    await createBucketPromise.catch(() => null);
    await deployFunctionPromise.catch(() => null);
    expect(initializer).toMatchSnapshot();
    expect(initializer.state('bucketCreationError')).toBe(
      'Could not create bucket: Unable to create Cloud Storage bucket'
    );
    expect(initializer.state('isCreatingBucket')).toBe(false);
    expect(initializer.state('isDeployingFunction')).toBe(false);

    expect(mockEnableServices).toHaveBeenCalledWith([
      'storage-api.googleapis.com',
      'ml.googleapis.com',
      'cloudscheduler.googleapis.com',
      'cloudfunctions.googleapis.com',
    ]);
    expect(mockCreateBucket).toHaveBeenCalled();
    expect(mockCreateCloudFunction).toHaveBeenCalled();
    expect(mockGetProjectState).toHaveBeenCalledTimes(1);
  });
});
