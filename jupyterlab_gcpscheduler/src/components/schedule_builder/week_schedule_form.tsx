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
  CheckboxInput,
  FieldError,
  SelectInput,
  TextInput,
  CheckValidation,
} from 'gcp_jupyterlab_shared';
import * as React from 'react';

import { DAYS_OF_WEEK, FREQUENCY_TYPES } from '../../data';
import { FrequencyType, SchedulerBuilderProps } from './schedule_builder';

interface SubFormState {
  specifiedTime: string;
  mondayExecution: boolean;
  tuesdayExecution: boolean;
  wednesdayExecution: boolean;
  thursdayExecution: boolean;
  fridayExecution: boolean;
  saturdayExecution: boolean;
  sundayExecution: boolean;
}

export class WeekScheduleBuilder extends React.Component<
  SchedulerBuilderProps,
  SubFormState
> {
  constructor(props: SchedulerBuilderProps) {
    super(props);
    this.state = {
      specifiedTime: '09:00',
      mondayExecution: false,
      tuesdayExecution: false,
      wednesdayExecution: false,
      thursdayExecution: false,
      fridayExecution: false,
      saturdayExecution: false,
      sundayExecution: false,
    };
    this._listOfDays = this._listOfDays.bind(this);
    this._createCronString = this._createCronString.bind(this);
    this._areAnyDaysSelected = this._areAnyDaysSelected.bind(this);
    this._convertDaysOfWeektoString = this._convertDaysOfWeektoString.bind(
      this
    );
    this._createCheckboxes = this._createCheckboxes.bind(this);
  }

  componentDidUpdate(
    prevProps: SchedulerBuilderProps,
    prevState: SubFormState
  ) {
    if (prevProps.frequencyType === this.props.frequencyType) {
      if (
        prevState.specifiedTime !== this.state.specifiedTime ||
        prevState.mondayExecution !== this.state.mondayExecution ||
        prevState.tuesdayExecution !== this.state.tuesdayExecution ||
        prevState.wednesdayExecution !== this.state.wednesdayExecution ||
        prevState.thursdayExecution !== this.state.thursdayExecution ||
        prevState.fridayExecution !== this.state.fridayExecution ||
        prevState.sundayExecution !== this.state.sundayExecution ||
        prevState.saturdayExecution !== this.state.saturdayExecution
      ) {
        this.props.onScheduleChange(this._createCronString());
      }
    }
  }

  _listOfDays() {
    return [
      this.state.sundayExecution,
      this.state.mondayExecution,
      this.state.tuesdayExecution,
      this.state.wednesdayExecution,
      this.state.thursdayExecution,
      this.state.fridayExecution,
      this.state.saturdayExecution,
    ];
  }

  _areAnyDaysSelected() {
    const selected = (element: boolean) => element === true;
    if (!this._listOfDays().some(selected)) {
      return false;
    }
    return true;
  }

  _convertDaysOfWeektoString() {
    let week = '';
    const values = this._listOfDays();
    for (let i = 0; i < DAYS_OF_WEEK.length; i++) {
      if (values[i]) {
        if (week) {
          week += ',' + String(i);
        } else {
          week += String(i);
        }
      }
    }
    return week;
  }

  _createCronString() {
    const { specifiedTime } = this.state;
    if (!specifiedTime || !this._areAnyDaysSelected()) {
      return '';
    }
    const minute = specifiedTime.trim().split(':')[1];
    const hour = specifiedTime.trim().split(':')[0];
    const week = this._convertDaysOfWeektoString();
    return minute + ' ' + hour + ' * * ' + week;
  }

  _createCheckboxes() {
    return DAYS_OF_WEEK.map((day, i) => {
      const name = String(day.value);
      const value = this._listOfDays()[i % 7];
      return (
        <CheckboxInput
          key={name}
          name={name}
          label={day.text}
          checked={value}
          onChange={e =>
            this.setState(({
              [String(name)]: e.target.checked,
            } as unknown) as SubFormState)
          }
        />
      );
    });
  }

  render() {
    return (
      <div>
        <div className={css.scheduleBuilderRow}>
          <span className={css.flexQuarter}>
            <b>Repeat every</b>
          </span>
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
        <div className={css.scheduleBuilderRow}>
          <span className={css.flexQuarter}>
            <b>Repeat at</b>
          </span>
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
          fieldName={'Repeat at'}
          required={true}
          value={this.state.specifiedTime}
        />
        <div className={css.scheduleBuilderRow}>{this._createCheckboxes()}</div>
        {!this._areAnyDaysSelected() && (
          <div className={css.errorRow}>
            <FieldError message="At least one day is required" />
          </div>
        )}
      </div>
    );
  }
}
