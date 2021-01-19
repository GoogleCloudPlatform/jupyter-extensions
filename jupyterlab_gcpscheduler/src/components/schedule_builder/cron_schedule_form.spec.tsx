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

import { simulateFieldChange, createReactWrapper } from '../../test_helpers';
import { CronScheduleBuilder } from './cron_schedule_form';

describe('CronScheduleBuilder', () => {
  const mockProps = {
    schedule: '',
    onScheduleChange: jest.fn(),
  };

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('Renders without error', async () => {
    const cronScheduleBuilder = shallow(<CronScheduleBuilder {...mockProps} />);
    expect(cronScheduleBuilder).toMatchSnapshot();
  });

  it('Triggers callback when schedule is changed', async () => {
    const cronScheduleBuilder = shallow(<CronScheduleBuilder {...mockProps} />);
    simulateFieldChange(
      createReactWrapper(cronScheduleBuilder, 'TextInput'),
      'input[name="schedule"]',
      'schedule',
      '* * * * *'
    );
    expect(mockProps.onScheduleChange).toBeCalledTimes(1);
  });

  it('Displays error when schedule is empty', async () => {
    const cronScheduleBuilder = shallow(<CronScheduleBuilder {...mockProps} />);
    simulateFieldChange(
      createReactWrapper(cronScheduleBuilder, 'TextInput'),
      'input[name="schedule"]',
      'schedule',
      ''
    );
    expect(mockProps.onScheduleChange).toBeCalledTimes(1);
    expect(cronScheduleBuilder.find('TextInput').prop('error')).toEqual(
      'Frequency is required'
    );
  });
});
