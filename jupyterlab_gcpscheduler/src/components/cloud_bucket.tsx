import React from 'react';
import TextField from '@material-ui/core/TextField';
import Autocomplete, {
  createFilterOptions,
} from '@material-ui/lab/Autocomplete';
import { withStyles } from '@material-ui/core';
import {
  INPUT_TEXT_STYLE,
  FORM_LABEL_STYLE,
  ALIGN_HINT,
  FieldError,
} from 'gcp_jupyterlab_shared';
import IconButton from '@material-ui/core/IconButton';
import CloseIcon from '@material-ui/icons/Close';
import Snackbar from '@material-ui/core/Snackbar';
import { GcpService } from '../service/gcp';
import { Bucket } from '../interfaces';
import FormHelperText from '@material-ui/core/FormHelperText';
const NO_BUCKET_SELECTION = 'Not selected';

interface Props {
  gcpService: GcpService;
  gcsBucket?: string;
  onGcsBucketChange: (newBucketName: string) => void;
}

export interface BucketOption extends Bucket {
  inputValue?: string;
}

interface State {
  value: BucketOption | null;
  isLoading: boolean;
  validBucketOptions: BucketOption[];
  invalidBucketOptions: BucketOption[];
  error?: string;
  openSnackbar: boolean;
}

const StyledAutoComplete = withStyles({
  option: {
    ...INPUT_TEXT_STYLE,
  },
  input: {
    ...INPUT_TEXT_STYLE,
  },
  inputRoot: {
    ...INPUT_TEXT_STYLE,
  },
})(Autocomplete);

const filter = createFilterOptions<BucketOption | null>();

export class CloudBucketSelector extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      value: null,
      isLoading: false,
      validBucketOptions: [],
      invalidBucketOptions: [],
      openSnackbar: false,
    };
    this.handleSnackbarClose = this.handleSnackbarClose.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.handleFilterOptions = this.handleFilterOptions.bind(this);
    this.handleGetOptionLabel = this.handleGetOptionLabel.bind(this);
  }

  async componentDidMount() {
    this._getBuckets(this.props.gcsBucket);
  }

  handleSnackbarClose() {
    this.setState({ openSnackbar: false });
  }

  handleChange(event, newValue: BucketOption | string, reason: string) {
    if (reason === 'create-option' || reason === 'select-option') {
      this.setValue(newValue);
    } else if (reason === 'remove-option' || reason === 'clear') {
      this.setValue(null);
    }
  }

  handleFilterOptions(options: BucketOption[], params) {
    const filtered = filter(options, params);
    // Suggest the creation of a new value
    if (params.inputValue !== '') {
      filtered.push({
        inputValue: params.inputValue,
        name: `Create and select "${params.inputValue}"`,
        accessLevel: 'uniform',
      });
    }
    return filtered;
  }

  handleGetOptionLabel(option: string | BucketOption) {
    // Value selected with enter, right from the input
    if (typeof option === 'string') {
      return option;
    }
    // Add "xxx" option created dynamically
    if ((option as BucketOption).inputValue) {
      return (option as BucketOption).inputValue;
    }
    // Regular option
    return (option as BucketOption).name;
  }

  render() {
    return (
      <StyledAutoComplete
        value={this.state.value}
        onChange={this.handleChange}
        filterOptions={this.handleFilterOptions}
        selectOnFocus
        clearOnBlur
        handleHomeEndKeys
        id="cloud-bucket-with-create-option"
        options={this.state.validBucketOptions}
        getOptionLabel={this.handleGetOptionLabel}
        noOptionsText={NO_BUCKET_SELECTION}
        renderOption={option => (option as BucketOption).name}
        freeSolo
        size="small"
        loading={this.state.isLoading}
        renderInput={params => (
          <React.Fragment>
            <TextField
              {...params}
              name="gcsBucket"
              variant="outlined"
              margin="dense"
              placeholder={NO_BUCKET_SELECTION}
              label="Cloud Storage bucket"
              fullWidth={true}
              InputLabelProps={{ shrink: true, style: FORM_LABEL_STYLE }}
              error={this.state.error !== undefined}
            />
            {!this.state.error && (
              <FormHelperText style={ALIGN_HINT}>
                Select an existing bucket or create a new one to store results
              </FormHelperText>
            )}
            <FieldError message={this.state.error} />
            <Snackbar
              open={this.state.openSnackbar}
              onClose={this.handleSnackbarClose}
              autoHideDuration={6000}
              message="Created bucket successfully"
              action={
                <IconButton
                  size="small"
                  aria-label="close"
                  color="inherit"
                  onClick={this.handleSnackbarClose}
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              }
            />
          </React.Fragment>
        )}
      />
    );
  }

  private async _getBuckets(selectedBucketName?: string) {
    try {
      this.setState({ isLoading: true, error: undefined });
      const buckets = await this.props.gcpService.listBuckets();
      const validBucketOptions = buckets.buckets.filter(
        bucket => bucket.accessLevel === 'uniform'
      );
      const value =
        validBucketOptions.find(bucket => selectedBucketName === bucket.name) ||
        null;
      this.setState({
        isLoading: false,
        validBucketOptions,
        invalidBucketOptions: buckets.buckets.filter(
          bucket => bucket.accessLevel !== 'uniform'
        ),
        value,
      });
      this.props.onGcsBucketChange(value ? value.name : null);
    } catch (err) {
      this.setState({
        isLoading: false,
        error: `Unable to retrieve Buckets: ${err}`,
      });
      this.props.onGcsBucketChange(null);
    }
  }

  private async createAndSelectBucket(bucketName: string) {
    try {
      const fineGrain = this.state.invalidBucketOptions.find(
        bucket => bucket.name === bucketName
      );
      if (!fineGrain) {
        await this.props.gcpService.createUniformAccessBucket(bucketName);
        this.props.onGcsBucketChange(bucketName);
        this._getBuckets(bucketName);
        this.setState({ openSnackbar: true });
        return;
      }
      this.setState({
        value: null,
        error:
          'A bucket with incompatible access controls already exists with that name',
      });
      this.props.onGcsBucketChange(null);
    } catch (err) {
      this.setState({ value: null, error: `${err}` });
      this.props.onGcsBucketChange(null);
    }
  }

  private setValue(newValue: BucketOption | string) {
    this.setState({ error: undefined });
    if (!newValue) {
      this.setState({
        value: null,
        error: 'A bucket is required to store results',
      });
      this.props.onGcsBucketChange(null);
      return;
    } else if (typeof newValue === 'string') {
      const existingBucket = this.state.validBucketOptions.find(
        bucket => bucket.name === newValue
      );
      if (!existingBucket) {
        this.createAndSelectBucket(newValue);
      } else {
        this.setState({ value: existingBucket });
        this.props.onGcsBucketChange(newValue);
      }
    } else {
      const newBucketName = newValue.inputValue;
      if (newBucketName) {
        this.createAndSelectBucket(newBucketName);
      } else {
        this.setState({ value: newValue });
        this.props.onGcsBucketChange(newValue.name);
      }
    }
  }
}
