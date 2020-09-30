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

/* eslint-disable @typescript-eslint/camelcase */

import * as React from 'react';
import { Option } from 'gcp_jupyterlab_shared';
import { shallow } from 'enzyme';
import { HardwareScalingForm } from './hardware_scaling_form';
import { ActionBar } from './action_bar';
import {
  NO_ACCELERATOR_TYPE,
  NO_ACCELERATOR_COUNT,
  ACCELERATOR_COUNTS_1_2_4_8,
} from '../data/accelerator_types';
import { HardwareConfiguration } from '../data/data';
import { MachineTypeConfiguration } from '../data/machine_types';
import { PriceService } from '../service/price_service';
import { ACCELERATOR_TYPES, DETAILS, MACHINE_TYPES } from '../test_helpers';

interface HardwareScalingFormInstance extends React.Component<{}, {}> {
  gpuTypeOptions: Option[];
  oldConfiguration: HardwareConfiguration;
  machineTypesOptions: MachineTypeConfiguration[];
  oldConfigurationPrice: number | undefined;
}

const INITIAL_STATE = {
  configuration: {
    machineType: {
      description: '4 vCPU, 15 GB RAM',
      name: 'n1-standard-4',
    },
    attachGpu: false,
    gpuType: NO_ACCELERATOR_TYPE,
    gpuCount: NO_ACCELERATOR_COUNT,
  },
  gpuCountOptions: ACCELERATOR_COUNTS_1_2_4_8,
  newConfigurationPrice: undefined,
};

const OLD_CONFIGURATION_PRICE = 3;
const NEW_CONFIGURATION_PRICE = 4;
const GPU_TYPE_OPTIONS = [
  { value: 'NVIDIA_TESLA_K80', text: 'Nvidia Tesla K80' },
  { value: 'NVIDIA_TESLA_T4', text: 'Nvidia Tesla T4' },
];

