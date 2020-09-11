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

import * as csstips from 'csstips';
import * as React from 'react';
import { stylesheet, classes } from 'typestyle';
import LinearProgress from '@material-ui/core/LinearProgress';
import { createStyles, withStyles, Theme } from '@material-ui/core/styles';
import { STYLES } from '../data/styles';
import { HardwareConfiguration } from '../data/data';
import { MachineTypeConfiguration } from '../data/machine_types';
import { ActionBar } from './action_bar';
import { NotebooksService, Instance } from '../service/notebooks_service';
import { ServerWrapper } from './server_wrapper';
import { ErrorPage } from './error_page';
import { displayInstance } from './instance_details_message';

const BorderLinearProgress = withStyles((theme: Theme) =>
  createStyles({
    root: {
      height: 10,
      width: 450,
      borderRadius: 15,
      margin: '10px 0px',
    },
    colorPrimary: {
      backgroundColor:
        theme.palette.grey[theme.palette.type === 'light' ? 200 : 700],
    },
    bar: {
      backgroundColor: '#1a90ff',
      borderRadius: 5,
    },
  })
)(LinearProgress);

const STATUS_STYLES = stylesheet({
  container: {
    ...csstips.vertical,
    alignItems: 'center',
    backgroundColor: 'var(--jp-layout-color1)',
  },
  containerPadding: {
    padding: '50px 75px 15px 75px',
  },
  containerBottomPadding: {
    paddingBottom: '20px',
  },
  image: {
    marginBottom: '40px',
    height: 240,
    width: 300,
  },
  bottomText: {
    marginTop: '50px',
    fontSize: '12px',
    color: 'var(--jp-ui-font-color2)',
  },
});

export enum Status {
  'Authorizing' = 0,
  'Stopping notebook instance' = 1,
  'Updating machine configuration' = 2,
  'Updating GPU configuration' = 3,
  'Restarting notebook instance' = 4,
  'Refreshing session' = 5,
  'Complete' = 6,
  'Error' = 7,
}

const statusInfo = [
  'Please complete the OAuth 2.0 authorization steps in the popup',
  'Shutting down your notebook instance for reshaping.',
  'Reshaping machine configuration to match your selection.',
  'Reshaping GPU configuration to match your selection.',
  'Restarting your newly configured notebook instance.',
  'Refreshing your JupyterLab session to reflect your new configuration.',
  'Operation complete. Enjoy your newly configured instance!',
  'An error has occured, please try again later.',
];

export enum ErrorType {
  STOP = 'Stop',
  RESHAPING = 'Reshape',
  START = 'Start',
  REFRESH = 'Refresh',
}

export interface ConfigurationError {
  errorType: ErrorType;
  errorValue: any;
}

interface Props {
  hardwareConfiguration: HardwareConfiguration;
  notebookService: NotebooksService;
  onDialogClose: () => void;
  onCompletion: () => void;
  detailsServer: ServerWrapper;
  authTokenRetrieval: () => Promise<string>;
  machineTypes: MachineTypeConfiguration[];
}

interface State {
  status: Status;
  instanceDetails: Instance;
  error: ConfigurationError;
}

export class HardwareScalingStatus extends React.Component<Props, State> {
  private readonly NUM_RETRIES = 20;

  constructor(props: Props) {
    super(props);
    this.state = {
      status: Status.Authorizing,
      instanceDetails: null,
      error: null,
    };
  }

  private preventPageClose(event) {
    event.preventDefault();
    event.returnValue = '';
  }

  private updateStatus(status: Status, instanceDetails: Instance) {
    this.setState({
      status,
      instanceDetails,
    });
  }

  private showError(
    errorType: ErrorType,
    errorValue: any,
    newInstanceDetails?: Instance
  ) {
    this.setState({
      status: Status.Error,
      instanceDetails: newInstanceDetails
        ? newInstanceDetails
        : this.state.instanceDetails,
      error: {
        errorType,
        errorValue,
      },
    });
  }

  private updateError(
    errorType: ErrorType,
    errorValue: any,
    newInstanceDetails?: Instance
  ) {
    this.setState({
      instanceDetails: newInstanceDetails
        ? newInstanceDetails
        : this.state.instanceDetails,
      error: {
        errorType,
        errorValue,
      },
    });
  }

