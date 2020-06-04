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

import { withStyles } from '@material-ui/core';
import { Check, Close, Refresh, Info } from '@material-ui/icons';

import { COLORS } from '../../styles';

/** Green check icon */
export const GreenCheck = withStyles({
  root: {
    color: COLORS.green,
    fontSize: '16px',
  },
})(Check);

/** Red 'X' icon */
export const RedClose = withStyles({
  root: {
    color: COLORS.red,
    fontSize: '16px',
  },
})(Close);

/** Gray pending icon */
export const GrayPending = withStyles({
  root: {
    color: COLORS.base,
    fontSize: '16px',
  },
})(Refresh);

/** Blue information icon */
export const BlueInfo = withStyles({
  root: {
    color: COLORS.link,
    fontSize: '16px',
  },
})(Info);

/** Red information icon */
export const RedError = withStyles({
  root: {
    color: COLORS.red,
    fontSize: '16px',
  },
})(Info);
