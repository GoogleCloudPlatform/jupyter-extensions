import * as React from 'react';
import LinearProgress from '@material-ui/core/LinearProgress';
import { createStyles, withStyles, Theme } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import { HardwareConfiguration, STYLES } from '../data';
import { NotebooksService } from '../service/notebooks_service';
import { authTokenRetrieval } from './auth_token_retrieval';
import { ServerWrapper } from './server_wrapper';

const BorderLinearProgress = withStyles((theme: Theme) =>
  createStyles({
    root: {
      height: 15,
      borderRadius: 5,
      margin: '20px',
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
  'Reshaping Instance' = 2,
  'Starting Instance' = 3,
  'Complete' = 4,
  'Error' = 5,
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
}

interface State {
  status: Status;
}

export class HardwareScalingStatus extends React.Component<Props, State> {
  private readonly NUM_RETRIES = 20;

  constructor(props: Props) {
    super(props);
    this.state = {
      status: Status.Authorizing,
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

  async componentDidUpdate() {
    const { hardwareConfiguration, notebookService, onCompletion } = this.props;
    const { machineType, gpuType, gpuCount, attachGpu } = hardwareConfiguration;

    try {
      switch (this.state.status) {
        case Status['Stopping Instance']:
          await notebookService.stop();
          this.setState({ status: Status['Reshaping Instance'] });
          break;
        case Status['Reshaping Instance']:
          await notebookService.setMachineType(machineType.name);
          if (attachGpu) {
            await notebookService.setAccelerator(gpuType, gpuCount);
          }
          this.setState({ status: Status['Starting Instance'] });
          break;
        case Status['Starting Instance']:
          await notebookService.start();
          // Wait for server to come back up
          for (let tries = 0; tries < this.NUM_RETRIES; tries++) {
            try {
              await this.props.detailsServer.getUtilizationData();
              break;
            } catch (err) {
              if (tries === this.NUM_RETRIES - 1) {
                throw err;
              }
              await new Promise(resolve => setTimeout(resolve, 5000));
            }
          }
          this.setState({ status: Status.Complete });
          onCompletion();
          break;
        default:
          break;
      }
    } catch (err) {
      this.setState({ status: Status.Error });
      console.log(err);
    }
  }

  componentWillUnmount() {
    window.removeEventListener('beforeunload', this.preventPageClose);
  }

  render() {
    const { status } = this.state;
    const progressValue = (status / 4) * 100;
    const { onDialogClose } = this.props;
    return (
      <div className={STYLES.containerPadding}>
        <p className={STYLES.subheading}>{Status[status]}</p>
        <p className={STYLES.paragraph}>{statusInfo[status]}</p>
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
