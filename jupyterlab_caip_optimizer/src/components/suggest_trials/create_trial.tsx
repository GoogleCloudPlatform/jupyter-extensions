import * as React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  FormControlLabel,
  Checkbox,
  Box,
} from '@material-ui/core';
import { prettifyStudyName } from '../../service/optimizer';
import { Loading } from '../misc/loading';
import { MetricInputs } from './metric_inputs';
import { useDispatch } from 'react-redux';
import { MetricsInputs } from '.';
import {
  metricSpecsToMetrics,
  clearMetrics,
  parameterSpecToInputsValues,
  parameterSpecToValidateInput,
  inputValuesToParameterList,
  metricsToMeasurement,
  flattenParameterSpecTree,
} from './utils';
import { StudyConfig, ParameterSpec, TrialState } from '../../types';
import { ErrorState } from '../../utils/use_error_state';
import {
  useErrorStateMap,
  ErrorStateMap,
  errorStateMapToValueObject,
} from '../../utils/use_error_state_map';
import { createTrial } from '../../store/studies';

interface BaseInput {
  id: string;
  label: string;
  input: ErrorState<string>;
  onChange: (value: string) => void;
}

const NumberInput: React.FC<BaseInput> = ({ id, label, input, onChange }) => {
  return (
    <TextField
      id={id}
      variant="outlined"
      label={label}
      type="number"
      fullWidth
      value={input.value}
      helperText={input.helperText}
      error={input.error}
      onChange={(event) => onChange(event.target.value)}
      inputProps={{
        'data-testid': 'numberInput',
      }}
    />
  );
};