  private async waitForServer() {
    for (let tries = 0; tries < this.NUM_RETRIES; tries++) {
      try {
        await this.props.detailsServer.getUtilizationData();
        break;
      } catch (err) {
        if (tries === this.NUM_RETRIES - 1) {
          this.showError(ErrorType.REFRESH, err);
        }
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
  }

  async componentDidMount() {
    const { notebookService, authTokenRetrieval } = this.props;
    try {
      const token = await authTokenRetrieval();
      this.setState({
        status: Status['Stopping notebook instance'],
      });
      notebookService.setAuthToken(token);
    } catch (err) {
      this.setState({ status: Status.Error });
      console.log(err);
    }
    window.addEventListener('beforeunload', this.preventPageClose);
  }

  async componentDidUpdate(prevProps, prevState) {
    const { status, error, instanceDetails } = this.state;
    const { hardwareConfiguration, notebookService, onCompletion } = this.props;
    const { machineType, attachGpu, gpuType, gpuCount } = hardwareConfiguration;

    if (prevState.status !== status) {
      switch (status) {
        case Status['Stopping notebook instance']: {
          try {
            const stopResult = await notebookService.stop();
            this.updateStatus(
              Status['Updating machine configuration'],
              stopResult
            );
          } catch (err) {
            this.showError(ErrorType.STOP, err);
          }
          break;
        }

        case Status['Updating machine configuration']: {
          let setMachineTypeResult = instanceDetails;
          try {
            setMachineTypeResult = await notebookService.setMachineType(
              machineType.name
            );
          } catch (err) {
            this.updateError(ErrorType.RESHAPING, err);
          }
          const nextStatus = attachGpu
            ? 'Updating GPU configuration'
            : 'Restarting notebook instance';
          this.updateStatus(Status[nextStatus], setMachineTypeResult);
          break;
        }

        case Status['Updating GPU configuration']: {
          let setGpuTypeResult = instanceDetails;
          try {
            setGpuTypeResult = await notebookService.setAccelerator(
              gpuType,
              gpuCount
            );
          } catch (err) {
            this.updateError(ErrorType.RESHAPING, err);
          }
          this.updateStatus(
            Status['Restarting notebook instance'],
            setGpuTypeResult
          );
          break;
        }

        case Status['Restarting notebook instance']: {
          try {
            const startResult = await notebookService.start();
            this.updateStatus(Status['Refreshing session'], startResult);
          } catch (err) {
            this.showError(ErrorType.START, err);
          }
          break;
        }

        case Status['Refreshing session']: {
          await this.waitForServer();
          onCompletion();
          this.setState({
            status:
              error && error.errorType === ErrorType.RESHAPING
                ? Status.Error
                : Status.Complete,
          });
          break;
        }

        default:
          break;
      }
    }
  }

  componentWillUnmount() {
    window.removeEventListener('beforeunload', this.preventPageClose);
  }

  render() {
    const { status, error, instanceDetails } = this.state;
    const progressValue = ((status + 1) / 6) * 100;
    const { onDialogClose, machineTypes } = this.props;
    return status === Status['Error'] ? (
      <ErrorPage
        onDialogClose={onDialogClose}
        error={error}
        instanceDetails={instanceDetails}
        machineTypes={machineTypes}
      />
    ) : (
      <div
        className={classes(
          STATUS_STYLES.containerPadding,
          STATUS_STYLES.container
        )}
      >
        <span className={classes(STATUS_STYLES.image, 'jp-CaipIcon')} />
        <p className={STYLES.heading}>
          {status < 6 ? `${Status[status]} (${status + 1}/6)` : Status[status]}
        </p>
        {status === Status['Complete'] ? (
          <div
            className={
              (STATUS_STYLES.container, STATUS_STYLES.containerBottomPadding)
            }
          >
            <p className={STYLES.paragraph}>{statusInfo[status]}</p>
            {status === Status['Complete'] &&
              displayInstance(
                instanceDetails,
                machineTypes,
                'Your new configuration:'
              )}
            <ActionBar onPrimaryClick={onDialogClose} primaryLabel="Close" />
          </div>
        ) : (
          <div className={STATUS_STYLES.container}>
            <BorderLinearProgress variant="determinate" value={progressValue} />
            <p className={STYLES.paragraph}>{statusInfo[status]}</p>
            <p className={STATUS_STYLES.bottomText}>
              Don't close the browser tab before the update process is finished
            </p>
          </div>
        )}
      </div>
    );
  }
}
