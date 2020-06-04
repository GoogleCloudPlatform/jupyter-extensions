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
import { style } from 'typestyle';

import { COLORS } from '../../styles';

interface FieldErrorProps {
  message?: string;
}

const error = style({
  color: COLORS.red,
  paddingBottom: '10px',
});

/** Funtional Component for select fields */
// tslint:disable-next-line:enforce-name-casing
export function FieldError(props: FieldErrorProps) {
  const { message } = props;
  return message ? <div className={error}>{message}</div> : null;
}
