import * as React from 'react';
import { Button } from '@material-ui/core';
import { ThemeProvider, createMuiTheme } from '@material-ui/core/styles';
import {
  BASE_FONT,
  COLORS,
  TextInput,
  SelectInput,
  Option,
  DialogComponent,
  RadioInput,
} from 'gcp_jupyterlab_shared';
import { stylesheet } from 'typestyle';

type SourceType = 'computer' | 'bigquery' | 'gcs' | 'dataframe';

interface Props {
  onClose: any;
}

interface State {
  from: SourceType;
  params: any;
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
    this.state = {
      from: 'computer',
      params: null,
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
        onSubmit={this.props.onClose}
      >
        <RadioInput
          value={this.state.from}
          options={SOURCES}
          onChange={event => {
            this.setState({ from: event.target.value as SourceType });
          }}
        />
        <div style={{ paddingTop: '16px' }}>{this.getDialogContent()}</div>
      </DialogComponent>
    );
  }

  buildFileSelector() {
    const fileSelector = document.createElement('input');
    fileSelector.setAttribute('type', 'file');
    fileSelector.setAttribute('multiple', 'multiple');
    return fileSelector;
  }

  private getDialogContent(): JSX.Element {
    const { from } = this.state;
    if (from === 'computer') {
      return (
        <div>
          <p className={localStyles.title}>Upload files from your computer</p>
          <input
            className={localStyles.input}
            id="button-file"
            multiple
            type="file"
            onChange={event => {
              this.setState({ params: event.target.files });
            }}
          />
          <label htmlFor="button-file">
            <ThemeProvider theme={theme}>
              <Button component="span">Select Files</Button>
            </ThemeProvider>
          </label>
        </div>
      );
    } else if (from === 'bigquery') {
      return (
        <div>
          <p className={localStyles.title}>Import data from BigQuery</p>
          <TextInput
            label="BigQuery URI"
            onChange={event => {
              this.setState({ params: event.target.value });
            }}
          />
        </div>
      );
    } else if (from === 'gcs') {
      return (
        <div>
          <p className={localStyles.title}>
            Import data from Google Cloud Storage
          </p>
          <TextInput
            label="Google Cloud Storage URI"
            onChange={event => {
              this.setState({ params: event.target.value });
            }}
          />
        </div>
      );
    } else if (from === 'dataframe') {
      return (
        <div>
          <p className={localStyles.title}>Select dataframe from kernel</p>
          <SelectInput />
        </div>
      );
    }
    return null;
  }
}
