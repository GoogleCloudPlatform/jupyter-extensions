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

import { DAY, MONTH, WEEK } from '../../data';
import { simulateFieldChange } from '../../test_helpers';
import { ScheduleBuilder } from './schedule_builder';

describe('ScheduleBuilder', () => {
  const mockProps = {
    schedule: '',
    onScheduleChange: jest.fn(),
    useAdvancedSchedule: false,
  };

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('Renders without error', async () => {
    const scheduleBuilder = shallow(<ScheduleBuilder {...mockProps} />);
    expect(scheduleBuilder).toMatchSnapshot();
  });

  it('Has the correct initial state', async () => {
    const scheduleBuilder = shallow(<ScheduleBuilder {...mockProps} />);
    expect(scheduleBuilder.state()).toEqual({ frequencyType: 'hour' });
  });

  it('Renders HourScheduleBuilder by default', async () => {
    const scheduleBuilder = shallow(<ScheduleBuilder {...mockProps} />);
    expect(scheduleBuilder.find('HourScheduleBuilder')).toHaveLength(1);
  });

  it('Renders DayScheduleBuilder on frequencyType change', async () => {
    const scheduleBuilder = shallow(<ScheduleBuilder {...mockProps} />);
    expect(scheduleBuilder.find('DayScheduleBuilder')).toHaveLength(0);
    scheduleBuilder.setState({ frequencyType: DAY });
    expect(scheduleBuilder.find('DayScheduleBuilder')).toHaveLength(1);
  });

  it('Renders MonthScheduleBuilder on frequencyType change', async () => {
    const scheduleBuilder = shallow(<ScheduleBuilder {...mockProps} />);
    expect(scheduleBuilder.find('MonthScheduleBuilder')).toHaveLength(0);
    scheduleBuilder.setState({ frequencyType: MONTH });
    expect(scheduleBuilder.find('MonthScheduleBuilder')).toHaveLength(1);
  });

  it('Renders WeekScheduleBuilder on frequencyType change', async () => {
    const scheduleBuilder = shallow(<ScheduleBuilder {...mockProps} />);
    expect(scheduleBuilder.find('WeekScheduleBuilder')).toHaveLength(0);
    scheduleBuilder.setState({ frequencyType: WEEK });
    expect(scheduleBuilder.find('WeekScheduleBuilder')).toHaveLength(1);
  });

  it('Uses CronScheduleBuilder on useAdvancedSchedule change', async () => {
    const scheduleBuilder = shallow(<ScheduleBuilder {...mockProps} />);
    expect(scheduleBuilder.find('CronScheduleBuilder')).toHaveLength(0);
    scheduleBuilder.setProps({ useAdvancedSchedule: true });
    expect(scheduleBuilder.find('CronScheduleBuilder')).toHaveLength(1);
  });

  it('Toggles CronScheduleBuilder on useAdvancedSchedule toggle', async () => {
    const scheduleBuilder = shallow(<ScheduleBuilder {...mockProps} />);
    expect(scheduleBuilder.find('CronScheduleBuilder')).toHaveLength(0);
    scheduleBuilder.setProps({ useAdvancedSchedule: true });
    expect(scheduleBuilder.find('CronScheduleBuilder')).toHaveLength(1);
    scheduleBuilder.setProps({ useAdvancedSchedule: false });
    expect(scheduleBuilder.find('CronScheduleBuilder')).toHaveLength(0);
  });

  it('Changes component displayed on child change', async () => {
    const scheduleBuilder = mount(<ScheduleBuilder {...mockProps} />);
    expect(scheduleBuilder.find('HourScheduleBuilder')).toHaveLength(1);
    expect(scheduleBuilder.find('DayScheduleBuilder')).toHaveLength(0);
    simulateFieldChange(
      scheduleBuilder,
      'select[name="frequencyType"]',
      'frequencyType',
      DAY
    );
    expect(scheduleBuilder.find('HourScheduleBuilder')).toHaveLength(0);
    expect(scheduleBuilder.find('DayScheduleBuilder')).toHaveLength(1);
    expect(mockProps.onScheduleChange).toBeCalledTimes(2);
  });

  it('Calls onScheduleChange on hour frequency change', async () => {
    const scheduleBuilder = shallow(<ScheduleBuilder {...mockProps} />);
    expect(scheduleBuilder.find('HourScheduleBuilder')).toHaveLength(1);
    simulateFieldChange(
      scheduleBuilder
        .find('HourScheduleBuilder')
        .dive()
        .find('TextInput[name="frequency"]')
        .dive(),
      'input[name="frequency"]',
      'frequency',
      '4'
    );
    expect(mockProps.onScheduleChange).toBeCalledTimes(2);
  });
});
