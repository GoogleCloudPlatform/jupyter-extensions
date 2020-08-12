import * as React from 'react';
import { stylesheet } from 'typestyle';
import LinearProgress from '@material-ui/core/LinearProgress';
import { createStyles, withStyles, Theme } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import { HardwareConfiguration } from '../data';
import { ErrorType } from './hardware_configuration_dialog';
import { NotebooksService, Instance } from '../service/notebooks_service';
import { authTokenRetrieval } from './auth_token_retrieval';
import { ServerWrapper } from './server_wrapper';

const BorderLinearProgress = withStyles((theme: Theme) =>
  createStyles({
    root: {
      width: 400,
      height: 15,
      borderRadius: 5,
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

const STYLES = stylesheet({
  flexContainer: {
    width: 500,
    height: 300,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heading: {
    fontSize: '24px',
  },
  paragraph: {
    height: 60,
    width: 350,
    textAlign: 'center',
  },
});

enum Status {
  'Authorizing' = 0,
  'Stopping Instance' = 1,
  'Reshaping Instance' = 2,
  'Starting Instance' = 3,
  'Complete' = 5,
  'Error' = 6,
}

const statusInfo = [
  'Getting authorization token to reshape machine. Please complete the OAuth 2.0 authorization steps in the popup',
  'Shutting down instance for reshaping.',
  'Reshaping instance to your configuration.',
  'Restarting your instance. Your newly configured machine will be ready very shortly!',
  'Operation complete. Enjoy your newly configured instance! You may now close this dialog.',
  'An error has occured, please try again later. You may need to restart the instance manually.',
];

interface Props {
  hardwareConfiguration: HardwareConfiguration;
  notebookService: NotebooksService;
  onDialogClose: () => void;
  onCompletion: () => void;
  detailsServer: ServerWrapper;
  onError: (err, errorType: ErrorType, instanceDetails?: Instance) => void;
  showErrorPage: () => void;
}

interface State {
  status: Status;
  instanceDetails: Instance;
  reshapingError: boolean;
}

export class HardwareScalingStatus extends React.Component<Props, State> {
  private readonly NUM_RETRIES = 20;

  constructor(props: Props) {
    super(props);
    this.state = {
      status: Status.Authorizing,
      instanceDetails: null,
      reshapingError: false,
    };
  }

  private preventPageClose(event) {
    event.preventDefault();
    event.returnValue = '';
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
    const { status, instanceDetails, reshapingError } = this.state;
    const {
      hardwareConfiguration,
      notebookService,
      onError,
      showErrorPage,
      onCompletion,
    } = this.props;
    const { machineType, attachGpu, gpuType, gpuCount } = hardwareConfiguration;

    if (prevState.status !== status) {
      switch (status) {
        case Status['Stopping Instance']: {
          try {
            const stopResult = (await notebookService.stop()) as Instance;
            this.setState({
              status: Status['Reshaping Instance'],
              instanceDetails: stopResult,
            });
          } catch (err) {
            onError(err, ErrorType.STOP, instanceDetails);
            this.setState({ status: Status.Error });
          }
          break;
        }

        case Status['Reshaping Instance']: {
          let reshapeResult: Instance = instanceDetails;
          // Change machineType
          try {
            reshapeResult = (await notebookService.setMachineType(
              machineType.name
            )) as Instance;
          } catch (err) {
            this.setState({ reshapingError: true });
            onError(err, ErrorType.RESHAPING, reshapeResult);
          }
          // Attach GPU
          if (attachGpu) {
            try {
              reshapeResult = (await notebookService.setAccelerator(
                gpuType,
                gpuCount
              )) as Instance;
            } catch (err) {
              this.setState({ reshapingError: true });
              onError(err, ErrorType.RESHAPING, reshapeResult);
            }
          }
          // If reshaping fails, start the machine and display reshaping error message after machine has started
          this.setState({
            status: Status['Starting Instance'],
            instanceDetails: reshapeResult,
          });
          break;
        }

        case Status['Starting Instance']: {
          let startResult: Instance = null;
          try {
            startResult = (await notebookService.start()) as Instance;
          } catch (err) {
            onError(err, ErrorType.START, instanceDetails);
            this.setState({ status: Status.Error });
          }

          // Wait for server to come back up
          for (let tries = 0; tries < this.NUM_RETRIES; tries++) {
            try {
              await this.props.detailsServer.getUtilizationData();
              break;
            } catch (err) {
              if (tries === this.NUM_RETRIES - 1) {
                onError(err, ErrorType.REFRESH, startResult);
                this.setState({ status: Status.Error });
              }
              await new Promise(resolve => setTimeout(resolve, 5000));
            }
          }
          onCompletion();
          this.setState({
            status: reshapingError ? Status.Error : Status.Complete,
          });
          break;
        }

        case Status['Error']: {
          showErrorPage();
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
    const { status } = this.state;
    const progressValue = (status / 4) * 100;
    const { flexContainer, heading, paragraph } = STYLES;
    const { onDialogClose } = this.props;
    return (
      <div className={flexContainer}>
        <h3 className={heading}>{Status[status]}</h3>
        <p className={paragraph}>{statusInfo[status]}</p>
        {status === 4 || status === 5 ? (
          <Button
            variant="contained"
            color="primary"
            onClick={() => {
              onDialogClose();
            }}
          >
            Close
          </Button>
        ) : (
          <BorderLinearProgress variant="determinate" value={progressValue} />
        )}
      </div>
    );
  }
}
