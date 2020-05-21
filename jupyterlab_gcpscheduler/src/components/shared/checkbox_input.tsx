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

interface CheckboxInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

const containerStyle = style({
  ...csstips.horizontal,
  ...csstips.center,
});

/** Funtional Component for Checkbox input fields */
export function CheckboxInput(props: CheckboxInputProps) {
  const { label, ...inputProps } = props;
  return (
    <div className={containerStyle}>
      <input type="checkbox" {...inputProps} />
      {label && <span>{label}</span>}
    </div>
  );
}
