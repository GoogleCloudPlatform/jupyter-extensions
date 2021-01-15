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

import * as csstips from 'csstips';
import * as React from 'react';
import { style } from 'typestyle';
import { FormControlLabel, withStyles } from '@material-ui/core';
import Checkbox, { CheckboxProps } from '@material-ui/core/Checkbox';
import CheckBoxOutlineBlankIcon from '@material-ui/icons/CheckBoxOutlineBlank';
import CheckBoxIcon from '@material-ui/icons/CheckBox';
import { INPUT_TEXT_STYLE, COLORS } from '../styles';

interface CheckboxInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

const containerStyle = style({
  ...csstips.horizontal,
  ...csstips.center,
  marginRight: 0,
});

const StyledLabel = withStyles({
  label: {
    ...INPUT_TEXT_STYLE,
    marginRight: '-6px',
  },
})(FormControlLabel);

const CustomColorCheckBox = withStyles({
  root: {
    padding: '5px',
    '&$checked': {
      color: COLORS.focus,
    },
  },
  checked: {},
})((props: CheckboxProps) => <Checkbox color="default" {...props} />);

/** Funtional Component for Checkbox input fields */
export function CheckboxInput(props: CheckboxInputProps) {
  const { label, checked, ...inputProps } = props;
  return (
    <div className={containerStyle}>
      <StyledLabel
        control={
          <CustomColorCheckBox
            inputProps={{ ...inputProps, checked }}
            icon={<CheckBoxOutlineBlankIcon fontSize="small" />}
            checkedIcon={<CheckBoxIcon fontSize="small" />}
            size="small"
            checked={checked}
            color="primary"
          />
        }
        label={label}
      />
    </div>
  );
}
