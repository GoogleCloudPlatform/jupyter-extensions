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

import { Dialog } from '@material-ui/core';
import * as React from 'react';
import { HardwareScalingForm } from './hardware_scaling_form';
import { HardwareScalingStatus } from './hardware_scaling_status';
import { NotebooksService, Instance } from '../service/notebooks_service';
import {
  HardwareConfiguration,
  Details,
  detailsToHardwareConfiguration,
} from '../data';
import { ConfirmationPage } from './confirmation_page';
import { ServerWrapper } from './server_wrapper';
import { DetailsDialogBody } from './details_dialog_body';
import { ErrorPage } from './error_page';

enum View {
  DETAILS,
  FORM,
  CONFIRMATION,
  STATUS,
  ERROR,
}

export enum ErrorType {
  STOP = 'Stop',
  RESHAPING = 'Reshape',
  START = 'Start',
  REFRESH = 'Refresh',
}

export interface ConfigurationError {
  errorType: ErrorType;
  errorValue: any;
  instanceDetails?: Instance;
}

interface Props {
  open: boolean;
  onClose: () => void;
  notebookService: NotebooksService;
  onCompletion: () => void;
  details?: Details;
  detailsServer: ServerWrapper;
  receivedError: boolean;
}

interface State {
  view: View;
  hardwareConfiguration: HardwareConfiguration;
  error: ConfigurationError;
}

export class HardwareConfigurationDialog extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      view: View.DETAILS,
      hardwareConfiguration: null,
      error: null,
    };
  }

  render() {
    const { open } = this.props;

    return <Dialog open={open}>{this.getDisplay()}</Dialog>;
  }

  private onError(
    errorValue,
    errorType: ErrorType,
    instanceDetails?: Instance
  ) {
    this.setState({
      error: {
        errorValue,
        errorType,
        instanceDetails,
      },
    });
  }

  private getDisplay() {
    const {
      onClose,
      notebookService,
      details,
      onCompletion,
      detailsServer,
      receivedError,
    } = this.props;
    const { view, hardwareConfiguration, error } = this.state;

    switch (view) {
      case View.DETAILS:
        return (
          <DetailsDialogBody
            onDialogClose={onClose}
            reshapeForm={() => {
              this.setState({
                view: View.FORM,
              });
            }}
            details={details}
            receivedError={receivedError}
          />
        );
      case View.FORM:
        return (
          <HardwareScalingForm
            onDialogClose={onClose}
            onSubmit={(config: HardwareConfiguration) => {
              this.setState({
                view: View.CONFIRMATION,
                hardwareConfiguration: config,
              });
            }}
            details={details}
          />
        );

      case View.CONFIRMATION:
        return (
          <ConfirmationPage
            onDialogClose={onClose}
            formData={hardwareConfiguration}
            currentConfiguration={
              details && detailsToHardwareConfiguration(details)
            }
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
            onDialogClose={onClose}
            hardwareConfiguration={hardwareConfiguration}
            notebookService={notebookService}
            onCompletion={onCompletion}
            detailsServer={detailsServer}
            onError={(err, errorType, instanceDetails?) =>
              this.onError(err, errorType, instanceDetails)
            }
            showErrorPage={() => {
              this.setState({
                view: View.ERROR,
              });
            }}
          />
        );

      case View.ERROR:
        return <ErrorPage onDialogClose={onClose} error={error} />;
    }
  }
}
