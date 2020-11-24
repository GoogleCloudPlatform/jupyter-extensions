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
import { css, LearnMoreLink } from 'gcp_jupyterlab_shared';

const RUNNING_NOTEBOOK_PRICES_LINK =
  'https://cloud.google.com/ai-platform/training/pricing';
const CLOUD_STORAGE_PRICES_LINK = 'https://cloud.google.com/storage/pricing';

/** Functional Component for the Scheduler Documentation */
// tslint:disable-next-line:enforce-name-casing
export function SchedulerDescription() {
  return (
    <p className={css.noTopMargin}>
      Run this notebook immediately or make it a scheduled job. Results will be
      stored in a Cloud Storage bucket and can be shared with others. Charges
      apply for{' '}
      <LearnMoreLink
        href={RUNNING_NOTEBOOK_PRICES_LINK}
        text="running this notebook"
      />{' '}
      and{' '}
      <LearnMoreLink text="storing results" href={CLOUD_STORAGE_PRICES_LINK} />{' '}
      in Cloud Storage.
    </p>
  );
}
