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
import { Box, CircularProgress } from '@material-ui/core';

const spinnerContainer = style({
  position: 'absolute',
  backgroundColor: 'rgba(255,255,255,.8)',
  top: 0,
  bottom: 0,
  left: 0,
  right: 0,
});

export const Loading: React.FC = () => (
  <Box display="flex" className={spinnerContainer} data-testid="loadingSpinner">
    <Box m="auto">
      <CircularProgress />
    </Box>
  </Box>
);
