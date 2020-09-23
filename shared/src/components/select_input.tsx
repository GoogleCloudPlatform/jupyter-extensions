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
import TextField from '@material-ui/core/TextField';
import { stylesheet } from 'typestyle';
import MenuItem from '@material-ui/core/MenuItem';
import {INPUT_TEXT_STYLE} from '../styles';
import ArrowDropDownIcon from '@material-ui/icons/ArrowDropDown';

interface Option {
  text: string;
  value: string | number;
  disabled?: boolean;
}

export const STYLES = stylesheet({
  select: {
    display: 'block',
    marginTop: '5px',
    marginBottom: '5px',
  },
  icon: {
    right: '14px',
    position: 'absolute',
    cursor: 'pointer',
    pointerEvents: 'none',
  },
});

const iconComponent = props => {
  return <ArrowDropDownIcon className={STYLES.icon} />;
};

interface Props {
  label?: string;
  name?: string;
  value?: string;
  options?: Option[];
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}


export function SelectInput(props: Props) {
  const { label, name, value, options, onChange } = props;
  return (
    <div  className={STYLES.select}>
    <TextField 
      variant="outlined" 
      margin="dense"
      fullWidth={true}
      id={name} 
      label={label} 
      value={value} 
      onChange={onChange} 
      inputProps={{
        name: name,
      }}
      InputProps={{
        style: INPUT_TEXT_STYLE,
      }}
      InputLabelProps={{shrink:true}}
      SelectProps={{
        IconComponent: iconComponent,
        displayEmpty: true,
      }}
      select>
         {options &&
          options.map(option => (
            <MenuItem
              key={option.value}
              value={option.value}
              style={INPUT_TEXT_STYLE}
            >
              {option.text}
            </MenuItem>
          ))}
      </TextField>
      </div>
  );
}