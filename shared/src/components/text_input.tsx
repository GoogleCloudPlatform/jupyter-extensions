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
import { classes } from 'typestyle';
import {INPUT_TEXT_STYLE} from '../styles';
import TextField from '@material-ui/core/TextField';

interface TextInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  disabled?: boolean;
  type?: string;
  min?: string;
  max?: string;
  step?: number;
  label?: string;
  name?: string;
  value?: string;
  placeholder?: string;
  hasError?: boolean;
}

/** Funtional Component for text input fields */
// tslint:disable-next-line:enforce-name-casing
export function TextInput(props: TextInputProps) {
  const { label, hasError, value, ...inputProps } = props;

  return (
    <TextField className={classes(
          hasError && 'error'
        )}
        variant="outlined"
        margin="dense"
        fullWidth={true}
        label={label}
        inputProps={{
          style: INPUT_TEXT_STYLE,
          value,
          ...inputProps}}
        InputProps={{
          style: INPUT_TEXT_STYLE,
        }}
      >
    </TextField>
  );
}
