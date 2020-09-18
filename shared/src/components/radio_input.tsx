import { FormControlLabel, Radio, RadioGroup } from '@material-ui/core';
import { createMuiTheme, ThemeProvider } from '@material-ui/core/styles';
import * as React from 'react';
import { COLORS, css } from '../styles';
import { Option } from '../utils';

interface RadioInputProps {
  name?: string;
  value?: string;
  options?: Option[];
  onChange?: (
    event: React.ChangeEvent<HTMLInputElement>,
    value: string
  ) => void;
}

const theme = createMuiTheme({
  overrides: {
    MuiRadio: {
      colorSecondary: {
        '&$checked': {
          color: COLORS.blue,
        },
      },
    },
    MuiFormControlLabel: {
      root: {
        marginBottom: '-5px',
        marginTop: '-10px',
      },
    },
    MuiTypography: {
      body1: {
        fontSize: '0.83rem',
      },
    },
  },
});

/** Funtional Component for Radio input fields */
export function RadioInput(props: RadioInputProps) {
  const { options, ...groupProps } = props;
  return (
    <ThemeProvider theme={theme}>
      <RadioGroup {...groupProps}>
        {options &&
          options.map((o, i) => (
            <FormControlLabel
              key={i}
              value={o.value}
              control={<Radio />}
              label={o.text}
              className={css.primaryTextColor}
            />
          ))}
      </RadioGroup>
    </ThemeProvider>
  );
}
