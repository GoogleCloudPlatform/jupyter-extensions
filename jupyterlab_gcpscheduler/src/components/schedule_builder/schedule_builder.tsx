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

import { DAY, HOUR, MONTH, WEEK } from '../../data';
import { CronScheduleBuilder } from './cron_schedule_form';
import { DayScheduleBuilder } from './day_schedule_form';
import { HourScheduleBuilder } from './hour_schedule_form';
import { MonthScheduleBuilder } from './month_schedule_form';
import { WeekScheduleBuilder } from './week_schedule_form';

export type FrequencyType = 'hour' | 'day' | 'week' | 'month';

/** Function called when a new schedule string is built */
export type OnScheduleChange = (newSchedule: string) => void;

/** Common interface used by all SchedulerBuilder components. */
export interface SchedulerBuilderProps {
  frequencyType: string;
  onScheduleChange: OnScheduleChange;
  onChangeFrequencyType: (frequencyType: FrequencyType) => void;
}

interface FormProps {
  schedule: string;
  onScheduleChange: OnScheduleChange;
  useUnixCronFormat: boolean;
}

interface FormState {
  frequencyType: string;
}

export class ScheduleBuilder extends React.Component<FormProps, FormState> {
  constructor(props: FormProps) {
    super(props);
    this.state = { frequencyType: HOUR };
    this.onChangeFrequencyType = this.onChangeFrequencyType.bind(this);
  }

  onChangeFrequencyType(frequencyType: FrequencyType) {
    this.setState({ frequencyType });
  }

  render() {
    const { onScheduleChange } = this.props;
    const builderProps: SchedulerBuilderProps = {
      frequencyType: this.state.frequencyType,
      onChangeFrequencyType: this.onChangeFrequencyType,
      onScheduleChange: onScheduleChange,
    };
    return this.props.useUnixCronFormat ? (
      <CronScheduleBuilder
        schedule={this.props.schedule}
        onScheduleChange={onScheduleChange}
      />
    ) : (
      <div>
        {this.state.frequencyType === HOUR && (
          <HourScheduleBuilder {...builderProps} />
        )}
        {this.state.frequencyType === WEEK && (
          <WeekScheduleBuilder {...builderProps} />
        )}
        {this.state.frequencyType === DAY && (
          <DayScheduleBuilder {...builderProps} />
        )}
        {this.state.frequencyType === MONTH && (
          <MonthScheduleBuilder {...builderProps} />
        )}
      </div>
    );
  }
}
