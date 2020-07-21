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
} from '@material-ui/core';
import { prettifyStudyName } from '../../service/optimizer';
import { Loading } from './loading';
import { MetricInputs } from './metric_inputs';
import { useDispatch } from 'react-redux';
import { MetricsInputs } from '.';
import {
  metricSpecsToMetrics,
  clearMetrics,
  parameterSpecToInputsValues,
  parameterSpecToValidateInput,
  inputValuesToParameterList,
} from './utils';
import { StudyConfig, ParameterSpec, State } from '../../types';
import { ErrorState } from '../../utils/use_error_state';
import {
  useErrorStateMap,
  ErrorStateMap,
  errorStateMapToValueObject,
} from '../../utils/use_error_state_map';
import { createTrial } from '../../store/studies';

interface BaseInput {
  label: string;
  input: ErrorState<string>;
  onChange: (value: string) => void;
}

const NumberInput: React.FC<BaseInput> = ({ label, input, onChange }) => {
  return (
    <TextField
      margin="dense"
      variant="outlined"
      label={label}
      type="number"
      fullWidth
      value={input.value}
      helperText={input.helperText}
      error={input.error}
      onChange={event => onChange(event.target.value)}
      inputProps={{
        'data-testid': 'numberInput',
      }}
    />
  );
};

const SelectionInput: React.FC<BaseInput & { validValues: string[] }> = ({
  label,
  input,
  onChange,
  validValues,
}) => {
  return (
    <FormControl variant="outlined">
      <InputLabel id={label}>{label}</InputLabel>
      <Select
        labelId={label}
        value={input.value}
        onChange={event => onChange(event.target.value as string)}
        label={label}
        // Needed for testing
        // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
        // @ts-ignore
        SelectDisplayProps={{ 'data-testid': 'selectionInput' }}
      >
        {validValues.map(value => (
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
  return parameterSpecs.map(spec => {
    const name = spec.parameter;
    const label = `"${name}" Parameter`;
    switch (spec.type) {
      case 'CATEGORICAL':
        return (
          <SelectionInput
            label={label}
            input={values[name]}
            onChange={value => onChange(name, value)}
            // TODO: fix typing
            validValues={(spec as any).categoricalValueSpec.values as string[]}
          />
        );
      case 'DISCRETE':
        return (
          <SelectionInput
            label={label}
            input={values[name]}
            onChange={value => onChange(name, value)}
            // TODO: fix typing
            validValues={((spec as any).discreteValueSpec
              .values as number[]).map(value => value.toString(10))}
          />
        );
      case 'DOUBLE':
      case 'INTEGER':
        return (
          <NumberInput
            label={label}
            input={values[name]}
            onChange={value => onChange(name, value)}
          />
        );
      default:
        return null;
    }
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
  const [loading, setLoading] = React.useState(false);
  // Creates parameter default values of '' and setups input error handling
  // using the custom hook
  const [map, setInput] = useErrorStateMap(
    parameterSpecToInputsValues(studyConfig.parameters),
    parameterSpecToValidateInput(studyConfig.parameters)
  );

  const handleClose = () => {
    if (!loading) {
      setMetrics(clearMetrics(metrics));
      close();
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    dispatch(
      createTrial({
        studyName,
        trial: {
          state: State.COMPLETED,
          parameters: inputValuesToParameterList(
            errorStateMapToValueObject(map),
            studyConfig.parameters
          ),
          measurements: [],
        },
      })
    );
    setLoading(false);
    // setMetrics(clearMetrics(metrics));
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
        {/* Parameter inputs */}
        {parameterSpecToInputs(map, setInput, studyConfig.parameters)}
        <MetricInputs
          metricSpecs={studyConfig.metrics}
          value={metrics}
          onChange={setMetrics}
        />
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
