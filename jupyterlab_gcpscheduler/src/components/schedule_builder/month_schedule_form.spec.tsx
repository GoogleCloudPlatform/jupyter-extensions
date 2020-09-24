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
import { MonthScheduleBuilder } from './month_schedule_form';
import { SchedulerBuilderProps } from './schedule_builder';

describe('MonthScheduleBuilder', () => {
  const mockProps: SchedulerBuilderProps = {
    frequencyType: MONTH,
    onScheduleChange: jest.fn(),
    onChangeFrequencyType: jest.fn(),
  };

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('Renders without error', async () => {
    shallow(<MonthScheduleBuilder {...mockProps} />);
    expect(mockProps.onScheduleChange).toBeCalledTimes(1);
  });

  it('Triggers onScheduleChange when frequency is changed', async () => {
    const monthScheduleBuilder = shallow(
      <MonthScheduleBuilder {...mockProps} />
    );
    simulateFieldChange(
      createReactWrapper(monthScheduleBuilder, 'SelectInput[name="frequency"]'),
      'input[name="frequency"]',
      'frequency',
      '6'
    );
    expect(mockProps.onScheduleChange).lastCalledWith('00 12 1 */6 *');
    expect(mockProps.onScheduleChange).toBeCalledTimes(2);
  });

  it('Triggers onScheduleChange when specifiedDay is changed', async () => {
    const monthScheduleBuilder = shallow(
      <MonthScheduleBuilder {...mockProps} />
    );
    simulateFieldChange(
      createReactWrapper(
        monthScheduleBuilder,
        'TextInput[name="specifiedDay"]'
      ),
      'input[name="specifiedDay"]',
      'specifiedDay',
      '12'
    );
    expect(mockProps.onScheduleChange).lastCalledWith('00 12 12 */1 *');
    expect(mockProps.onScheduleChange).toBeCalledTimes(2);
  });

  it('Triggers onScheduleChange when frequencyType is changed', async () => {
    const monthScheduleBuilder = shallow(
      <MonthScheduleBuilder {...mockProps} />
    );
    simulateFieldChange(
      createReactWrapper(
        monthScheduleBuilder,
        'SelectInput[name="frequencyType"]'
      ),
      'input[name="frequencyType"]',
      'frequencyType',
      DAY
    );
    expect(mockProps.onScheduleChange).toBeCalledTimes(1);
    expect(mockProps.onChangeFrequencyType).toBeCalledTimes(1);
  });

  it('Triggers onScheduleChange when specifiedTime is changed', async () => {
    const monthScheduleBuilder = shallow(
      <MonthScheduleBuilder {...mockProps} />
    );
    simulateFieldChange(
      createReactWrapper(
        monthScheduleBuilder,
        'TextInput[name="specifiedTime"]'
      ),
      'input[name="specifiedTime"]',
      'specifiedTime',
      '14:00'
    );
    expect(mockProps.onScheduleChange).lastCalledWith('00 14 1 */1 *');
    expect(mockProps.onScheduleChange).toBeCalledTimes(2);
  });

  it('Displays error when specifiedDay is invalid (null or empty)', async () => {
    const monthScheduleBuilder = shallow(
      <MonthScheduleBuilder {...mockProps} />
    );
    simulateFieldChange(
      createReactWrapper(
        monthScheduleBuilder,
        'TextInput[name="specifiedDay"]'
      ),
      'input[name="specifiedDay"]',
      'specifiedDay',
      ''
    );
    expect(mockProps.onScheduleChange).lastCalledWith('');
    expect(mockProps.onScheduleChange).toBeCalledTimes(2);
    expect(
      monthScheduleBuilder
        .find('CheckValidation[fieldName="Repeat (day)"]')
        .dive()
        .find('FieldError')
        .prop('message')
    ).toBe('Repeat (day) is required.');
  });

  it('Displays error when specifiedDay is invalid (out of range - high)', async () => {
    const monthScheduleBuilder = shallow(
      <MonthScheduleBuilder {...mockProps} />
    );
    simulateFieldChange(
      createReactWrapper(
        monthScheduleBuilder,
        'TextInput[name="specifiedDay"]'
      ),
      'input[name="specifiedDay"]',
      'specifiedDay',
      '32'
    );
    expect(mockProps.onScheduleChange).lastCalledWith('');
    expect(mockProps.onScheduleChange).toBeCalledTimes(2);
    expect(
      monthScheduleBuilder
        .find('CheckValidation[fieldName="Repeat (day)"]')
        .dive()
        .find('FieldError')
        .prop('message')
    ).toBe('Repeat (day) range is [1-31]');
  });

  it('Displays error when specifiedDay is invalid (out of range - low)', async () => {
    const monthScheduleBuilder = shallow(
      <MonthScheduleBuilder {...mockProps} />
    );
    simulateFieldChange(
      createReactWrapper(
        monthScheduleBuilder,
        'TextInput[name="specifiedDay"]'
      ),
      'input[name="specifiedDay"]',
      'specifiedDay',
      '-1'
    );
    expect(mockProps.onScheduleChange).lastCalledWith('');
    expect(mockProps.onScheduleChange).toBeCalledTimes(2);
    expect(
      monthScheduleBuilder
        .find('CheckValidation[fieldName="Repeat (day)"]')
        .dive()
        .find('FieldError')
        .prop('message')
    ).toBe('Repeat (day) range is [1-31]');
  });

  it('Displays error when specifiedTime is invalid (null or empty)', async () => {
    const monthScheduleBuilder = shallow(
      <MonthScheduleBuilder {...mockProps} />
    );
    simulateFieldChange(
      createReactWrapper(
        monthScheduleBuilder,
        'TextInput[name="specifiedTime"]'
      ),
      'input[name="specifiedTime"]',
      'specifiedTime',
      ''
    );
    expect(mockProps.onScheduleChange).lastCalledWith('');
    expect(mockProps.onScheduleChange).toBeCalledTimes(2);
    expect(
      monthScheduleBuilder
        .find('CheckValidation[fieldName="Repeat (time)"]')
        .dive()
        .find('FieldError')
        .prop('message')
    ).toBe('Repeat (time) is required.');
  });
});
