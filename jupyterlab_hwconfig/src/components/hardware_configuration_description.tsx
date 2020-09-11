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

import React from 'react';
import { STYLES } from '../data/styles';
import { LearnMoreLink } from 'gcp_jupyterlab_shared';

export const TITLE = 'Modify Hardware Configuration';
const DESCRIPTION = `Modify the hardware configuration of your
virtual machine as you need. The options available for the
hardware are configured by your administors. `;
const LINK = 'https://cloud.google.com/compute/all-pricing';

// tslint:disable-next-line:enforce-name-casing
export function HardwareConfigurationDescription() {
  return (
    <p className={STYLES.paragraph}>
      {DESCRIPTION}
      <LearnMoreLink href={LINK} />
    </p>
  );
}
