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

import {
  css,
  FieldError,
  LearnMoreLink,
  TextInput,
} from 'gcp-jupyterlab-shared';
import * as React from 'react';

import { OnScheduleChange } from './schedule_builder';

const SCHEDULE_LINK =
  'https://cloud.google.com/scheduler/docs/configuring/cron-job-schedules';

interface SubFormProps {
  schedule: string;
  onScheduleChange: OnScheduleChange;
}

export function CronScheduleBuilder(props: SubFormProps) {
  return (
    <div>
      <TextInput
        label="Schedule"
        name="schedule"
        value={props.schedule}
        hasError={!props.schedule}
        onChange={e => props.onScheduleChange(e.target.value)}
      />
      {!props.schedule && <FieldError message="Frequency is required" />}
      <p className={css.noTopMargin}>
        Schedule is specified using unix-cron format. You can define a schedule
        so that your job runs multiple times a day, or runs on specific days and
        months.
        <LearnMoreLink href={SCHEDULE_LINK} />
      </p>
    </div>
  );
}
