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
import { Dialog } from '@material-ui/core';
import { HardwareScalingForm } from './hardware_scaling_form';
import { HardwareScalingStatus } from './hardware_scaling_status';
import { ConfirmationPage } from './confirmation_page';
import { ServerWrapper } from './server_wrapper';
import { DetailsDialogBody } from './details_dialog_body';
import {
  HardwareConfiguration,
  Details,
  detailsToHardwareConfiguration,
} from '../data/data';
import { authTokenRetrieval } from '../service/auth_token_retrieval';
import { NotebooksService } from '../service/notebooks_service';
import { PriceService } from '../service/price_service';

export enum View {
  DETAILS,
  FORM,
  CONFIRMATION,
  STATUS,
}

interface Props {
  open: boolean;
  receivedError: boolean;
  detailsServer: ServerWrapper;
  notebookService: NotebooksService;
  priceService: PriceService;
  onClose: () => void;
  onCompletion: () => void;
  details?: Details;
}

interface State {
  view: View;
  hardwareConfiguration: HardwareConfiguration;
}

export class HardwareConfigurationDialog extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      view: View.DETAILS,
      hardwareConfiguration: null,
    };
  }

  render() {
    const { open } = this.props;

    return <Dialog open={open}>{this.getDisplay()}</Dialog>;
  }

  private getDisplay() {
    const {
      details,
      receivedError,
      detailsServer,
      notebookService,
      priceService,
      onClose,
      onCompletion,
    } = this.props;
    const { hardwareConfiguration, view } = this.state;

    switch (view) {
      case View.DETAILS:
        return (
          <DetailsDialogBody
            details={details}
            receivedError={receivedError}
            onDialogClose={onClose}
            onUpdate={() => {
              this.setState({
                view: View.FORM,
              });
            }}
          />
        );

      case View.FORM:
        return (
          <HardwareScalingForm
            details={details}
            priceService={priceService}
            onDialogClose={onClose}
            onSubmit={(config: HardwareConfiguration) => {
              this.setState({
                view: View.CONFIRMATION,
                hardwareConfiguration: config,
              });
            }}
          />
        );

      case View.CONFIRMATION:
        return (
          <ConfirmationPage
            formData={hardwareConfiguration}
            currentConfiguration={detailsToHardwareConfiguration(details)}
            onDialogClose={onClose}
            onSubmit={() => {
              this.setState({
                view: View.STATUS,
              });
            }}
          />
        );

      case View.STATUS:
        return (
          <HardwareScalingStatus
            machineTypes={details.machineTypes}
            hardwareConfiguration={hardwareConfiguration}
            authTokenRetrieval={authTokenRetrieval}
            detailsServer={detailsServer}
            notebookService={notebookService}
            onDialogClose={onClose}
            onCompletion={onCompletion}
          />
        );
    }
  }
}
