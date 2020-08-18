import { shallow } from 'enzyme';
import * as React from 'react';
import { HardwareScalingStatus } from './hardware_scaling_status';
import { DETAILS_RESPONSE } from '../test_helpers';
import { NotebooksService } from '../service/notebooks_service';
import { ServerWrapper } from './server_wrapper';
import { HardwareConfiguration } from '../data';

describe('HardwareScalingStatus', () => {
  const mockGetUtilizationData = jest.fn();
  const mockStopInstance = jest.fn();
  const mockSetMachineType = jest.fn();
  const mockSetAccelerator = jest.fn();
  const mockStartInstance = jest.fn();
  const mockServerWrapper = ({
    getUtilizationData: mockGetUtilizationData,
  } as unknown) as ServerWrapper;
  const mockNotebookService = ({
    stop: mockStopInstance,
    setMachineType: mockSetMachineType,
    setAccelerator: mockSetAccelerator,
    start: mockStartInstance,
  } as unknown) as NotebooksService;

  beforeEach(() => {
    jest.resetAllMocks();
    jest.useFakeTimers();
  });

  it('Renders with details', async () => {
    const detailsResponse = JSON.parse(DETAILS_RESPONSE) as HardwareConfiguration;
    const resolveValue = Promise.resolve({ ...detailsResponse });
    mockGetUtilizationData.mockReturnValue(resolveValue);
    const hardwareScalingStatus = shallow(
      <HardwareScalingStatus
        detailsServer={mockServerWrapper}
        notebookService={mockNotebookService}
        onCompletion={()=>{}}
        onDialogClose{()=>{}}
        hardwareConfiguration={detailsResponse}
      />
    );
  });
});
