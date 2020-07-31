import {
  FormControl,
  FormHelperText,
  Button,
  Portal,
  CircularProgress,
} from '@material-ui/core';
import { ThemeProvider, createMuiTheme } from '@material-ui/core/styles';
import {
  BASE_FONT,
  COLORS,
  DialogComponent,
  Option,
  RadioInput,
  TextInput,
  SelectInput,
} from 'gcp_jupyterlab_shared';
import * as React from 'react';
import { stylesheet } from 'typestyle';
import { DatasetService } from '../service/dataset';
import { Context } from './automl_widget';
import { ClientSession } from '@jupyterlab/apputils';
import { KernelModel } from '../service/kernel_model';
import Toast from './toast';

type SourceType = 'computer' | 'bigquery' | 'gcs' | 'dataframe';

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  context: Context;
}

interface State {
  from: SourceType;
  source: any;
  name: string;
  error: string | null;
  loading: boolean;
  sessions: Option[];
  // TODO @josiegarza make this a part of source
  kernelId: string;
  errorOpen: boolean;
}

const theme = createMuiTheme({
  overrides: {
    MuiButton: {
      root: {
        backgroundColor: COLORS.blue,
        borderRadius: '2px',
        lineHeight: 1.7,
        '&:hover': {
          backgroundColor: COLORS.blue,
        },
      },
      text: {
        padding: '1px 16px',
      },
      label: {
        textTransform: 'capitalize',
        color: COLORS.white,
      },
    },
  },
});

const localStyles = stylesheet({
  title: {
    ...BASE_FONT,
    fontWeight: 500,
    fontSize: '15px',
    marginBottom: '16px',
  },
  input: {
    display: 'none',
  },
  form: {
    width: '100%',
  },
  fileInput: {
    paddingBottom: 8,
  },
});

const SOURCES: Option[] = [
  {
    value: 'computer',
    text: 'Upload files from your computer',
  },
  {
    value: 'bigquery',
    text: 'Import data from BigQuery',
  },
  {
    value: 'gcs',
    text: 'Import data from Google Cloud Storage',
  },
  {
    value: 'dataframe',
    text: 'Select dataframe from kernel',
  },
];

