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
import { FieldError } from './field_error';

interface CheckValidationProps {
  min?: number;
  max?: number;
  required: boolean;
  fieldName: string;
  value: string;
}

export function CheckValidation(props: CheckValidationProps) {
  const { min, max, required, fieldName, value } = props;
  let message = '';
  if (required && !value) {
    message = fieldName.trim() + ' is required.';
  } else {
    const cvalue = Number(value);
    if (max !== undefined && min !== undefined) {
      if (!(cvalue >= min && cvalue <= max)) {
        message += fieldName.trim() + ' range is [' + min + '-' + max + ']';
      }
    } else if (min !== undefined) {
      if (cvalue < min) {
        message += fieldName.trim() + ' must be greater than ' + min;
      }
    } else if (max !== undefined) {
      if (cvalue > max) {
        message += fieldName.trim() + ' must be less than ' + max;
      }
    }
  }
  if (message === '') {
    return <React.Fragment></React.Fragment>;
  } else {
    return <FieldError message={message} />;
  }
}
