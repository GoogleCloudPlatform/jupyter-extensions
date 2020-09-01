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

import * as React from 'react';

import { PriceService } from '../service/price_service';
import { shallow } from 'enzyme';
import {
  HardwareConfigurationDialog,
  View,
} from './hardware_configuration_dialog';
import { ServerWrapper } from './server_wrapper';
import { NotebooksService } from '../service/notebooks_service';
import { DETAILS } from '../test_helpers';
import { DetailsDialogBody } from './details_dialog_body';
import { HardwareScalingForm } from './hardware_scaling_form';
import { ConfirmationPage } from './confirmation_page';
import { HardwareScalingStatus } from './hardware_scaling_status';
import {
  NO_ACCELERATOR_TYPE,
  NO_ACCELERATOR_COUNT,
} from '../data/accelerator_types';

const CONFIGURATION = {
  machineType: {
    description: '4 vCPU, 15 GB RAM',
    name: 'n1-standard-4',
  },
  attachGpu: false,
  gpuType: NO_ACCELERATOR_TYPE,
  gpuCount: NO_ACCELERATOR_COUNT,
};

describe('HardwareScalingForm', () => {
  const mockOnClose = jest.fn();
  const mockOnCompletion = jest.fn();
  const mockDetailsServer = {} as ServerWrapper;
  const mockNotebookService = {} as NotebooksService;
  const mockPriceService = {} as PriceService;

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('Opens on details view', async () => {
    const hardwareConfigurationDialog = shallow(
      <HardwareConfigurationDialog
        open={true}
        receivedError={false}
        details={DETAILS}
        detailsServer={mockDetailsServer}
        notebookService={mockNotebookService}
        priceService={mockPriceService}
        onClose={mockOnClose}
        onCompletion={mockOnCompletion}
      />
    );

    expect(hardwareConfigurationDialog.state('view')).toEqual(View.DETAILS);
  });

  it('Shows form view after details view', async () => {
    const hardwareConfigurationDialog = shallow(
      <HardwareConfigurationDialog
        open={true}
        receivedError={false}
        details={DETAILS}
        detailsServer={mockDetailsServer}
        notebookService={mockNotebookService}
        priceService={mockPriceService}
        onClose={mockOnClose}
        onCompletion={mockOnCompletion}
      />
    );

    hardwareConfigurationDialog.find(DetailsDialogBody).prop('onUpdate')();
    expect(hardwareConfigurationDialog.state('view')).toEqual(View.FORM);
    expect(hardwareConfigurationDialog).toMatchSnapshot('Form View');
  });

  it('Shows confirmation view after form view', async () => {
    const hardwareConfigurationDialog = shallow(
      <HardwareConfigurationDialog
        open={true}
        receivedError={false}
        details={DETAILS}
        detailsServer={mockDetailsServer}
        notebookService={mockNotebookService}
        priceService={mockPriceService}
        onClose={mockOnClose}
        onCompletion={mockOnCompletion}
      />
    );

    hardwareConfigurationDialog.setState({ view: View.FORM });
    hardwareConfigurationDialog.find(HardwareScalingForm).prop('onSubmit')(
      CONFIGURATION
    );
    expect(hardwareConfigurationDialog.state('view')).toEqual(
      View.CONFIRMATION
    );
    expect(hardwareConfigurationDialog.state('hardwareConfiguration')).toEqual(
      CONFIGURATION
    );
    expect(hardwareConfigurationDialog).toMatchSnapshot('Confirmation View');
  });

  it('Shows status view after confirmation view', async () => {
    const hardwareConfigurationDialog = shallow(
      <HardwareConfigurationDialog
        open={true}
        receivedError={false}
        details={DETAILS}
        detailsServer={mockDetailsServer}
        notebookService={mockNotebookService}
        priceService={mockPriceService}
        onClose={mockOnClose}
        onCompletion={mockOnCompletion}
      />
    );

    hardwareConfigurationDialog.setState({
      view: View.CONFIRMATION,
      hardwareConfiguration: CONFIGURATION,
    });
    hardwareConfigurationDialog.find(ConfirmationPage).prop('onSubmit')();
    expect(hardwareConfigurationDialog.state('view')).toEqual(View.STATUS);
    expect(hardwareConfigurationDialog).toMatchSnapshot('Status View');
  });

  it('Closes dialog from details view on close', async () => {
    const hardwareConfigurationDialog = shallow(
      <HardwareConfigurationDialog
        open={true}
        receivedError={false}
        details={DETAILS}
        detailsServer={mockDetailsServer}
        notebookService={mockNotebookService}
        priceService={mockPriceService}
        onClose={mockOnClose}
        onCompletion={mockOnCompletion}
      />
    );

    hardwareConfigurationDialog.find(DetailsDialogBody).prop('onDialogClose')();
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('Closes dialog from form view on close', async () => {
    const hardwareConfigurationDialog = shallow(
      <HardwareConfigurationDialog
        open={true}
        receivedError={false}
        details={DETAILS}
        detailsServer={mockDetailsServer}
        notebookService={mockNotebookService}
        priceService={mockPriceService}
        onClose={mockOnClose}
        onCompletion={mockOnCompletion}
      />
    );
    hardwareConfigurationDialog.setState({
      view: View.FORM,
      hardwareConfiguration: CONFIGURATION,
    });

    hardwareConfigurationDialog
      .find(HardwareScalingForm)
      .prop('onDialogClose')();
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('Closes dialog from confirmation view on close', async () => {
    const hardwareConfigurationDialog = shallow(
      <HardwareConfigurationDialog
        open={true}
        receivedError={false}
        details={DETAILS}
        detailsServer={mockDetailsServer}
        notebookService={mockNotebookService}
        priceService={mockPriceService}
        onClose={mockOnClose}
        onCompletion={mockOnCompletion}
      />
    );
    hardwareConfigurationDialog.setState({
      view: View.CONFIRMATION,
      hardwareConfiguration: CONFIGURATION,
    });

    hardwareConfigurationDialog.find(ConfirmationPage).prop('onDialogClose')();
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('Closes dialog from status view on close', async () => {
    const hardwareConfigurationDialog = shallow(
      <HardwareConfigurationDialog
        open={true}
        receivedError={false}
        details={DETAILS}
        detailsServer={mockDetailsServer}
        notebookService={mockNotebookService}
        priceService={mockPriceService}
        onClose={mockOnClose}
        onCompletion={mockOnCompletion}
      />
    );
    hardwareConfigurationDialog.setState({
      view: View.STATUS,
      hardwareConfiguration: CONFIGURATION,
    });

    hardwareConfigurationDialog
      .find(HardwareScalingStatus)
      .prop('onDialogClose')();
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('Calls onCompletion function when hardware scaling status completes', async () => {
    const hardwareConfigurationDialog = shallow(
      <HardwareConfigurationDialog
        open={true}
        receivedError={false}
        details={DETAILS}
        detailsServer={mockDetailsServer}
        notebookService={mockNotebookService}
        priceService={mockPriceService}
        onClose={mockOnClose}
        onCompletion={mockOnCompletion}
      />
    );
    hardwareConfigurationDialog.setState({
      view: View.STATUS,
      hardwareConfiguration: CONFIGURATION,
    });

    hardwareConfigurationDialog
      .find(HardwareScalingStatus)
      .prop('onCompletion')();
    expect(mockOnCompletion).toHaveBeenCalledTimes(1);
  });
});