export class ImportData extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.submit = this.submit.bind(this);
    this.state = {
      from: 'computer',
      source: null,
      name: '',
      error: null,
      loading: false,
      sessions: null,
      kernelId: null,
      errorOpen: false,
    };
  }

  private async submit() {
    this.setState({ loading: true });
    this.props.onClose();
    try {
      switch (this.state.from) {
        case 'gcs':
          await DatasetService.createTablesDataset(this.state.name, {
            gcsSource: this.state.source,
          });
          break;
        case 'bigquery':
          await DatasetService.createTablesDataset(this.state.name, {
            bigquerySource: this.state.source,
          });
          break;
        case 'computer':
          await DatasetService.createTablesDataset(this.state.name, {
            fileSource: this.state.source[0],
          });
          break;
        case 'dataframe':
          this.initializeSession(this.state.kernelId);
          break;
        default:
      }
      this.setState({ error: null });
    } catch (err) {
      console.warn(err);
      this.setState({
        error: 'There was an error creating the dataset: ' + err,
      });
    } finally {
      if (this.state.from !== 'dataframe') {
        this.setState({ loading: false });
        if (!this.state.error) {
          this.props.onSuccess();
        }
      }
    }
  }

  private getSessions() {
    const manager = this.props.context.app.serviceManager;
    const running = manager.sessions.running();
    const sessions: Option[] = [];
    let current = running.next();
    this.setState({ kernelId: current['kernel']['id'] });
    while (current) {
      if (current.name !== '') {
        sessions.push({
          text: current['name'],
          value: current['kernel']['id'],
        });
      }
      current = running.next();
    }
    this.setState({ sessions: sessions });
  }

  private initializeSession(kernelId: string) {
    const manager = this.props.context.app.serviceManager;
    const kernelPreference = {
      id: kernelId,
    };
    const session = new ClientSession({
      manager: manager.sessions,
      kernelPreference: kernelPreference,
    });
    session
      .initialize()
      .catch(reason => {
        console.error(`Failed to initialize the session.\n${reason}`);
      })
      .then(() => {
        this.createKernelModel(session);
      });
  }

  private createKernelModel(session: ClientSession) {
    const model = new KernelModel(
      session,
      () => {
        this.props.onSuccess();
        this.setState({ loading: false });
      },
      error => {
        this.setState({ error: error, loading: false, errorOpen: true });
      }
    );
    model.receivedSuccess.connect(this.refresh);
    model.receivedError.connect(this.uploadDataFrameError);
    model.createCSV(this.state.name, this.state.source);
  }

  private refresh(emitter: KernelModel) {
    emitter.refresh();
  }

  private uploadDataFrameError(emitter: KernelModel, title: string) {
    const error =
      title +
      ': ' +
      emitter.output +
      '. Make sure the variable you entered is a pandas dataframe.';
    emitter.onError(error);
  }

  private validateGCS(source: string) {
    const regex = new RegExp('gs://.+/(.+/)*.+');
    if (regex.test(source)) {
      this.setState({ error: null });
    } else {
      this.setState({ error: 'Invalid GCS uri' });
    }
  }

  private validateBigQuery(source: string) {
    const regex = new RegExp(
      'bq://[a-zA-Z0-9_-]+:[a-zA-Z0-9_-]+.[a-zA-Z0-9_-]+'
    );
    if (regex.test(source)) {
      this.setState({ error: null });
    } else {
      this.setState({ error: 'Invalid BigQuery uri' });
    }
  }

  private getDialogContent(): JSX.Element {
    const { from } = this.state;
    if (from === 'computer') {
      return (
        <>
          <input
            className={localStyles.input}
            type="file"
            accept=".csv"
            onChange={event => {
              this.setState({ source: event.target.files, error: null });
            }}
            id="ucaip-upload-dataset"
          />
          <label
            htmlFor="ucaip-upload-dataset"
            className={localStyles.fileInput}
          >
            <ThemeProvider theme={theme}>
              <Button component="span">Select file</Button>
            </ThemeProvider>
            <label style={{ marginLeft: 8 }}>
              {this.state.source
                ? this.state.source[0].name
                : 'No file selected'}
            </label>
          </label>
        </>
      );
    } else if (from === 'bigquery') {
      return (
        <TextInput
          placeholder="bq://example:abc.xyz"
          label="BigQuery URI"
          onChange={event => {
            const source = event.target.value;
            this.validateBigQuery(source);
            this.setState({ source: source });
          }}
        />
      );
    } else if (from === 'gcs') {
      return (
        <TextInput
          placeholder="gs://example/file"
          label="Google Cloud Storage URI"
          onChange={event => {
            const source = event.target.value;
            this.validateGCS(source);
            this.setState({ source: source });
          }}
        />
      );
    } else if (from === 'dataframe') {
      return (
        <>
          <SelectInput
            label={'Select file'}
            options={this.state.sessions}
            onChange={event => {
              this.setState({ kernelId: event.target.value });
            }}
          />
          <TextInput
            placeholder="df"
            label="Dataframe variable from selected kernel"
            onChange={event => {
              const source = event.target.value;
              this.setState({ source: source });
            }}
          />
        </>
      );
    }
    return null;
  }

  render() {
    return (
      <>
        <Portal>
          <Toast
            open={this.state.loading}
            message={'Creating dataset...'}
            onClose={() => {
              this.setState({ loading: false });
            }}
          >
            <CircularProgress size={24}></CircularProgress>
          </Toast>
        </Portal>
        <Portal>
          <Toast
            open={this.state.errorOpen}
            onClose={() => {
              this.setState({ errorOpen: false });
              this.setState({ error: null });
            }}
            error={true}
            autoHideDuration={6000}
          >
            {this.state.error}
          </Toast>
        </Portal>
        {this.props.open && (
          <DialogComponent
            header={'Import Data to Tables Dataset'}
            open={true}
            onClose={this.props.onClose}
            onCancel={this.props.onClose}
            submitLabel={'Import Data'}
            onSubmit={this.submit}
            submitDisabled={
              this.state.loading ||
              this.state.error !== null ||
              !this.state.name ||
              !this.state.source
            }
          >
            <RadioInput
              value={this.state.from}
              options={SOURCES}
              onChange={event => {
                this.setState({
                  from: event.target.value as SourceType,
                  source: null,
                  error: null,
                });
                if (event.target.value === 'dataframe') {
                  this.getSessions();
                }
              }}
            />
            <div style={{ paddingTop: '16px' }}>
              <FormControl
                error={this.state.error !== null}
                className={localStyles.form}
              >
                <p className={localStyles.title}>
                  {
                    SOURCES.filter(el => {
                      return el.value === this.state.from;
                    })[0].text
                  }
                </p>
                <TextInput
                  placeholder="my_dataset"
                  label="Name"
                  onChange={event => {
                    this.setState({ name: event.target.value });
                  }}
                />
                {this.getDialogContent()}
                {this.state.error && (
                  <FormHelperText>{this.state.error}</FormHelperText>
                )}
              </FormControl>
            </div>
          </DialogComponent>
        )}
      </>
    );
  }
}
