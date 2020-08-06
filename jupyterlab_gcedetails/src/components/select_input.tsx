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
import ArrowDropDownIcon from '@material-ui/icons/ArrowDropDown';
import TextField from '@material-ui/core/TextField';
import MenuItem from '@material-ui/core/MenuItem';
import { Option, TEXT_STYLE, TEXT_LABEL_STYLE } from '../data';

interface Props {
  label?: string;
  name?: string;
  value?: string;
  options?: Option[];
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const STYLES = stylesheet({
  select: {
    display: 'block',
    marginTop: '4px',
  },
  icon: {
    right: '14px',
    position: 'absolute',
  },
});

const iconComponent = props => {
  return <ArrowDropDownIcon className={STYLES.icon} />;
};

export function SelectInput(props: Props) {
  const { label, name, value, options, onChange } = props;

  return (
    <div>
      {/* {label && <label>{label}</label>} */}
      <TextField
        InputLabelProps={{
          style: TEXT_LABEL_STYLE,
        }}
        label={label}
        className={STYLES.select}
        select
        value={value}
        margin="dense"
        fullWidth={true}
        variant="outlined"
        onChange={onChange}
        inputProps={{
          name: name,
        }}
        SelectProps={{
          IconComponent: iconComponent,
          MenuProps: {
            anchorOrigin: {
              vertical: 'bottom',
              horizontal: 'left',
            },
            transformOrigin: {
              vertical: 'top',
              horizontal: 'left',
            },
            getContentAnchorEl: null,
          },
        }}
        InputProps={{
          style: TEXT_STYLE,
        }}
      >
        {options &&
          options.map(option => (
            <MenuItem
              key={option.value}
              value={option.value}
              style={TEXT_STYLE}
            >
              {option.text}
            </MenuItem>
          ))}
      </TextField>
    </div>
  );
}
