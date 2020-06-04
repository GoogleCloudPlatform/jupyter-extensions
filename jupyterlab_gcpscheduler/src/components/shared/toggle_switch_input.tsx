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

import { Switch, FormControlLabel, withStyles } from '@material-ui/core';
import * as React from 'react';

import { COLORS } from '../../styles';

interface LabelProps {
  label?: string;
  name?: string;
  checked?: boolean;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const StyledLabel = withStyles({
  label: {
    fontSize: '13px',
  },
})(FormControlLabel);

const StyledSwitch = withStyles({
  iconChecked: {
    color: COLORS.blue,
  },
  checked: {
    '& + $bar': {
      backgroundColor: COLORS.blue,
    },
  },
  bar: {},
})(Switch);

/** Material style toggle switch */
export function ToggleSwitch(props: LabelProps) {
  const { name, checked, label, onChange } = props;
  return (
    <StyledLabel
      control={
        <StyledSwitch
          checked={checked}
          onChange={onChange}
          name={name}
          color="default"
        />
      }
      label={label}
    />
  );
}
