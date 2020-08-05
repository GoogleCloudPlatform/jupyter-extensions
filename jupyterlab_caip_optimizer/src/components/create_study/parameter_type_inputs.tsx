import React from 'react';
import {
  TemporaryParameterDoubleMetadata,
  TemporaryParameterDiscreteMetadata,
  TemporaryParameterCategoricalMetadata,
  TemporaryParameterIntegerMetadata,
  TemporaryParameterChildMetadata,
  TemporaryParentParameter,
} from './types';
import {
  TextField,
  Grid,
  FormControlLabel,
  Checkbox,
  Typography,
} from '@material-ui/core';
import { Autocomplete } from '@material-ui/lab';
import { getOptions } from './utils';

function change<T>(currentValue: T, set: (value: T) => void) {
  return (valueObj: Partial<T>) => {
    set({
      ...currentValue,
      ...valueObj,
    });
  };
}

const defaultOption = 'None';

export const ParameterParentInput: React.FC<{
  parentParameters: TemporaryParentParameter[];
  metadata?: TemporaryParameterChildMetadata;
  onChange: (metadata: TemporaryParameterChildMetadata) => void;
}> = ({ parentParameters, metadata, onChange }) => {
  // TODO: not working all the time
  // Default to true if there is parent metadata
  const [editing, setEditing] = React.useState(!!metadata);
  const parent: TemporaryParentParameter | undefined = metadata
    ? parentParameters.find(parameter => parameter.name === metadata.name)
    : undefined;

  const options: (string | TemporaryParentParameter)[] = [
    defaultOption,
    ...parentParameters,
  ];

  return (
    <>
      <Grid item xs={12}>
        <FormControlLabel
          control={
            <Checkbox
              id="isConditional"
              name="isConditional"
              checked={editing}
              onChange={event => setEditing(event.target.checked)}
            />
          }
          label="This is a conditional (child) parameter"
          disabled={parentParameters.length === 0}
        />
      </Grid>
      {editing && (
        <>
          <Grid item xs={12}>
            <Autocomplete
              id="parentParameter"
              options={options}
              getOptionLabel={(parameter: string | TemporaryParentParameter) =>
                typeof parameter === 'string' ? parameter : parameter.name
              }
              // for testing
              renderOption={(parameter: string | TemporaryParentParameter) => {
                const option =
                  typeof parameter === 'string' ? parameter : parameter.name;
                return (
                  <Typography noWrap data-testid={`parent-${option}`}>
                    {option}
                  </Typography>
                );
              }}
              fullWidth
              renderInput={params => (
                <TextField
                  {...params}
                  label="Parent Parameter"
                  variant="outlined"
                />
              )}
              onChange={(
                event,
                newValue: string | TemporaryParentParameter
              ) => {
                // if it is the default value do not set the parent
                if (typeof newValue === 'string') {
                  onChange(undefined);
                } else {
                  onChange({
                    name: newValue.name,
                    validFor: [],
                  });
                }
              }}
              {...(parent ? { value: parent } : { value: defaultOption })}
            />
          </Grid>
          {!!parent && (
            <Grid item xs={12}>
              <Autocomplete
                multiple
                id="parentSelect"
                options={getOptions(parent)}
                getOptionLabel={option => option}
                // for testing
                renderOption={option => (
                  <Typography noWrap data-testid={`parentValue-${option}`}>
                    {option}
                  </Typography>
                )}
                value={metadata.validFor}
                filterSelectedOptions
                renderInput={params => (
                  <TextField
                    {...params}
                    variant="outlined"
                    label="Parent Values"
                    placeholder="Valid For"
                  />
                )}
                onChange={(event, nextValue) =>
                  onChange({
                    ...metadata,
                    validFor: nextValue,
                  })
                }
              />
            </Grid>
          )}
        </>
      )}
    </>
  );
};

type ParentBaseInput<T> = {
  metadata: T;
  onChange: (metadata: T) => void;
  parentParameters: TemporaryParentParameter[];
  parentMetadata: TemporaryParameterChildMetadata;
  onChangeParentMetadata: (
    parentMetadata: TemporaryParameterChildMetadata
  ) => void;
};

export const ParameterNumberInput: React.FC<ParentBaseInput<
  TemporaryParameterIntegerMetadata | TemporaryParameterDoubleMetadata
>> = ({
  metadata,
  onChange,
  parentParameters,
  parentMetadata,
  onChangeParentMetadata,
}) => {
  return (
    <>
      {/* NOTE: this continues to use the grid layout from parameter list */}
      <Grid item xs={12}>
        <TextField
          id="parameterMinValue"
          required
          variant="outlined"
          label="Min Value"
          fullWidth
          value={metadata.minValue}
          onChange={event =>
            change(metadata, onChange)({ minValue: event.target.value })
          }
        />
      </Grid>
      <Grid item xs={12}>
        <TextField
          id="parameterMaxValue"
          required
          variant="outlined"
          label="Max Value"
          fullWidth
          value={metadata.maxValue}
          onChange={event =>
            change(metadata, onChange)({ maxValue: event.target.value })
          }
        />
      </Grid>
      <ParameterParentInput
        parentParameters={parentParameters}
        metadata={parentMetadata}
        onChange={onChangeParentMetadata}
      />
    </>
  );
};

export const ParameterListInput: React.FC<ParentBaseInput<
  TemporaryParameterDiscreteMetadata | TemporaryParameterCategoricalMetadata
>> = ({
  metadata,
  onChange,
  parentParameters,
  parentMetadata,
  onChangeParentMetadata,
}) => {
  return (
    <>
      <Grid item xs={12}>
        <TextField
          id="parameterListValue"
          required
          variant="outlined"
          label="List of possible values (comma separated)"
          fullWidth
          value={metadata.valueList.join(',')}
          onChange={event =>
            onChange({ valueList: event.target.value.split(',') })
          }
        />
      </Grid>
      <ParameterParentInput
        parentParameters={parentParameters}
        metadata={parentMetadata}
        onChange={onChangeParentMetadata}
      />
    </>
  );
};
