import { shallow } from 'enzyme';
import * as React from 'react';
import { HardwareScalingStatus, Status } from './hardware_scaling_status';
import { DETAILS_RESPONSE } from '../test_helpers';
import { NotebooksService, Instance } from '../service/notebooks_service';
import { ServerWrapper } from './server_wrapper';
import { detailsToHardwareConfiguration } from '../data';
import Button from '@material-ui/core/Button';

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
  const mockServerWrapper = ({
    getUtilizationData: mockGetUtilizationData,
  } as unknown) as ServerWrapper;
  const mockNotebookService = ({
    stop: mockStopInstance,
    setMachineType: mockSetMachineType,
    setAccelerator: mockSetAccelerator,
    start: mockStartInstance,
    setAuthToken: mockSetAuthToken,
  } as unknown) as NotebooksService;
  const mockInstance: Instance = {
    name: 'Test',
  };
  const mockToken = 'mockToken';
  beforeEach(() => {
    jest.resetAllMocks();
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
      />
    );
    expect(hardwareScalingStatus.state('status')).toEqual(Status.Authorizing);
    expect(hardwareScalingStatus).toMatchSnapshot('Authorizing');
    expect(mockAuthTokenRetrieval).toBeCalled();
    await mockAuthTokenRetrieval();
    expect(mockNotebookService.setAuthToken).toHaveBeenCalledWith(mockToken);
    expect(hardwareScalingStatus.state('status')).toEqual(
      Status['Stopping Instance']
    );
    expect(hardwareScalingStatus).toMatchSnapshot('Stopping Instance');
    expect(mockNotebookService.stop).toBeCalled();
    await mockStopInstance();
    expect(hardwareScalingStatus.state('status')).toEqual(
      Status['Updating Machine Configuration']
    );
    expect(hardwareScalingStatus).toMatchSnapshot(
      'Updating Machine Configuration'
    );
    expect(mockNotebookService.setMachineType).toBeCalled();
    await mockSetMachineType();
    expect(hardwareScalingStatus.state('status')).toEqual(
      Status['Updating GPU Configuration']
    );
    expect(hardwareScalingStatus).toMatchSnapshot('Updating GPU Configuration');
    expect(mockNotebookService.setAccelerator).toBeCalled();
    await mockSetAccelerator();
    expect(hardwareScalingStatus.state('status')).toEqual(
      Status['Starting Instance']
    );
    expect(hardwareScalingStatus).toMatchSnapshot('Starting Instance');
    expect(mockNotebookService.start).toBeCalled();
    await mockStartInstance();
    expect(hardwareScalingStatus.state('status')).toEqual(
      Status['Refreshing Session']
    );
    expect(hardwareScalingStatus).toMatchSnapshot('Refreshing Session');
    await mockGetUtilizationData();
    setTimeout(() => {
      expect(mockOnComplete).toBeCalled();
      expect(hardwareScalingStatus.state('status')).toEqual(Status.Complete);
      expect(hardwareScalingStatus).toMatchSnapshot('Complete');
      hardwareScalingStatus
        .find(Button)
        .first()
        .simulate('click');
      expect(mockOnDialogClose).toBeCalled();
    }, 1000);
  });

  it('Renders with auth error', async () => {
    mockAuthTokenRetrieval.mockImplementation(() => {
      throw new Error();
    });
    const detailsResponse = await JSON.parse(DETAILS_RESPONSE);
    const hardwareConfig = detailsToHardwareConfiguration(detailsResponse);
    const hardwareScalingStatus = shallow(
      <HardwareScalingStatus
        detailsServer={mockServerWrapper}
        notebookService={mockNotebookService}
        onCompletion={mockOnComplete}
        onDialogClose={mockOnDialogClose}
        hardwareConfiguration={hardwareConfig}
        authTokenRetrieval={mockAuthTokenRetrieval}
      />
    );
    expect(hardwareScalingStatus.state('status')).toEqual(Status.Error);
    expect(hardwareScalingStatus).toMatchSnapshot('Auth Error');
  });

  it('Renders with stop error', async () => {
    mockAuthTokenRetrieval.mockResolvedValue(mockToken);
    mockStopInstance.mockImplementation(() => {
      throw new Error();
    });
    const detailsResponse = await JSON.parse(DETAILS_RESPONSE);
    const hardwareConfig = detailsToHardwareConfiguration(detailsResponse);
    const hardwareScalingStatus = shallow(
      <HardwareScalingStatus
        detailsServer={mockServerWrapper}
        notebookService={mockNotebookService}
        onCompletion={mockOnComplete}
        onDialogClose={mockOnDialogClose}
        hardwareConfiguration={hardwareConfig}
        authTokenRetrieval={mockAuthTokenRetrieval}
      />
    );
    await mockAuthTokenRetrieval();
    expect(hardwareScalingStatus.state('status')).toEqual(Status.Error);
    expect(hardwareScalingStatus).toMatchSnapshot('Stop instance error');
  });

  it('Renders with operation error', async () => {
    const mockGetUtilizationData = jest.fn();
    const mockStopInstance = jest.fn();
    mockSetMachineType.mockImplementation(() => {
      throw new Error();
    });
    mockSetAccelerator.mockImplementation(() => {
      throw new Error();
    });
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
      />
    );
    await mockAuthTokenRetrieval();
    await mockStopInstance();
    await mockStartInstance();
    await mockGetUtilizationData();
    setTimeout(() => {
      expect(hardwareScalingStatus.state('status')).toEqual(Status.Error);
      expect(hardwareScalingStatus).toMatchSnapshot('Operation error');
      hardwareScalingStatus
        .find(Button)
        .first()
        .simulate('click');
      expect(mockOnDialogClose).toBeCalled();
    }, 1000);
  });

  it('Renders with restart error', async () => {
    const mockGetUtilizationData = jest.fn();
    const mockStopInstance = jest.fn();
    mockSetMachineType.mockImplementation(() => {
      throw new Error();
    });
    mockSetAccelerator.mockImplementation(() => {
      throw new Error();
    });
    mockStartInstance.mockImplementation(() => {
      throw new Error();
    });
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
      />
    );
    await mockAuthTokenRetrieval();
    await mockStopInstance();
    expect(hardwareScalingStatus.state('status')).toEqual(Status.Error);
    expect(hardwareScalingStatus).toMatchSnapshot('Restart error');
  });
});
