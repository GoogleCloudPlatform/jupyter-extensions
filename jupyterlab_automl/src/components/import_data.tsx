import { LinearProgress, FormControl, FormHelperText } from '@material-ui/core';
//import { ThemeProvider, createMuiTheme } from '@material-ui/core/styles';
import {
  BASE_FONT,
  DialogComponent,
  Option,
  RadioInput,
  SelectInput,
  TextInput,
} from 'gcp_jupyterlab_shared';
import * as React from 'react';
import { stylesheet } from 'typestyle';
import { DatasetService } from '../service/dataset';

type SourceType = 'computer' | 'bigquery' | 'gcs' | 'dataframe';

interface Props {
  onClose: any;
}

interface State {
  from: SourceType;
  params: any;
  name: string;
  error: string | null;
  loading: boolean;
}

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
      params: null,
      name: '',
      error: null,
      loading: false,
    };
  }

  render() {
    return (
      <DialogComponent
        header={'Import Data'}
        open={true}
        onClose={this.props.onClose}
        onCancel={this.props.onClose}
        submitLabel={'Import Data'}
        onSubmit={this.submit}
      >
        <RadioInput
          value={this.state.from}
          options={SOURCES}
          onChange={event => {
            this.setState({ from: event.target.value as SourceType });
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
            {this.state.error ? (
              <FormHelperText>{this.state.error}</FormHelperText>
            ) : (
              <></>
            )}
            {this.state.loading && <LinearProgress />}
          </FormControl>
        </div>
      </DialogComponent>
    );
  }

  private async submit() {
    if (this.state.loading) return;
    this.setState({ loading: true });
    try {
      switch (this.state.from) {
        case 'gcs':
          await DatasetService.createTablesDataset(
            this.state.name,
            this.state.params,
            null
          );
          break;
        case 'bigquery':
          await DatasetService.createTablesDataset(
            this.state.name,
            null,
            this.state.params
          );
          break;
        case 'computer':
          break;
        case 'dataframe':
          break;
        default:
      }
    } catch (err) {
      console.log(err);
      // TODO (Shun): Handle error and show message in dialog
    } finally {
      this.setState({ loading: false });
    }

    this.props.onClose();
  }

  private getDialogContent(): JSX.Element {
    const { from } = this.state;
    if (from === 'computer') {
      return (
        <input
          //className={localStyles.input}
          type="file"
          onChange={event => {
            this.setState({ params: event.target.files });
          }}
        />
      );
    } else if (from === 'bigquery') {
      return (
        <TextInput
          placeholder="bq://"
          label="BigQuery URI"
          onChange={event => {
            this.setState({ params: event.target.value });
          }}
        />
      );
    } else if (from === 'gcs') {
      return (
        <TextInput
          placeholder="gs://"
          label="Google Cloud Storage URI"
          onChange={event => {
            this.setState({ params: event.target.value });
          }}
        />
      );
    } else if (from === 'dataframe') {
      return <SelectInput />;
    }
    return null;
  }
}