const SelectionInput: React.FC<BaseInput & { validValues: string[] }> = ({
  id,
  label,
  input,
  onChange,
  validValues,
}) => {
  return (
    <FormControl variant="outlined" fullWidth>
      <InputLabel id={id}>{label}</InputLabel>
      <Select
        labelId={id}
        value={input.value}
        onChange={(event) => onChange(event.target.value as string)}
        label={label}
        // Needed for testing
        // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
        // @ts-ignore
        SelectDisplayProps={{ 'data-testid': 'selectionInput' }}
      >
        {validValues.map((value) => (
          <MenuItem key={value} value={value} data-testid={`${value}-menuItem`}>
            {value}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

/**
 * Creates inputs for the various types of parameters with error handling.
 * @param values The map of input values and errors.
 * @param onChange Change a particular input's value and error.
 * @param parameterSpecs The parameter specifications.
 */
function parameterSpecToInputs(
  values: ErrorStateMap<string>,
  onChange: (name: string, value: string) => void,
  parameterSpecs: ParameterSpec[]
) {
  return parameterSpecs.map((spec) => {
    const name = spec.parameter;
    const label = `"${name}" Parameter`;
    const input = values[name];
    let inputElement: JSX.Element;
    let children: JSX.Element[] = [];
    switch (spec.type) {
      case 'CATEGORICAL': {
        if (spec.childParameterSpecs) {
          const validChildren = spec.childParameterSpecs.filter(
            (child) =>
              !input.error &&
              child.parentCategoricalValues!.values.includes(input.value)
          );
          children = parameterSpecToInputs(values, onChange, validChildren);
        }

        inputElement = (
          <SelectionInput
            id={name}
            label={label}
            input={input}
            onChange={(value) => onChange(name, value)}
            validValues={spec.categoricalValueSpec.values}
          />
        );
        break;
      }
      case 'DISCRETE': {
        if (spec.childParameterSpecs) {
          const validChildren = spec.childParameterSpecs.filter(
            (child) =>
              !input.error &&
              child.parentDiscreteValues!.values.includes(
                parseFloat(input.value)
              )
          );
          children = parameterSpecToInputs(values, onChange, validChildren);
        }

        inputElement = (
          <SelectionInput
            id={name}
            label={label}
            input={input}
            onChange={(value) => onChange(name, value)}
            validValues={spec.discreteValueSpec.values.map((value) =>
              value.toString(10)
            )}
          />
        );
        break;
      }
      case 'INTEGER': {
        if (spec.childParameterSpecs) {
          const validChildren = spec.childParameterSpecs.filter(
            (child) =>
              !input.error &&
              child.parentIntValues!.values.includes(input.value)
          );
          children = parameterSpecToInputs(values, onChange, validChildren);
        }

        inputElement = (
          <NumberInput
            id={name}
            label={label}
            input={values[name]}
            onChange={(value) => onChange(name, value)}
          />
        );
        break;
      }
      case 'DOUBLE':
        inputElement = (
          <NumberInput
            id={name}
            key={name}
            label={label}
            input={values[name]}
            onChange={(value) => onChange(name, value)}
          />
        );
        break;
      default:
        return null;
    }
    return (
      <React.Fragment key={name}>
        <Box mt={2}>{inputElement}</Box>
        {children}
      </React.Fragment>
    );
  });
}

interface Props {
  studyName: string;
  studyConfig: StudyConfig;
  open?: boolean;
  onClose: () => void;
}

export const CreateTrial: React.FC<Props> = ({
  studyName,
  studyConfig,
  open = false,
  onClose,
}) => {
  const dispatch = useDispatch();
  const [metrics, setMetrics] = React.useState<MetricsInputs>(() =>
    metricSpecsToMetrics(studyConfig.metrics)
  );
  const [requested, setRequested] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const flattenParameterSpecs = React.useMemo(
    () => flattenParameterSpecTree(studyConfig.parameters),
    [studyConfig.parameters]
  );
  // Creates parameter default values of '' and setups input error handling
  // using the custom hook
  const [inputs, setInput] = useErrorStateMap(
    parameterSpecToInputsValues(flattenParameterSpecs),
    parameterSpecToValidateInput(flattenParameterSpecs)
  );

  const handleClose = () => {
    if (!loading) {
      setMetrics(clearMetrics(metrics));
      onClose();
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    if (requested) {
      await dispatch(
        createTrial({
          studyName,
          trial: {
            state: TrialState.REQUESTED,
            parameters: inputValuesToParameterList(
              errorStateMapToValueObject(inputs),
              studyConfig.parameters
            ),
            measurements: [],
          },
        })
      );
    } else {
      await dispatch(
        createTrial({
          studyName,
          trial: {
            state: TrialState.COMPLETED,
            parameters: inputValuesToParameterList(
              errorStateMapToValueObject(inputs),
              studyConfig.parameters
            ),
            finalMeasurement: metricsToMeasurement(metrics),
            measurements: [],
          },
        })
      );
    }
    setLoading(false);
    setMetrics(clearMetrics(metrics));
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      style={{ display: 'relative' }}
      data-testid="createTrialDialog"
    >
      <DialogTitle>
        Create Custom Trial for "{prettifyStudyName(studyName)}" Study
      </DialogTitle>
      <DialogContent>
        <DialogContentText>Add custom trial data.</DialogContentText>
        <FormControlLabel
          control={
            <Checkbox
              data-testid="requestedTrial"
              checked={requested}
              onChange={(event) => setRequested(event.target.checked)}
              color="primary"
            />
          }
          label="Request Trial"
        />
        {/* Parameter inputs */}
        <Typography component="h3">Parameters</Typography>
        {parameterSpecToInputs(inputs, setInput, studyConfig.parameters)}
        {!requested && (
          <>
            <Typography component="h3">Metrics</Typography>
            <MetricInputs
              metricSpecs={studyConfig.metrics}
              value={metrics}
              onChange={setMetrics}
            />
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button
          onClick={handleClose}
          color="primary"
          data-testid="createTrialDialogCancel"
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          color="primary"
          data-testid="createTrialButton"
        >
          Create
        </Button>
      </DialogActions>
      {/* Loading Spinner (position is absolute relative to container) */}
      {loading && <Loading />}
    </Dialog>
  );
};
