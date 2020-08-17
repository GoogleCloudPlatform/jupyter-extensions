import * as React from 'react';
import LinearProgress from '@material-ui/core/LinearProgress';
import { createStyles, withStyles, Theme } from '@material-ui/core/styles';
import { HardwareConfiguration, STYLES } from '../data';
import { ActionBar } from './action_bar';
import { NotebooksService, Instance } from '../service/notebooks_service';
import { authTokenRetrieval } from './auth_token_retrieval';
import { ServerWrapper } from './server_wrapper';
import { ErrorPage } from './error_page';

const BorderLinearProgress = withStyles((theme: Theme) =>
  createStyles({
    root: {
      height: 15,
      borderRadius: 5,
      margin: '20px 0px',
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

enum Status {
  'Authorizing' = 0,
  'Stopping Instance' = 1,
  'Updating Machine Configuration' = 2,
  'Updating GPU Configuration' = 3,
  'Starting Instance' = 4,
  'Refreshing Session' = 5,
  'Complete' = 6,
  'Error' = 7,
}

const statusInfo = [
  'Please complete the OAuth 2.0 authorization steps in the popup',
  'Shutting down instance for reshaping.',
  'Reshaping machine configuration to match your selection.',
  'Reshaping GPU configuration to match your selection.',
  'Restarting your instance.',
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
    const { notebookService } = this.props;
    try {
      const token = await authTokenRetrieval();
      this.setState({
        status: Status['Stopping Instance'],
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
        case Status['Stopping Instance']: {
          try {
            const stopResult = await notebookService.stop();
            this.updateStatus(
              Status['Updating Machine Configuration'],
              stopResult
            );
          } catch (err) {
            this.showError(ErrorType.STOP, err);
          }
          break;
        }

        case Status['Updating Machine Configuration']: {
          let setMachineTypeResult = instanceDetails;
          try {
            setMachineTypeResult = await notebookService.setMachineType(
              machineType.name
            );
          } catch (err) {
            this.updateError(ErrorType.RESHAPING, err);
          }
          const nextStatus = attachGpu
            ? 'Updating GPU Configuration'
            : 'Starting Instance';
          this.updateStatus(Status[nextStatus], setMachineTypeResult);
          break;
        }

        case Status['Updating GPU Configuration']: {
          let setGpuTypeResult = instanceDetails;
          try {
            setGpuTypeResult = await notebookService.setAccelerator(
              gpuType,
              gpuCount
            );
          } catch (err) {
            this.updateError(ErrorType.RESHAPING, err);
          }
          this.updateStatus(Status['Starting Instance'], setGpuTypeResult);
          break;
        }

        case Status['Starting Instance']: {
          try {
            const startResult = await notebookService.start();
            this.updateStatus(Status['Refreshing Session'], startResult);
          } catch (err) {
            this.showError(ErrorType.START, err);
          }
          break;
        }

        case Status['Refreshing Session']: {
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
    const progressValue = (status / 6) * 100;
    const { onDialogClose } = this.props;
    return status === Status['Error'] ? (
      <ErrorPage
        onDialogClose={onDialogClose}
        error={error}
        instanceDetails={instanceDetails}
      />
    ) : (
      <div className={STYLES.containerPadding}>
        <div className={STYLES.containerSize}>
          <p className={STYLES.heading}>{Status[status]}</p>
          <p className={STYLES.paragraph}>{statusInfo[status]}</p>
        </div>
        {status === Status['Complete'] ? (
          <ActionBar onPrimaryClick={onDialogClose} primaryLabel="Close" />
        ) : (
          <BorderLinearProgress variant="determinate" value={progressValue} />
        )}
      </div>
    );
  }
}