describe('HardwareScalingForm', () => {
  const mockOnSubmit = jest.fn();
  const mockOnDialogClose = jest.fn();
  const mockGetPrice = jest.fn();
  const mockPriceService = ({
    getPrice: mockGetPrice,
  } as unknown) as PriceService;

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('Successfully initializes form', async () => {
    const oldConfigurationPrice = Promise.resolve(OLD_CONFIGURATION_PRICE);
    mockGetPrice.mockReturnValue(oldConfigurationPrice);
    const hardwareScalingForm = shallow(
      <HardwareScalingForm
        acceleratorTypes={ACCELERATOR_TYPES}
        details={DETAILS}
        machineTypes={MACHINE_TYPES}
        onSubmit={mockOnSubmit}
        onDialogClose={mockOnDialogClose}
        priceService={mockPriceService}
      />
    );
    const hardwareScalingFormInstance = hardwareScalingForm.instance() as HardwareScalingFormInstance;

    await oldConfigurationPrice;

    expect(hardwareScalingForm.state()).toEqual(INITIAL_STATE);
    expect(hardwareScalingFormInstance.gpuTypeOptions).toEqual(
      GPU_TYPE_OPTIONS
    );
    expect(hardwareScalingFormInstance.oldConfigurationPrice).toEqual(
      OLD_CONFIGURATION_PRICE
    );
    expect(hardwareScalingForm).toMatchSnapshot('Initial Form');
  });

  it('Attaching GPU updates state', async () => {
    const newConfigurationPrice = Promise.resolve(NEW_CONFIGURATION_PRICE);
    mockGetPrice.mockReturnValue(newConfigurationPrice);
    const hardwareScalingForm = shallow(
      <HardwareScalingForm
        acceleratorTypes={ACCELERATOR_TYPES}
        details={DETAILS}
        machineTypes={MACHINE_TYPES}
        onSubmit={mockOnSubmit}
        onDialogClose={mockOnDialogClose}
        priceService={mockPriceService}
      />
    );

    // Check attach GPU checkbox
    const checkboxInput = hardwareScalingForm.find('[label="Attach GPUs"]');
    checkboxInput.simulate('change', {
      target: { name: 'attachGpu', checked: true },
    });

    await newConfigurationPrice;
    hardwareScalingForm.update();

    expect(hardwareScalingForm.state()).toEqual({
      ...INITIAL_STATE,
      newConfigurationPrice: NEW_CONFIGURATION_PRICE,
      configuration: {
        ...INITIAL_STATE.configuration,
        attachGpu: true,
        gpuType: 'NVIDIA_TESLA_K80',
        gpuCount: '1',
      },
    });
  });

  it('Selecting GPU type updates state', async () => {
    const newConfigurationPrice = Promise.resolve(NEW_CONFIGURATION_PRICE);
    mockGetPrice.mockReturnValue(newConfigurationPrice);
    const hardwareScalingForm = shallow(
      <HardwareScalingForm
        acceleratorTypes={ACCELERATOR_TYPES}
        details={DETAILS}
        machineTypes={MACHINE_TYPES}
        onSubmit={mockOnSubmit}
        onDialogClose={mockOnDialogClose}
        priceService={mockPriceService}
      />
    );

    // Check attach GPU checkbox
    const checkboxInput = hardwareScalingForm.find('[label="Attach GPUs"]');
    checkboxInput.simulate('change', {
      target: { name: 'attachGpu', checked: true },
    });

    await newConfigurationPrice;
    hardwareScalingForm.update();
    mockGetPrice.mockReturnValue(newConfigurationPrice);

    // Select new GPU type
    const gpuTypeSelect = hardwareScalingForm.find('[label="GPU type"]');
    gpuTypeSelect.simulate('change', {
      target: { name: 'gpuType', value: 'NVIDIA_TESLA_T4' },
    });

    await newConfigurationPrice;
    hardwareScalingForm.update();

    expect(hardwareScalingForm.state()).toEqual({
      ...INITIAL_STATE,
      newConfigurationPrice: NEW_CONFIGURATION_PRICE,
      gpuCountOptions: ACCELERATOR_COUNTS_1_2_4_8.slice(0, 4),
      configuration: {
        ...INITIAL_STATE.configuration,
        attachGpu: true,
        gpuType: 'NVIDIA_TESLA_T4',
        gpuCount: '1',
      },
    });
  });

  it('Selecting GPU count updates state', async () => {
    const newConfigurationPrice = Promise.resolve(NEW_CONFIGURATION_PRICE);
    mockGetPrice.mockReturnValue(newConfigurationPrice);
    const hardwareScalingForm = shallow(
      <HardwareScalingForm
        acceleratorTypes={ACCELERATOR_TYPES}
        details={DETAILS}
        machineTypes={MACHINE_TYPES}
        onSubmit={mockOnSubmit}
        onDialogClose={mockOnDialogClose}
        priceService={mockPriceService}
      />
    );

    // Check attach GPU checkbox
    const checkboxInput = hardwareScalingForm.find('[label="Attach GPUs"]');
    checkboxInput.simulate('change', {
      target: { name: 'attachGpu', checked: true },
    });

    await newConfigurationPrice;
    hardwareScalingForm.update();

    // Select new GPU count
    const gpuTypeCount = hardwareScalingForm.find('[label="Number of GPUs"]');
    gpuTypeCount.simulate('change', {
      target: { name: 'gpuCount', value: '4' },
    });

    await newConfigurationPrice;
    hardwareScalingForm.update();

    expect(hardwareScalingForm.state()).toEqual({
      ...INITIAL_STATE,
      newConfigurationPrice: NEW_CONFIGURATION_PRICE,
      gpuCountOptions: ACCELERATOR_COUNTS_1_2_4_8.slice(0, 4),
      configuration: {
        ...INITIAL_STATE.configuration,
        attachGpu: true,
        gpuType: 'NVIDIA_TESLA_K80',
        gpuCount: '4',
      },
    });
  });

  it('Selecting machine type updates state', async () => {
    const newConfigurationPrice = Promise.resolve(NEW_CONFIGURATION_PRICE);
    mockGetPrice.mockReturnValue(newConfigurationPrice);
    const hardwareScalingForm = shallow(
      <HardwareScalingForm
        acceleratorTypes={ACCELERATOR_TYPES}
        details={DETAILS}
        machineTypes={MACHINE_TYPES}
        onSubmit={mockOnSubmit}
        onDialogClose={mockOnDialogClose}
        priceService={mockPriceService}
      />
    );

    // Select new machine type
    const machineTypeSelect = hardwareScalingForm.find(
      '[label="Machine type"]'
    );
    machineTypeSelect.simulate('change', {
      value: 'n1-standard-2',
      text: '2 vCPU, 7.5 GB RAM',
    });

    await newConfigurationPrice;
    hardwareScalingForm.update();

    expect(hardwareScalingForm.state()).toEqual({
      ...INITIAL_STATE,
      newConfigurationPrice: NEW_CONFIGURATION_PRICE,
      configuration: {
        ...INITIAL_STATE.configuration,
        machineType: {
          description: '2 vCPU, 7.5 GB RAM',
          name: 'n1-standard-2',
        },
      },
    });
  });

  it('Selecting incompatible machine type clears and disables attaching GPU', async () => {
    const newConfigurationPrice = Promise.resolve(NEW_CONFIGURATION_PRICE);
    mockGetPrice.mockReturnValue(newConfigurationPrice);
    const hardwareScalingForm = shallow(
      <HardwareScalingForm
        acceleratorTypes={ACCELERATOR_TYPES}
        details={DETAILS}
        machineTypes={MACHINE_TYPES}
        onSubmit={mockOnSubmit}
        onDialogClose={mockOnDialogClose}
        priceService={mockPriceService}
      />
    );

    // Check attach GPU checkbox
    const checkboxInput = hardwareScalingForm.find('[label="Attach GPUs"]');
    checkboxInput.simulate('change', {
      target: { name: 'attachGpu', checked: true },
    });

    await newConfigurationPrice;
    hardwareScalingForm.update();

    expect(hardwareScalingForm.state()).toEqual({
      ...INITIAL_STATE,
      newConfigurationPrice: NEW_CONFIGURATION_PRICE,
      configuration: {
        ...INITIAL_STATE.configuration,
        attachGpu: true,
        gpuType: 'NVIDIA_TESLA_K80',
        gpuCount: '1',
      },
    });

    // Select GPU-incompatible machine type
    const machineTypeSelect = hardwareScalingForm.find(
      '[label="Machine type"]'
    );
    machineTypeSelect.simulate('change', {
      value: 'incompatible-machine-type',
      text: 'Incompatible Machine Type',
    });

    await newConfigurationPrice;
    hardwareScalingForm.update();

    expect(hardwareScalingForm.state()).toEqual({
      ...INITIAL_STATE,
      newConfigurationPrice: NEW_CONFIGURATION_PRICE,
      configuration: {
        machineType: {
          description: 'Incompatible Machine Type',
          name: 'incompatible-machine-type',
        },
        attachGpu: false,
        gpuType: NO_ACCELERATOR_TYPE,
        gpuCount: NO_ACCELERATOR_COUNT,
      },
    });
    expect(
      hardwareScalingForm.find('[label="Attach GPUs"]').prop('disabled')
    ).toEqual(true);
  });

  it('Attaches unspecified GPU type and count if user removes GPU', async () => {
    const newConfigurationPrice = Promise.resolve(NEW_CONFIGURATION_PRICE);
    mockGetPrice.mockReturnValue(newConfigurationPrice);
    const detailsWithGpu = {
      ...DETAILS,
      gpu: {
        cuda_version: '10.1',
        driver_version: '418.87.01',
        gpu: 100,
        memory: 60,
        name: 'Tesla K80',
        temperature: 0,
        count: '1',
      },
    };
    const hardwareScalingForm = shallow(
      <HardwareScalingForm
        acceleratorTypes={ACCELERATOR_TYPES}
        details={detailsWithGpu}
        machineTypes={MACHINE_TYPES}
        onSubmit={mockOnSubmit}
        onDialogClose={mockOnDialogClose}
        priceService={mockPriceService}
      />
    );
    expect(hardwareScalingForm.state()).toEqual({
      ...INITIAL_STATE,
      configuration: {
        ...INITIAL_STATE.configuration,
        attachGpu: true,
        gpuType: 'NVIDIA_TESLA_K80',
        gpuCount: '1',
      },
    });

    // Uncheck attach GPU checkbox to remove GPU
    const checkboxInput = hardwareScalingForm.find('[label="Attach GPUs"]');
    checkboxInput.simulate('change', {
      target: { name: 'attachGpu', checked: false },
    });

    await newConfigurationPrice;
    hardwareScalingForm.update();

    expect(hardwareScalingForm.state()).toEqual({
      ...INITIAL_STATE,
      newConfigurationPrice: NEW_CONFIGURATION_PRICE,
    });

    // Submit form
    hardwareScalingForm.find(ActionBar).prop('onPrimaryClick')();

    expect(mockOnSubmit).toHaveBeenCalledWith({
      ...INITIAL_STATE.configuration,
      attachGpu: true,
      gpuType: NO_ACCELERATOR_TYPE,
      gpuCount: NO_ACCELERATOR_COUNT,
    });
  });

  it('Displays correct pricing estimation', async () => {
    const oldConfigurationPrice = Promise.resolve(OLD_CONFIGURATION_PRICE);
    const newConfigurationPrice = Promise.resolve(NEW_CONFIGURATION_PRICE);
    mockGetPrice.mockReturnValue(oldConfigurationPrice);
    const hardwareScalingForm = shallow(
      <HardwareScalingForm
        acceleratorTypes={ACCELERATOR_TYPES}
        details={DETAILS}
        machineTypes={MACHINE_TYPES}
        onSubmit={mockOnSubmit}
        onDialogClose={mockOnDialogClose}
        priceService={mockPriceService}
      />
    );

    await oldConfigurationPrice;
    expect(hardwareScalingForm.state()).toEqual(INITIAL_STATE);

    // Check attach GPU checkbox
    const checkboxInput = hardwareScalingForm.find('[label="Attach GPUs"]');
    mockGetPrice.mockReturnValue(newConfigurationPrice);
    checkboxInput.simulate('change', {
      target: { name: 'attachGpu', checked: true },
    });

    await newConfigurationPrice;
    hardwareScalingForm.update();

    expect(hardwareScalingForm).toMatchSnapshot('Form With Price Estimation');
  });
});
