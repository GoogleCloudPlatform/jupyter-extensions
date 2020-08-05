import React from 'react';
import {
  TemporaryParameterDoubleMetadata,
  TemporaryParameterDiscreteMetadata,
  TemporaryParameterCategoricalMetadata,
  TemporaryParameterIntegerMetadata,
} from '.';
import { TextField, Grid } from '@material-ui/core';

type BaseInput<T> = {
  value: T;
  onChange?: (value: T) => void;
};

function change<T>(currentValue: T, set: (value: T) => void) {
  return (valueObj: Partial<T>) => {
    set({
      ...currentValue,
      ...valueObj,
    });
  };
}

export const ParameterNumberInput: React.FC<BaseInput<
  TemporaryParameterDoubleMetadata | TemporaryParameterIntegerMetadata
>> = ({ value, onChange }) => {
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
          value={value.minValue}
          onChange={event =>
            change(value, onChange)({ minValue: event.target.value })
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
          value={value.maxValue}
          onChange={event =>
            change(value, onChange)({ maxValue: event.target.value })
          }
        />
      </Grid>
    </>
  );
};

export const ParameterListInput: React.FC<BaseInput<
  TemporaryParameterDiscreteMetadata | TemporaryParameterCategoricalMetadata
>> = ({ value, onChange }) => {
  return (
    <Grid item xs={12}>
      <TextField
        id="parameterListValue"
        required
        variant="outlined"
        label="List of possible values (comma separated)"
        fullWidth
        value={value.valueList.join(',')}
        onChange={event =>
          onChange({ valueList: event.target.value.split(',') })
        }
      />
    </Grid>
  );
};
