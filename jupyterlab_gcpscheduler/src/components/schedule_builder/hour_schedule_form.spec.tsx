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

import { HOUR, MONTH } from '../../data';
import { simulateFieldChange, createReactWrapper } from '../../test_helpers';
import { HourScheduleBuilder } from './hour_schedule_form';
import { SchedulerBuilderProps } from './schedule_builder';

describe('HourScheduleBuilder', () => {
  const mockProps: SchedulerBuilderProps = {
    frequencyType: HOUR,
    onScheduleChange: jest.fn(),
    onChangeFrequencyType: jest.fn(),
  };

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('Renders without error', async () => {
    shallow(<HourScheduleBuilder {...mockProps} />);
    expect(mockProps.onScheduleChange).toBeCalledTimes(1);
  });

  it('Triggers onScheduleChange when frequency is changed', async () => {
    const hourScheduleBuilder = shallow(<HourScheduleBuilder {...mockProps} />);
    simulateFieldChange(
      createReactWrapper(hourScheduleBuilder, 'TextInput[name="frequency"]'),
      'input[name="frequency"]',
      'frequency',
      '10'
    );
    expect(mockProps.onScheduleChange).lastCalledWith('00 */10 * * *');
    expect(mockProps.onScheduleChange).toBeCalledTimes(2);
  });

  it('Triggers onScheduleChange when specifiedMinute is changed', async () => {
    const hourScheduleBuilder = shallow(<HourScheduleBuilder {...mockProps} />);
    simulateFieldChange(
      createReactWrapper(
        hourScheduleBuilder,
        'TextInput[name="specifiedMinute"]'
      ),
      'input[name="specifiedMinute"]',
      'specifiedMinute',
      '43'
    );
    expect(mockProps.onScheduleChange).lastCalledWith('43 */1 * * *');
    expect(mockProps.onScheduleChange).toBeCalledTimes(2);
  });

  it('Triggers onScheduleChange when frequencyType is changed', async () => {
    const hourScheduleBuilder = shallow(<HourScheduleBuilder {...mockProps} />);
    simulateFieldChange(
      createReactWrapper(
        hourScheduleBuilder,
        'SelectInput[name="frequencyType"]'
      ),
      'input[name="frequencyType"]',
      'frequencyType',
      MONTH
    );
    expect(mockProps.onScheduleChange).toBeCalledTimes(1);
    expect(mockProps.onChangeFrequencyType).toBeCalledTimes(1);
  });

  it('Displays error when frequency is invalid ( less than 1 )', async () => {
    const hourScheduleBuilder = shallow(<HourScheduleBuilder {...mockProps} />);
    simulateFieldChange(
      createReactWrapper(hourScheduleBuilder, 'TextInput[name="frequency"]'),
      'input[name="frequency"]',
      'frequency',
      '0'
    );
    expect(mockProps.onScheduleChange).lastCalledWith('');
    expect(mockProps.onScheduleChange).toBeCalledTimes(2);
    expect(
      hourScheduleBuilder
        .find('CheckValidation[fieldName="Frequency"]')
        .dive()
        .find('FieldError')
        .prop('message')
    ).toBe('Frequency range is [1-24]');
  });

  it('Displays error when frequency is invalid ( greater than 24) ', async () => {
    const hourScheduleBuilder = shallow(<HourScheduleBuilder {...mockProps} />);
    simulateFieldChange(
      createReactWrapper(hourScheduleBuilder, 'TextInput[name="frequency"]'),
      'input[name="frequency"]',
      'frequency',
      '25'
    );
    expect(mockProps.onScheduleChange).lastCalledWith('');
    expect(mockProps.onScheduleChange).toBeCalledTimes(2);
    expect(
      hourScheduleBuilder
        .find('CheckValidation[fieldName="Frequency"]')
        .dive()
        .find('FieldError')
        .prop('message')
    ).toBe('Frequency range is [1-24]');
  });

  it('Displays error when frequency is invalid (null or empty) ', async () => {
    const hourScheduleBuilder = shallow(<HourScheduleBuilder {...mockProps} />);
    simulateFieldChange(
      createReactWrapper(hourScheduleBuilder, 'TextInput[name="frequency"]'),
      'input[name="frequency"]',
      'frequency',
      ''
    );
    expect(mockProps.onScheduleChange).lastCalledWith('');
    expect(mockProps.onScheduleChange).toBeCalledTimes(2);
    expect(
      hourScheduleBuilder
        .find('CheckValidation[fieldName="Frequency"]')
        .dive()
        .find('FieldError')
        .prop('message')
    ).toBe('Frequency is required.');
  });

  it('Displays error when specifiedMinute is invalid (null or empty)', async () => {
    const hourScheduleBuilder = shallow(<HourScheduleBuilder {...mockProps} />);
    simulateFieldChange(
      createReactWrapper(
        hourScheduleBuilder,
        'TextInput[name="specifiedMinute"]'
      ),
      'input[name="specifiedMinute"]',
      'specifiedMinute',
      ''
    );
    expect(mockProps.onScheduleChange).lastCalledWith('');
    expect(mockProps.onScheduleChange).toBeCalledTimes(2);
    expect(
      hourScheduleBuilder
        .find('CheckValidation[fieldName="Repeat (minute)"]')
        .dive()
        .find('FieldError')
        .prop('message')
    ).toBe('Repeat (minute) is required.');
  });

  it('Displays error when specifiedMinute is invalid (out of range - high)', async () => {
    const hourScheduleBuilder = shallow(<HourScheduleBuilder {...mockProps} />);
    simulateFieldChange(
      createReactWrapper(
        hourScheduleBuilder,
        'TextInput[name="specifiedMinute"]'
      ),
      'input[name="specifiedMinute"]',
      'specifiedMinute',
      '120'
    );
    expect(mockProps.onScheduleChange).lastCalledWith('');
    expect(mockProps.onScheduleChange).toBeCalledTimes(2);
    expect(
      hourScheduleBuilder
        .find('CheckValidation[fieldName="Repeat (minute)"]')
        .dive()
        .find('FieldError')
        .prop('message')
    ).toBe('Repeat (minute) range is [0-59]');
  });

  it('Displays error when specifiedMinute is invalid (out of range - low)', async () => {
    const hourScheduleBuilder = shallow(<HourScheduleBuilder {...mockProps} />);
    simulateFieldChange(
      createReactWrapper(
        hourScheduleBuilder,
        'TextInput[name="specifiedMinute"]'
      ),
      'input[name="specifiedMinute"]',
      'specifiedMinute',
      '-1'
    );
    expect(mockProps.onScheduleChange).lastCalledWith('');
    expect(mockProps.onScheduleChange).toBeCalledTimes(2);
    expect(
      hourScheduleBuilder
        .find('CheckValidation[fieldName="Repeat (minute)"]')
        .dive()
        .find('FieldError')
        .prop('message')
    ).toBe('Repeat (minute) range is [0-59]');
  });
});
