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
import { DETAILS_RESPONSE, flush, MACHINE_TYPES } from '../test_helpers';
import { HardwareService } from '../service/hardware_service';
import { NotebooksService, Instance } from '../service/notebooks_service';
import { detailsToHardwareConfiguration } from '../data/data';

describe('HardwareScalingStatus', () => {
  const detailsResponse = JSON.parse(DETAILS_RESPONSE);
  const hardwareConfig = detailsToHardwareConfiguration(detailsResponse);
  const mockStopInstance = jest.fn();
  const mockSetMachineType = jest.fn();
  const mockSetAccelerator = jest.fn();
  const mockStartInstance = jest.fn();
  const mockAuthTokenRetrieval = jest.fn();
  const mockSetAuthToken = jest.fn();
  const mockOnComplete = jest.fn();
  const mockOnDialogClose = jest.fn();
  const mockHasAuthToken = jest.fn();
  const mockGetDetails = jest.fn();
  const mockHardwareService = ({
    getVmDetails: mockGetDetails,
  } as unknown) as HardwareService;
  const mockNotebookService = ({
    hasAuthToken: mockHasAuthToken,
    stop: mockStopInstance,
    setMachineType: mockSetMachineType,
    setAccelerator: mockSetAccelerator,
    start: mockStartInstance,
    setAuthToken: mockSetAuthToken,
  } as unknown) as NotebooksService;
  const fakeInstance: Instance = {
    name: 'Test',
    machineType:
      'https://www.googleapis.com/compute/v1/projects/jupyterlab-interns-sandbox/zones/us-west1-b/machineTypes/n2-standard-4',
    acceleratorConfig: {
      coreCount: '1',
      type: 'NVIDIA_TESLA_K80',
    },
  };
  const fakeToken = 'mockToken';
  beforeEach(() => {
    jest.resetAllMocks();
    mockAuthTokenRetrieval.mockReturnValue(false);
    mockGetDetails.mockReturnValue(Promise.resolve(detailsResponse));
  });

  it('Runs through reshaping flow', async () => {
    mockAuthTokenRetrieval.mockResolvedValue(fakeToken);
    mockStopInstance.mockResolvedValue(fakeInstance);
    mockSetMachineType.mockResolvedValue(fakeInstance);
    mockSetAccelerator.mockResolvedValue(fakeInstance);
    mockStartInstance.mockResolvedValue(fakeInstance);
    const hardwareScalingStatus = shallow(
      <HardwareScalingStatus
        hardwareService={mockHardwareService}
        notebookService={mockNotebookService}
        onCompletion={mockOnComplete}
        onDialogClose={mockOnDialogClose}
        hardwareConfiguration={hardwareConfig}
        authTokenRetrieval={mockAuthTokenRetrieval}
        machineTypes={MACHINE_TYPES}
      />
    );
    expect(hardwareScalingStatus.state('status')).toEqual(Status.Authorizing);
    expect(hardwareScalingStatus).toMatchSnapshot('Authorizing');
    expect(mockAuthTokenRetrieval).toBeCalled();
    await mockAuthTokenRetrieval();
    expect(mockNotebookService.setAuthToken).toHaveBeenCalledWith(fakeToken);
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
    await flush();
    expect(mockOnComplete).toBeCalled();
    expect(hardwareScalingStatus.state('status')).toEqual(Status.Complete);
    expect(hardwareScalingStatus).toMatchSnapshot('Complete');
  });

  it('Renders with auth error', async () => {
    const rejectedAuth = Promise.reject('No token');
    mockAuthTokenRetrieval.mockReturnValue(rejectedAuth);
    const hardwareScalingStatus = shallow(
      <HardwareScalingStatus
        hardwareService={mockHardwareService}
        notebookService={mockNotebookService}
        onCompletion={mockOnComplete}
        onDialogClose={mockOnDialogClose}
        hardwareConfiguration={hardwareConfig}
        authTokenRetrieval={mockAuthTokenRetrieval}
        machineTypes={MACHINE_TYPES}
      />
    );
    await rejectedAuth.catch(() => {});
    expect(hardwareScalingStatus.state('status')).toEqual(Status.Error);
    expect(hardwareScalingStatus).toMatchSnapshot('Auth Error');
  });

  it('Renders with stop error', async () => {
    mockAuthTokenRetrieval.mockResolvedValue(fakeToken);
    const rejectedStopOperation = Promise.reject('Stop operation failed');
    mockStopInstance.mockReturnValue(rejectedStopOperation);
    const hardwareScalingStatus = shallow(
      <HardwareScalingStatus
        hardwareService={mockHardwareService}
        notebookService={mockNotebookService}
        onCompletion={mockOnComplete}
        onDialogClose={mockOnDialogClose}
        hardwareConfiguration={hardwareConfig}
        authTokenRetrieval={mockAuthTokenRetrieval}
        machineTypes={MACHINE_TYPES}
      />
    );
    await mockAuthTokenRetrieval();
    await rejectedStopOperation.catch(() => {});
    expect(hardwareScalingStatus.state('status')).toEqual(Status.Error);
    expect(hardwareScalingStatus).toMatchSnapshot('Stop instance error');
  });

  it('Renders with operation error', async () => {
    const rejectedSetMachine = Promise.reject('Reshape operation failed');
    const rejectedSetAccelerator = Promise.reject('Reshape operation failed');
    mockSetMachineType.mockReturnValue(rejectedSetMachine);
    mockSetAccelerator.mockReturnValue(rejectedSetAccelerator);
    mockStartInstance.mockResolvedValue(fakeInstance);
    const hardwareScalingStatus = shallow(
      <HardwareScalingStatus
        hardwareService={mockHardwareService}
        notebookService={mockNotebookService}
        onCompletion={mockOnComplete}
        onDialogClose={mockOnDialogClose}
        hardwareConfiguration={hardwareConfig}
        authTokenRetrieval={mockAuthTokenRetrieval}
        machineTypes={MACHINE_TYPES}
      />
    );
    await mockAuthTokenRetrieval();
    await mockStopInstance();
    await rejectedSetMachine.catch(() => {});
    await rejectedSetAccelerator.catch(() => {});
    await mockStartInstance();
    await flush();
    expect(hardwareScalingStatus.state('status')).toEqual(Status.Error);
    expect(hardwareScalingStatus).toMatchSnapshot('Operation error');
  });

  it('Renders with restart error', async () => {
    const rejectedSetMachine = Promise.reject('Reshape operation failed');
    const rejectedSetAccelerator = Promise.reject('Reshape operation failed');
    const rejectedStartOperation = Promise.reject('Restart operation failed');
    mockSetMachineType.mockReturnValue(rejectedSetMachine);
    mockSetAccelerator.mockReturnValue(rejectedSetAccelerator);
    mockStartInstance.mockRejectedValue(rejectedStartOperation);
    const hardwareScalingStatus = shallow(
      <HardwareScalingStatus
        hardwareService={mockHardwareService}
        notebookService={mockNotebookService}
        onCompletion={mockOnComplete}
        onDialogClose={mockOnDialogClose}
        hardwareConfiguration={hardwareConfig}
        authTokenRetrieval={mockAuthTokenRetrieval}
        machineTypes={MACHINE_TYPES}
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
    mockStopInstance.mockResolvedValue(fakeInstance);
    mockSetMachineType.mockResolvedValue(fakeInstance);
    mockSetAccelerator.mockResolvedValue(fakeInstance);
    mockStartInstance.mockResolvedValue(fakeInstance);
    mockHasAuthToken.mockReturnValue(true);
    const hardwareScalingStatus = shallow(
      <HardwareScalingStatus
        hardwareService={mockHardwareService}
        notebookService={mockNotebookService}
        onCompletion={mockOnComplete}
        onDialogClose={mockOnDialogClose}
        hardwareConfiguration={hardwareConfig}
        authTokenRetrieval={mockAuthTokenRetrieval}
        machineTypes={MACHINE_TYPES}
      />
    );
    expect(hardwareScalingStatus).toBeDefined();
    expect(mockAuthTokenRetrieval).not.toBeCalled();
  });
});
