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
import { Option } from '../../data';
import { css } from '../../styles';

interface SelectInputProps {
  label?: string;
  name?: string;
  value?: string;
  options?: Option[];
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
}

/** Funtional Component for select fields */
// tslint:disable-next-line:enforce-name-casing
export function SelectInput(props: SelectInputProps) {
  const { label, options, ...inputProps } = props;
  return (
    <div className={css.inputContainer}>
      {label && <label>{label}</label>}
      <select className={css.input} {...inputProps}>
        {options &&
          options.map((o, i) => (
            <option key={i} value={o.value}>
              {o.text}
            </option>
          ))}
      </select>
    </div>
  );
}
