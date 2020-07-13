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
  SelectInput,
  TextInput,
} from 'gcp_jupyterlab_shared';
import * as React from 'react';
import { stylesheet } from 'typestyle';
import { DatasetService } from '../service/dataset';
import Toast from './toast';

type SourceType = 'computer' | 'bigquery' | 'gcs' | 'dataframe';

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface State {
  from: SourceType;
  source: any;
  name: string;
  error: string | null;
  loading: boolean;
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
    };
  }

  private async submit() {
    this.setState({ loading: true });
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
          break;
        default:
      }
      this.setState({ error: null });
      this.props.onSuccess();
    } catch (err) {
      console.warn(err);
      this.setState({
        error: 'There was an error creating the dataset: ' + err,
      });
    } finally {
      this.setState({ loading: false });
      if (!this.state.error) {
        this.props.onClose();
      }
    }
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
      return <SelectInput />;
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
        {this.props.open && (
          <DialogComponent
            header={'Import Data'}
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
