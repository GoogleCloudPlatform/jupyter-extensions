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
import { Chip } from '@material-ui/core';
import { withStyles } from '@material-ui/core';
import { COLORS, BASE_FONT } from '../styles';

interface BadgeProps {
  value?: string;
}

const StyledChip = withStyles({
  root: {
    color: COLORS.white,
    backgroundColor: COLORS.inverse,
    borderRadius: 0,
    fontFamily: BASE_FONT.fontFamily as string,
    fontSize: 10,
    fontWeight: 100,
    paddingLeft: 1,
    paddingRight: 1,
    marginLeft: 4,
    marginRight: 4,
  },
})(Chip);

/** Funtional Component for select fields */
// tslint:disable-next-line:enforce-name-casing
export function Badge(props: BadgeProps) {
  const { value } = props;
  return value ? <StyledChip size="small" label={value.toUpperCase()} /> : null;
}
