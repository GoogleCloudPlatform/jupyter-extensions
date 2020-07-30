import * as React from 'react';
import LinearProgress from '@material-ui/core/LinearProgress';
import { stylesheet } from 'typestyle';
import { AuthTokenRetrieval } from './auth_token_retrieval';
import {
  makeStyles,
  createStyles,
  withStyles,
  Theme,
} from '@material-ui/core/styles';
import { HardwareConfiguration } from '../data';
import { NotebooksService } from '../service/notebooks_service';
import { ClientTransportService } from 'gcp_jupyterlab_shared';

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

enum Status {
  'Authorizing' = 0,
  'Stopping Instance' = 1,
  'Reshaping Instance' = 2,
  'Starting Instance' = 3,
  'Complete' = 4,
  'Error' = 5,
}

interface Props {
  hardwareConfiguration: HardwareConfiguration;
}

interface State {
  status: Status;
}

const useStyles = makeStyles({
  root: {
    flexGrow: 1,
  },
});

function CustomizedProgressBars(props) {
  const classes = useStyles();

  return (
    <div className={classes.root}>
      <BorderLinearProgress variant="determinate" value={props.progressValue} />
    </div>
  );
}

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
    marginTop: '50px',
    fontSize: '24px',
  },
  paragraph: {
    height: 60,
    width: 350,
    paddingBottom: '20px',
    textAlign: 'center',
  },
});

const statusInfo = [
  'Getting authorization token to reshape machine. A dialog box should have popped up.',
  'Shutting down instance for reshaping. You may need to restart the instance manually.',
  'Reshaping instance to your configuration. You may need to restart the instance manually.',
  'Restarting your instance. Your newly configured machine will be ready very shortly!',
  'Operation complete. Enjoy your newly configured instance! You may now close this dialog.',
];

export class HardwareScalingStatus extends React.Component<Props, State> {
  private notebookService: NotebooksService;
  constructor(props: Props) {
    super(props);
    this.state = {
      status: Status.Authorizing,
    };
    const clientTransportService = new ClientTransportService();
    this.notebookService = new NotebooksService(clientTransportService);
    this.notebookService.projectId = 'jupyterlab-interns-sandbox';
    this.notebookService.locationId = 'us-central1-a';
    this.notebookService.instanceName = 'tensorflow-2-1-20200605-144102';
  }

  private preventPageClose(event) {
    // Cancel the event as stated by the standard.
    event.preventDefault();
    // Chrome requires returnValue to be set.
    event.returnValue = '';
  }

  componentDidMount() {
    AuthTokenRetrieval((err, token) => {
      if (err) {
        this.setState({ status: Status.Error });
      } else {
        this.setState({
          status: Status['Stopping Instance'],
        });
        this.notebookService.setAuthToken(token);
      }
    });
    window.addEventListener('beforeunload', this.preventPageClose);
  }

  async componentDidUpdate() {
    const {
      machineType,
      gpuType,
      gpuCount,
      attachGpu,
    } = this.props.hardwareConfiguration;
    switch (this.state.status) {
      case Status['Stopping Instance']:
        await this.notebookService.stop();
        this.setState({ status: Status['Reshaping Instance'] });
        break;
      case Status['Reshaping Instance']:
        await this.notebookService.setMachineType(machineType.value as string);
        if (attachGpu) {
          await this.notebookService.setAccelerator(gpuType, gpuCount);
        }
        this.setState({ status: Status['Starting Instance'] });
        break;
      case Status['Starting Instance']:
        await this.notebookService.start();
        this.setState({ status: Status.Complete });
        break;
      default:
        break;
    }
  }

  componentWillUnmount() {
    window.removeEventListener('beforeunload', this.preventPageClose);
  }

  render() {
    const { status } = this.state;
    const progressValue = (status / 5) * 100;
    const { flexContainer, heading, paragraph } = STYLES;
    return (
      <div className={flexContainer}>
        <h3 className={heading}>{Status[status]}</h3>
        <p className={paragraph}>{statusInfo[status]}</p>
        <CustomizedProgressBars progressValue={progressValue} />
      </div>
    );
  }
}
