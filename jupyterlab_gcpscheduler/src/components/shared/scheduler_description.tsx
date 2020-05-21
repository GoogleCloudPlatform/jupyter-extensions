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

import { LearnMoreLink } from './learn_more_link';
import { css } from '../../styles';

const DESCRIPTION = `Schedule and run this Notebook from start to finish
at the specified frequency. The executed Notebook will be saved to a
Cloud Storage bucket and viewable from a dashboard. Using this feature will
incur additional charges for running an AI Platform Training Job.`;
const LINK = 'https://cloud.google.com/ai-platform/training/pricing';

/** Functional Component for the Scheduler Documentation */
// tslint:disable-next-line:enforce-name-casing
export function SchedulerDescription() {
  return (
    <p className={css.noTopMargin}>
      {DESCRIPTION}
      <LearnMoreLink href={LINK} />
    </p>
  );
}
