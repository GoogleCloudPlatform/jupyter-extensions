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

/* eslint-disable @typescript-eslint/no-empty-function */

import * as React from 'react';
import { shallow } from 'enzyme';
import { HardwareScalingStatus, Status } from './hardware_scaling_status';
import { DETAILS_RESPONSE } from '../test_helpers';
import { NotebooksService, Instance } from '../service/notebooks_service';
import { ServerWrapper } from './server_wrapper';
import { detailsToHardwareConfiguration } from '../data/data';
import { MachineTypeConfiguration } from '../data/machine_types';

function immediatePromise() {
  return new Promise(r => setTimeout(r));
}

describe('HardwareScalingStatus', () => {
  const mockGetUtilizationData = jest.fn();
  const mockStopInstance = jest.fn();
  const mockSetMachineType = jest.fn();
  const mockSetAccelerator = jest.fn();
  const mockStartInstance = jest.fn();
  const mockAuthTokenRetrieval = jest.fn();
  const mockSetAuthToken = jest.fn();
  const mockOnComplete = jest.fn();
  const mockOnDialogClose = jest.fn();
  const mockHasAuthToken = jest.fn();
  const mockServerWrapper = ({
    getUtilizationData: mockGetUtilizationData,
  } as unknown) as ServerWrapper;
  const mockNotebookService = ({
    hasAuthToken: mockHasAuthToken,
    stop: mockStopInstance,
    setMachineType: mockSetMachineType,
    setAccelerator: mockSetAccelerator,
    start: mockStartInstance,
    setAuthToken: mockSetAuthToken,
  } as unknown) as NotebooksService;
  const mockInstance: Instance = {
    name: 'Test',
    machineType:
      'https://www.googleapis.com/compute/v1/projects/jupyterlab-interns-sandbox/zones/us-west1-b/machineTypes/e2-highmem-8',
    acceleratorConfig: {
      coreCount: '1',
      type: 'NVIDIA_TESLA_K80',
    },
  };
  const mockToken = 'mockToken';
  const mockMachineTypes: MachineTypeConfiguration[] = [
    {
      base: { value: 'e2-', text: 'Efficient Instance' },
      configurations: [
        {
          value: 'e2-highmem-8',
          text: 'Efficient Instance, 8 vCPUs, 64 GB RAM',
        },
      ],
    },
  ];
  beforeEach(() => {
    jest.resetAllMocks();
    mockAuthTokenRetrieval.mockReturnValue(false);
  });

  it('Runs through reshaping flow', async () => {
    mockAuthTokenRetrieval.mockResolvedValue(mockToken);
    mockStopInstance.mockResolvedValue(mockInstance);
    mockSetMachineType.mockResolvedValue(mockInstance);
    mockSetAccelerator.mockResolvedValue(mockInstance);
    mockStartInstance.mockResolvedValue(mockInstance);
    const detailsResponse = await JSON.parse(DETAILS_RESPONSE);
    const resolveValue = Promise.resolve({ ...detailsResponse });
    mockGetUtilizationData.mockReturnValue(resolveValue);
    const hardwareConfig = detailsToHardwareConfiguration(detailsResponse);
    const hardwareScalingStatus = shallow(
      <HardwareScalingStatus
        detailsServer={mockServerWrapper}
        notebookService={mockNotebookService}
        onCompletion={mockOnComplete}
        onDialogClose={mockOnDialogClose}
        hardwareConfiguration={hardwareConfig}
        authTokenRetrieval={mockAuthTokenRetrieval}
        machineTypes={mockMachineTypes}
      />
    );
    expect(hardwareScalingStatus.state('status')).toEqual(Status.Authorizing);
    expect(hardwareScalingStatus).toMatchSnapshot('Authorizing');
    expect(mockAuthTokenRetrieval).toBeCalled();
    await mockAuthTokenRetrieval();
    expect(mockNotebookService.setAuthToken).toHaveBeenCalledWith(mockToken);
    expect(hardwareScalingStatus.state('status')).toEqual(
      Status['Stopping notebook instance']
    );
    expect(hardwareScalingStatus).toMatchSnapshot('Stopping notebook instance');
    expect(mockNotebookService.stop).toBeCalled();
    await mockStopInstance();
    expect(hardwareScalingStatus.state('status')).toEqual(
      Status['Updating machine configuration']
    );
    expect(hardwareScalingStatus).toMatchSnapshot(
      'Updating machine configuration'
    );
    expect(mockNotebookService.setMachineType).toBeCalled();
    await mockSetMachineType();
    expect(hardwareScalingStatus.state('status')).toEqual(
      Status['Updating GPU configuration']
    );
    expect(hardwareScalingStatus).toMatchSnapshot('Updating GPU configuration');
    expect(mockNotebookService.setAccelerator).toBeCalled();
    await mockSetAccelerator();
    expect(hardwareScalingStatus.state('status')).toEqual(
      Status['Restarting notebook instance']
    );
    expect(hardwareScalingStatus).toMatchSnapshot(
      'Restarting notebook instance'
    );
    expect(mockNotebookService.start).toBeCalled();
    await mockStartInstance();
    expect(hardwareScalingStatus.state('status')).toEqual(
      Status['Refreshing session']
    );
    expect(hardwareScalingStatus).toMatchSnapshot('Refreshing session');
    await mockGetUtilizationData();
    await immediatePromise();
    expect(mockOnComplete).toBeCalled();
    expect(hardwareScalingStatus.state('status')).toEqual(Status.Complete);
    expect(hardwareScalingStatus).toMatchSnapshot('Complete');
  });

  it('Renders with auth error', async () => {
    const rejectedAuth = Promise.reject('No token');
    mockAuthTokenRetrieval.mockReturnValue(rejectedAuth);
    const detailsResponse = JSON.parse(DETAILS_RESPONSE);
    const hardwareConfig = detailsToHardwareConfiguration(detailsResponse);
    const hardwareScalingStatus = shallow(
      <HardwareScalingStatus
        detailsServer={mockServerWrapper}
        notebookService={mockNotebookService}
        onCompletion={mockOnComplete}
        onDialogClose={mockOnDialogClose}
        hardwareConfiguration={hardwareConfig}
        authTokenRetrieval={mockAuthTokenRetrieval}
        machineTypes={mockMachineTypes}
      />
    );
    await rejectedAuth.catch(() => {});
    expect(hardwareScalingStatus.state('status')).toEqual(Status.Error);
    expect(hardwareScalingStatus).toMatchSnapshot('Auth Error');
  });

  it('Renders with stop error', async () => {
    mockAuthTokenRetrieval.mockResolvedValue(mockToken);
    const rejectedStopOperation = Promise.reject('Stop operation failed');
    mockStopInstance.mockReturnValue(rejectedStopOperation);
    const detailsResponse = JSON.parse(DETAILS_RESPONSE);
    const hardwareConfig = detailsToHardwareConfiguration(detailsResponse);
    const hardwareScalingStatus = shallow(
      <HardwareScalingStatus
        detailsServer={mockServerWrapper}
        notebookService={mockNotebookService}
        onCompletion={mockOnComplete}
        onDialogClose={mockOnDialogClose}
        hardwareConfiguration={hardwareConfig}
        authTokenRetrieval={mockAuthTokenRetrieval}
        machineTypes={mockMachineTypes}
      />
    );
    await mockAuthTokenRetrieval();
    await rejectedStopOperation.catch(() => {});
    expect(hardwareScalingStatus.state('status')).toEqual(Status.Error);
    expect(hardwareScalingStatus).toMatchSnapshot('Stop instance error');
  });

  it('Renders with operation error', async () => {
    const mockGetUtilizationData = jest.fn();
    const mockStopInstance = jest.fn();
    const rejectedSetMachine = Promise.reject('Reshape operation failed');
    const rejectedSetAccelerator = Promise.reject('Reshape operation failed');
    mockSetMachineType.mockReturnValue(rejectedSetMachine);
    mockSetAccelerator.mockReturnValue(rejectedSetAccelerator);
    mockStartInstance.mockResolvedValue(mockInstance);
    const detailsResponse = JSON.parse(DETAILS_RESPONSE);
    const resolveValue = Promise.resolve({ ...detailsResponse });
    mockGetUtilizationData.mockReturnValue(resolveValue);
    const hardwareConfig = detailsToHardwareConfiguration(detailsResponse);
    const hardwareScalingStatus = shallow(
      <HardwareScalingStatus
        detailsServer={mockServerWrapper}
        notebookService={mockNotebookService}
        onCompletion={mockOnComplete}
        onDialogClose={mockOnDialogClose}
        hardwareConfiguration={hardwareConfig}
        authTokenRetrieval={mockAuthTokenRetrieval}
        machineTypes={mockMachineTypes}
      />
    );
    await mockAuthTokenRetrieval();
    await mockStopInstance();
    await rejectedSetMachine.catch(() => {});
    await rejectedSetAccelerator.catch(() => {});
    await mockStartInstance();
    await immediatePromise();
    expect(hardwareScalingStatus.state('status')).toEqual(Status.Error);
    expect(hardwareScalingStatus).toMatchSnapshot('Operation error');
  });

  it('Renders with restart error', async () => {
    const mockGetUtilizationData = jest.fn();
    const mockStopInstance = jest.fn();
    const rejectedSetMachine = Promise.reject('Reshape operation failed');
    const rejectedSetAccelerator = Promise.reject('Reshape operation failed');
    const rejectedStartOperation = Promise.reject('Restart operation failed');
    mockSetMachineType.mockReturnValue(rejectedSetMachine);
    mockSetAccelerator.mockReturnValue(rejectedSetAccelerator);
    mockStartInstance.mockRejectedValue(rejectedStartOperation);
    const detailsResponse = JSON.parse(DETAILS_RESPONSE);
    const resolveValue = Promise.resolve({ ...detailsResponse });
    mockGetUtilizationData.mockReturnValue(resolveValue);
    const hardwareConfig = detailsToHardwareConfiguration(detailsResponse);
    const hardwareScalingStatus = shallow(
      <HardwareScalingStatus
        detailsServer={mockServerWrapper}
        notebookService={mockNotebookService}
        onCompletion={mockOnComplete}
        onDialogClose={mockOnDialogClose}
        hardwareConfiguration={hardwareConfig}
        authTokenRetrieval={mockAuthTokenRetrieval}
        machineTypes={mockMachineTypes}
      />
    );
    await mockAuthTokenRetrieval();
    await mockStopInstance();
    await rejectedSetMachine.catch(() => {});
    await rejectedSetAccelerator.catch(() => {});
    await rejectedStartOperation.catch(() => {});
    expect(hardwareScalingStatus.state('status')).toEqual(Status.Error);
    expect(hardwareScalingStatus).toMatchSnapshot('Restart error');
  });

  it('Bypasses external retrieval if Notebooks service has token', async () => {
    const hardwareConfig = detailsToHardwareConfiguration(
      JSON.parse(DETAILS_RESPONSE)
    );
    mockHasAuthToken.mockReturnValue(true);
    const hardwareScalingStatus = shallow(
      <HardwareScalingStatus
        detailsServer={mockServerWrapper}
        notebookService={mockNotebookService}
        onCompletion={mockOnComplete}
        onDialogClose={mockOnDialogClose}
        hardwareConfiguration={hardwareConfig}
        authTokenRetrieval={mockAuthTokenRetrieval}
        machineTypes={mockMachineTypes}
      />
    );
    expect(hardwareScalingStatus).toBeDefined();
    expect(mockAuthTokenRetrieval).not.toBeCalled();
  });
});
