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
  SelectInput,
  TextInput,
  CheckValidation,
} from 'gcp_jupyterlab_shared';
import * as React from 'react';

import { FREQUENCY_TYPES } from '../../data';

import { FrequencyType, SchedulerBuilderProps } from './schedule_builder';

interface SubFormState {
  frequency: string;
  specifiedTime: string;
}

export class DayScheduleBuilder extends React.Component<
  SchedulerBuilderProps,
  SubFormState
> {
  constructor(props: SchedulerBuilderProps) {
    super(props);
    this.state = { frequency: '1', specifiedTime: '14:00' };
    this._createCronString = this._createCronString.bind(this);
  }

  componentDidMount() {
    this.props.onScheduleChange(this._createCronString());
  }

  componentDidUpdate(
    prevProps: SchedulerBuilderProps,
    prevState: SubFormState
  ) {
    if (prevProps.frequencyType === this.props.frequencyType) {
      if (
        prevState.frequency !== this.state.frequency ||
        prevState.specifiedTime !== this.state.specifiedTime
      ) {
        this.props.onScheduleChange(this._createCronString());
      }
    }
  }

  _createCronString() {
    const { frequency, specifiedTime } = this.state;
    if (!frequency || !specifiedTime) {
      return '';
    }
    if (Number(frequency) < 1 || Number(frequency) > 364) {
      return '';
    }
    const minute = specifiedTime.trim().split(':')[1];
    const hour = specifiedTime.trim().split(':')[0];
    return minute + ' ' + hour + ' */' + frequency.trim() + ' * *';
  }

  render() {
    return (
      <div>
        <div className={css.scheduleBuilderRow}>
          <span className={css.flexQuarter}>Repeat every</span>
          <div className={css.flex1}>
            <TextInput
              name="frequency"
              type="number"
              min="1"
              max="365"
              value={this.state.frequency}
              hasError={!this.state.frequency}
              onChange={e => this.setState({ frequency: e.target.value })}
            />
          </div>
          <div className={css.flex2}>
            <SelectInput
              name="frequencyType"
              value={this.props.frequencyType}
              options={FREQUENCY_TYPES}
              onChange={e =>
                this.props.onChangeFrequencyType(
                  e.target.value as FrequencyType
                )
              }
            />
          </div>
        </div>
        <CheckValidation
          min={1}
          max={364}
          fieldName={'Frequency'}
          required={true}
          value={this.state.frequency}
        />
        <div className={css.scheduleBuilderRow}>
          <span className={css.flexQuarter}>Repeat (time)</span>
          <div className={css.flex3}>
            <TextInput
              name="specifiedTime"
              type="time"
              value={this.state.specifiedTime}
              hasError={!this.state.specifiedTime}
              onChange={e => this.setState({ specifiedTime: e.target.value })}
            />
          </div>
        </div>
        <CheckValidation
          fieldName={'Repeat (time)'}
          required={true}
          value={this.state.specifiedTime}
        />
      </div>
    );
  }
}
