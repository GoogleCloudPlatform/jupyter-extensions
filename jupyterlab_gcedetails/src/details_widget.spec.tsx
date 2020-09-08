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

jest.mock('@jupyterlab/apputils');

import * as React from 'react';
import { shallow } from 'enzyme';
import { VmDetails } from './details_widget';
import {
  DETAILS_RESPONSE,
  MACHINE_TYPES_RESPONSE,
  ACCELERATOR_TYPES_RESPONSE,
} from './test_helpers';
import { STYLES } from './data/styles';
import { HardwareConfigurationDialog } from './components/hardware_configuration_dialog';
import { ServerWrapper } from './components/server_wrapper';
import { DetailsService } from './service/details_service';
import { NotebooksService } from './service/notebooks_service';
import { PriceService } from './service/price_service';

describe('VmDetails', () => {
  const mockGetUtilizationData = jest.fn();
  const mockGetMachineTypes = jest.fn();
  const mockGetAcceleratorTypes = jest.fn();
  const mockServerWrapper = ({
    getUtilizationData: mockGetUtilizationData,
  } as unknown) as ServerWrapper;
  const mockDetailsService = ({
    getMachineTypes: mockGetMachineTypes,
    getAcceleratorTypes: mockGetAcceleratorTypes,
  } as unknown) as DetailsService;
  const mockNotebookService = {} as NotebooksService;
  const mockPriceService = {} as PriceService;

  beforeEach(() => {
    jest.resetAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  it('Renders with details', async () => {
    const detailsResponse = JSON.parse(DETAILS_RESPONSE);
    const details = Promise.resolve({ ...detailsResponse });
    mockGetUtilizationData.mockReturnValue(details);
    const machineTypes = Promise.resolve(MACHINE_TYPES_RESPONSE);
    mockGetMachineTypes.mockReturnValue(machineTypes);
    const acceleratorTypes = Promise.resolve(ACCELERATOR_TYPES_RESPONSE);
    mockGetAcceleratorTypes.mockReturnValue(acceleratorTypes);

    const vmDetails = shallow(
      <VmDetails
        detailsServer={mockServerWrapper}
        detailsService={mockDetailsService}
        notebookService={mockNotebookService}
        priceService={mockPriceService}
      />
    );
    expect(vmDetails).toMatchSnapshot('Retrieving');

    await details;
    await Promise.all([machineTypes, acceleratorTypes]);

    expect(vmDetails).toMatchSnapshot('Details');
    expect(mockGetUtilizationData).toHaveBeenCalledTimes(1);
    expect(mockGetMachineTypes).toHaveBeenCalledTimes(1);
    expect(mockGetAcceleratorTypes).toHaveBeenCalledTimes(1);
  });

  it('Renders with get details error', async () => {
    mockGetUtilizationData.mockImplementation(() => {
      throw new Error();
    });

    const vmDetails = shallow(
      <VmDetails
        detailsServer={mockServerWrapper}
        detailsService={mockDetailsService}
        notebookService={mockNotebookService}
        priceService={mockPriceService}
      />
    );
    expect(vmDetails).toMatchSnapshot('Received Error');

    vmDetails.find('[title="Show all details"]').simulate('click');
    vmDetails.update();

    expect(vmDetails.state('dialogDisplayed')).toEqual(true);
    expect(vmDetails.find(HardwareConfigurationDialog)).toHaveLength(1);

    const hardwareConfigurationDialog = vmDetails.find(
      HardwareConfigurationDialog
    );
    expect(hardwareConfigurationDialog.props().receivedError).toEqual(true);
  });

  it('Opens dialog when icon is clicked', async () => {
    const detailsResponse = JSON.parse(DETAILS_RESPONSE);
    const details = Promise.resolve({ ...detailsResponse });
    mockGetUtilizationData.mockReturnValue(details);
    const machineTypes = Promise.resolve(MACHINE_TYPES_RESPONSE);
    mockGetMachineTypes.mockReturnValue(machineTypes);
    const acceleratorTypes = Promise.resolve(ACCELERATOR_TYPES_RESPONSE);
    mockGetAcceleratorTypes.mockReturnValue(acceleratorTypes);

    const vmDetails = shallow(
      <VmDetails
        detailsServer={mockServerWrapper}
        detailsService={mockDetailsService}
        notebookService={mockNotebookService}
        priceService={mockPriceService}
      />
    );

    await details;
    await Promise.all([machineTypes, acceleratorTypes]);

    vmDetails.find('[title="Show all details"]').simulate('click');
    vmDetails.update();

    expect(vmDetails.state('dialogDisplayed')).toEqual(true);
    expect(vmDetails.find(HardwareConfigurationDialog)).toHaveLength(1);
  });

  it('Cycles through attributes when clicked', async () => {
    const detailsResponse = JSON.parse(DETAILS_RESPONSE);
    const details = Promise.resolve({ ...detailsResponse });
    mockGetUtilizationData.mockReturnValue(details);
    const machineTypes = Promise.resolve(MACHINE_TYPES_RESPONSE);
    mockGetMachineTypes.mockReturnValue(machineTypes);
    const acceleratorTypes = Promise.resolve(ACCELERATOR_TYPES_RESPONSE);
    mockGetAcceleratorTypes.mockReturnValue(acceleratorTypes);

    const vmDetails = shallow(
      <VmDetails
        detailsServer={mockServerWrapper}
        detailsService={mockDetailsService}
        notebookService={mockNotebookService}
        priceService={mockPriceService}
      />
    );

    await details;
    await Promise.all([machineTypes, acceleratorTypes]);

    expect(mockGetUtilizationData).toHaveBeenCalledTimes(1);
    expect(mockGetMachineTypes).toHaveBeenCalledTimes(1);
    expect(mockGetAcceleratorTypes).toHaveBeenCalledTimes(1);

    let attributes = vmDetails.find(`span.${STYLES.attribute}`);
    expect(attributes.length).toBe(2);
    expect(attributes.first().text()).toBe('pytorch | ');
    expect(attributes.last().text()).toBe('test-project');

    attributes.first().simulate('click');
    attributes = vmDetails.find(`span.${STYLES.attribute}`);
    expect(attributes.first().text()).toBe('test-project | ');
    expect(attributes.last().text()).toBe('PyTorch:1.4');

    attributes.first().simulate('click');
    attributes = vmDetails.find(`span.${STYLES.attribute}`);
    expect(attributes.first().text()).toBe('PyTorch:1.4 | ');
    expect(attributes.last().text()).toBe('4 vCPU, 15 GB RAM (n1-standard-4)');

    // Simulate two clicks
    attributes.last().simulate('click');
    attributes.last().simulate('click');
    attributes = vmDetails.find(`span.${STYLES.attribute}`);
    expect(attributes.first().text()).toBe('CPU: 50.0% | ');
    expect(attributes.last().text()).toBe('Memory: 16.0%');

    attributes.first().simulate('click');
    attributes = vmDetails.find(`span.${STYLES.attribute}`);
    expect(attributes.first().text()).toBe('Memory: 16.0% | ');
    expect(attributes.last().text()).toBe('GPU: Tesla K80 - 100.0%');
  });

  it('Auto-refreshes when resource utilization are displayed', async () => {
    const detailsResponse = JSON.parse(DETAILS_RESPONSE);
    const details = Promise.resolve({ ...detailsResponse });
    mockGetUtilizationData.mockReturnValue(details);
    const machineTypes = Promise.resolve(MACHINE_TYPES_RESPONSE);
    mockGetMachineTypes.mockReturnValue(machineTypes);
    const acceleratorTypes = Promise.resolve(ACCELERATOR_TYPES_RESPONSE);
    mockGetAcceleratorTypes.mockReturnValue(acceleratorTypes);

    const vmDetails = shallow(
      <VmDetails
        detailsServer={mockServerWrapper}
        detailsService={mockDetailsService}
        notebookService={mockNotebookService}
        priceService={mockPriceService}
      />
    );

    await details;
    await Promise.all([machineTypes, acceleratorTypes]);

    expect(mockGetUtilizationData).toHaveBeenCalledTimes(1);
    expect(mockGetMachineTypes).toHaveBeenCalledTimes(1);
    expect(mockGetAcceleratorTypes).toHaveBeenCalledTimes(1);

    // Click four times to move to CPU usage
    for (let i = 0; i < 4; i++) {
      vmDetails
        .find(`span.${STYLES.attribute}`)
        .first()
        .simulate('click');
    }

    let attributes = vmDetails.find(`span.${STYLES.attribute}`);
    expect(attributes.first().text()).toBe('CPU: 50.0% | ');
    expect(attributes.last().text()).toBe('Memory: 16.0%');

    jest.advanceTimersToNextTimer();
    expect(mockGetUtilizationData).toHaveBeenCalledTimes(2);

    attributes.first().simulate('click');
    attributes = vmDetails.find(`span.${STYLES.attribute}`);
    expect(attributes.first().text()).toBe('Memory: 16.0% | ');
    expect(attributes.last().text()).toBe('GPU: Tesla K80 - 100.0%');
    jest.advanceTimersToNextTimer();
    expect(mockGetUtilizationData).toHaveBeenCalledTimes(3);

    // Click twice and timer should not refresh data again
    attributes.first().simulate('click');
    attributes.first().simulate('click');
    attributes = vmDetails.find(`span.${STYLES.attribute}`);
    expect(attributes.first().text()).toBe('pytorch | ');
    expect(attributes.last().text()).toBe('test-project');
    jest.advanceTimersToNextTimer();
    expect(mockGetUtilizationData).toHaveBeenCalledTimes(3);
  });
});
