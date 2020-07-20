/**
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import * as React from 'react';
import { stylesheet } from 'typestyle';
import Grid from '@material-ui/core/Grid';
import Slider from '@material-ui/core/Slider';
import { TextInput } from 'gcp_jupyterlab_shared';

interface InputSliderProps {
  value: number;
  possibleValues: number[];
  label?: string;
  handleSliderChange: (event: any, newValue: number) => void;
  inputDisplayValue: string;
  handleInputChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  handleInputBlur: () => void;
  helperText?: string;
}

export const STYLES = stylesheet({
  container: {
    minWidth: '450px',

    /**
     * Using overflow to deal with quirks of material-ui grid.
     * See: https://material-ui.com/components/grid/#negative-margin
     */
    overflowX: 'hidden',
    overflowY: 'hidden',
  },
  slider: {
    marginLeft: '10px',
  },
  label: {
    display: 'block',
    minWidth: '100px',
  },
});

export function InputSlider(props: InputSliderProps) {
  const {
    label,
    value,
    handleSliderChange,
    possibleValues,
    inputDisplayValue,
    handleInputChange,
    handleInputBlur,
    helperText,
  } = props;

  return (
    <div className={STYLES.container}>
      <label>{label}</label>
      <Grid container spacing={3} alignItems="center">
        <Grid item xs>
          <div className={STYLES.slider}>
            <Slider
              value={value}
              onChange={handleSliderChange}
              marks={possibleValues.map(value => ({ value }))}
              min={possibleValues[0]}
              max={possibleValues[possibleValues.length - 1]}
              step={null}
            />
          </div>
        </Grid>
        <Grid item>
          <TextInput
            value={inputDisplayValue}
            type="number"
            min={String(possibleValues[0])}
            max={String(possibleValues[possibleValues.length - 1])}
            step={1}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
          />
          {helperText && <label className={STYLES.label}>{helperText}</label>}
        </Grid>
      </Grid>
    </div>
  );
}
