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

import { shallow } from 'enzyme';
import * as React from 'react';

import { DAY, MONTH } from '../../data';
import { simulateFieldChange, createReactWrapper } from '../../test_helpers';
import { DayScheduleBuilder } from './day_schedule_form';
import { SchedulerBuilderProps } from './schedule_builder';

describe('DayScheduleBuilder', () => {
  const mockProps: SchedulerBuilderProps = {
    frequencyType: DAY,
    onScheduleChange: jest.fn(),
    onChangeFrequencyType: jest.fn(),
  };

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('Renders without error', async () => {
    shallow(<DayScheduleBuilder {...mockProps} />);
    expect(mockProps.onScheduleChange).toBeCalledTimes(1);
  });

  it('Triggers onScheduleChange when frequency is changed', async () => {
    const dayScheduleBuilder = shallow(<DayScheduleBuilder {...mockProps} />);
    simulateFieldChange(
      createReactWrapper(dayScheduleBuilder, 'TextInput[name="frequency"]'),
      'input[name="frequency"]',
      'frequency',
      '10'
    );
    expect(mockProps.onScheduleChange).lastCalledWith('00 14 */10 * *');
    expect(mockProps.onScheduleChange).toBeCalledTimes(2);
  });

  it('Triggers onScheduleChange when specifiedTime is changed', async () => {
    const dayScheduleBuilder = shallow(<DayScheduleBuilder {...mockProps} />);
    simulateFieldChange(
      createReactWrapper(dayScheduleBuilder, 'TextInput[name="specifiedTime"]'),
      'input[name="specifiedTime"]',
      'specifiedTime',
      '09:00'
    );
    expect(mockProps.onScheduleChange).lastCalledWith('00 09 */1 * *');
    expect(mockProps.onScheduleChange).toBeCalledTimes(2);
  });

  it('Triggers onScheduleChange when frequencyType is changed', async () => {
    const dayScheduleBuilder = shallow(<DayScheduleBuilder {...mockProps} />);
    simulateFieldChange(
      createReactWrapper(dayScheduleBuilder, 'SelectInput'),
      'input[name="frequencyType"]',
      'frequencyType',
      MONTH
    );
    expect(mockProps.onScheduleChange).toBeCalledTimes(1);
    expect(mockProps.onChangeFrequencyType).toBeCalledTimes(1);
  });

  it('Displays error when frequency is invalid ( less than 1 )', async () => {
    const dayScheduleBuilder = shallow(<DayScheduleBuilder {...mockProps} />);
    simulateFieldChange(
      createReactWrapper(dayScheduleBuilder, 'TextInput[name="frequency"]'),
      'input[name="frequency"]',
      'frequency',
      '0'
    );
    expect(mockProps.onScheduleChange).lastCalledWith('');
    expect(mockProps.onScheduleChange).toBeCalledTimes(2);
    expect(
      dayScheduleBuilder
        .find('CheckValidation[fieldName="Frequency"]')
        .dive()
        .find('FieldError')
        .prop('message')
    ).toBe('Frequency range is [1-364]');
  });

  it('Displays error when frequency is invalid ( greater than 364) ', async () => {
    const dayScheduleBuilder = shallow(<DayScheduleBuilder {...mockProps} />);
    simulateFieldChange(
      createReactWrapper(dayScheduleBuilder, 'TextInput[name="frequency"]'),
      'input[name="frequency"]',
      'frequency',
      '365'
    );
    expect(mockProps.onScheduleChange).lastCalledWith('');
    expect(mockProps.onScheduleChange).toBeCalledTimes(2);
    expect(
      dayScheduleBuilder
        .find('CheckValidation[fieldName="Frequency"]')
        .dive()
        .find('FieldError')
        .prop('message')
    ).toBe('Frequency range is [1-364]');
  });

  it('Displays error when frequency is invalid (null or empty) ', async () => {
    const dayScheduleBuilder = shallow(<DayScheduleBuilder {...mockProps} />);
    simulateFieldChange(
      createReactWrapper(dayScheduleBuilder, 'TextInput[name="frequency"]'),
      'input[name="frequency"]',
      'frequency',
      ''
    );
    expect(mockProps.onScheduleChange).lastCalledWith('');
    expect(mockProps.onScheduleChange).toBeCalledTimes(2);
    expect(
      dayScheduleBuilder
        .find('CheckValidation[fieldName="Frequency"]')
        .dive()
        .find('FieldError')
        .prop('message')
    ).toBe('Frequency is required.');
  });

  it('Displays error when specifiedTime is invalid (null or empty)', async () => {
    const dayScheduleBuilder = shallow(<DayScheduleBuilder {...mockProps} />);
    simulateFieldChange(
      createReactWrapper(dayScheduleBuilder, 'TextInput[name="specifiedTime"]'),
      'input[name="specifiedTime"]',
      'specifiedTime',
      ''
    );
    expect(mockProps.onScheduleChange).lastCalledWith('');
    expect(mockProps.onScheduleChange).toBeCalledTimes(2);
    expect(
      dayScheduleBuilder
        .find('CheckValidation[fieldName="Repeat at"]')
        .dive()
        .find('FieldError')
        .prop('message')
    ).toBe('Repeat at is required.');
  });
});
