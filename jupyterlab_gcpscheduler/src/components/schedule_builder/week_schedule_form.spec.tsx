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

import { mount, shallow } from 'enzyme';
import * as React from 'react';

import { DAY, MONTH } from '../../data';
import { SchedulerBuilderProps } from './schedule_builder';
import { WeekScheduleBuilder } from './week_schedule_form';
import {
  simulateFieldChange,
  simulateCheckBoxChange,
} from '../../test_helpers';

describe('WeekScheduleBuilder', () => {
  const mockProps: SchedulerBuilderProps = {
    frequencyType: MONTH,
    onScheduleChange: jest.fn(),
    onChangeFrequencyType: jest.fn(),
  };
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('mounts without error', async () => {
    shallow(<WeekScheduleBuilder {...mockProps} />);
    expect(mockProps.onScheduleChange).toBeCalledTimes(0);
  });

  it('mounts full without error', async () => {
    mount(<WeekScheduleBuilder {...mockProps} />);
    expect(mockProps.onScheduleChange).toBeCalledTimes(0);
  });

  it('Triggers onScheduleChange when frequencyType is changed', async () => {
    const weekScheduleBuilder = mount(<WeekScheduleBuilder {...mockProps} />);
    simulateFieldChange(
      weekScheduleBuilder,
      'input[name="frequencyType"]',
      'frequencyType',
      DAY
    );
    expect(mockProps.onScheduleChange).toBeCalledTimes(0);
    expect(mockProps.onChangeFrequencyType).toBeCalledTimes(1);
  });

  it('Triggers onScheduleChange when weeks of weeks are changed', async () => {
    const weekScheduleBuilder = mount(<WeekScheduleBuilder {...mockProps} />);
    simulateCheckBoxChange(
      weekScheduleBuilder,
      'input[name="mondayRun"]',
      'mondayRun',
      true
    );
    expect(mockProps.onScheduleChange).lastCalledWith('00 09 * * 1');
    expect(mockProps.onScheduleChange).toBeCalledTimes(1);
  });

  it('Displays error when no days of week are selected', async () => {
    const weekScheduleBuilder = mount(<WeekScheduleBuilder {...mockProps} />);
    expect(mockProps.onScheduleChange).toBeCalledTimes(0);
    expect(weekScheduleBuilder.find('FieldError').prop('message')).toBe(
      'At least one day is required'
    );
  });

  it('Displays error when days of week are toggled', async () => {
    const weekScheduleBuilder = mount(<WeekScheduleBuilder {...mockProps} />);
    expect(weekScheduleBuilder.find('FieldError').prop('message')).toBe(
      'At least one day is required'
    );
    simulateCheckBoxChange(
      weekScheduleBuilder,
      'input[name="mondayRun"]',
      'mondayRun',
      true
    );
    simulateCheckBoxChange(
      weekScheduleBuilder,
      'input[name="thursdayRun"]',
      'thursdayRun',
      true
    );
    expect(mockProps.onScheduleChange).lastCalledWith('00 09 * * 1,4');
    expect(weekScheduleBuilder.find('FieldError')).toHaveLength(0);
    simulateCheckBoxChange(
      weekScheduleBuilder,
      'input[name="mondayRun"]',
      'mondayRun',
      false
    );
    simulateCheckBoxChange(
      weekScheduleBuilder,
      'input[name="thursdayRun"]',
      'thursdayRun',
      false
    );
    expect(mockProps.onScheduleChange).lastCalledWith('');
    expect(mockProps.onScheduleChange).toBeCalledTimes(4);
    expect(weekScheduleBuilder.find('FieldError').prop('message')).toBe(
      'At least one day is required'
    );
  });

  it('Triggers onScheduleChange when specifiedTime is changed', async () => {
    const weekScheduleBuilder = mount(<WeekScheduleBuilder {...mockProps} />);
    simulateFieldChange(
      weekScheduleBuilder,
      'input[name="specifiedTime"]',
      'specifiedTime',
      '14:00'
    );
    simulateCheckBoxChange(
      weekScheduleBuilder,
      'input[name="mondayRun"]',
      'mondayRun',
      true
    );
    expect(mockProps.onScheduleChange).lastCalledWith('00 14 * * 1');
    expect(mockProps.onScheduleChange).toBeCalledTimes(2);
  });

  it('Displays error when specifiedTime is invalid (null or empty)', async () => {
    const weekScheduleBuilder = mount(<WeekScheduleBuilder {...mockProps} />);
    simulateFieldChange(
      weekScheduleBuilder,
      'input[name="specifiedTime"]',
      'specifiedTime',
      ''
    );
    simulateCheckBoxChange(
      weekScheduleBuilder,
      'input[name="mondayRun"]',
      'mondayRun',
      true
    );
    expect(mockProps.onScheduleChange).lastCalledWith('');
    expect(mockProps.onScheduleChange).toBeCalledTimes(2);
    expect(
      weekScheduleBuilder
        .find('FieldError')
        .at(0)
        .prop('message')
    ).toBe('Repeat (time) is required.');
  });
});
