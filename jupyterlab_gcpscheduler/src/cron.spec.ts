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
  customDateFormat,
  getNextRunAfterDate,
  getHumanReadableCron,
} from './cron';

//November 11th 11:11
const MOCK_DATE = new Date(2020, 10, 11, 11, 11);

describe('Cron functions', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('Get next run date for specific time in specific month', async () => {
    const cronString = '5 0 * 8 *';
    const nextRunDate = customDateFormat(
      getNextRunAfterDate(cronString, MOCK_DATE)
    );
    const humanReadableCron = getHumanReadableCron(cronString);
    expect(nextRunDate).toContain('August 1, 2021, 12:05 AM EDT');
    expect(humanReadableCron).toContain('Every day of August at 12:05 AM');
  });

  it('Get next run date for specific time on specific day of month', async () => {
    const cronString = '15 14 1 * *';
    const nextRunDate = customDateFormat(
      getNextRunAfterDate(cronString, MOCK_DATE)
    );
    const humanReadableCron = getHumanReadableCron(cronString);
    expect(nextRunDate).toContain('December 1, 2020, 2:15 PM');
    expect(humanReadableCron).toContain('On the 1st of every month at 2:15 PM');
  });
  it('Get next run date for specific time on range of weekdays', async () => {
    const cronString = '0 22 * * 1-5';
    const nextRunDate = customDateFormat(
      getNextRunAfterDate(cronString, MOCK_DATE)
    );
    const humanReadableCron = getHumanReadableCron(cronString);
    expect(nextRunDate).toContain('November 11, 2020, 10:00 PM');
    expect(humanReadableCron).toContain(
      'On Monday, Tuesday, Wednesday, Thursday and Friday at 10:00 PM'
    );
  });

  it('Get next run date for specific minute on interval of hours', async () => {
    const cronString = '23 0-20/2 * * *';
    const nextRunDate = customDateFormat(
      getNextRunAfterDate(cronString, MOCK_DATE)
    );
    const humanReadableCron = getHumanReadableCron(cronString);
    expect(nextRunDate).toContain('November 11, 2020, 12:23 PM');
    expect(humanReadableCron).toContain(
      'At minute 23 past hour 0, 2, 4, 6, 8, 10, 12, 14, 16, 18 and 20'
    );
  });

  it('Get next run date for specific time on specific weekday', async () => {
    const cronString = '5 4 * * sun';
    const nextRunDate = customDateFormat(
      getNextRunAfterDate(cronString, MOCK_DATE)
    );
    const humanReadableCron = getHumanReadableCron(cronString);
    expect(nextRunDate).toContain('November 15, 2020, 4:05 AM');
    expect(humanReadableCron).toContain('On Sunday at 4:05 AM');
  });

  it('Get next run date for specific minute of multiple hours on specific day of interval of months', async () => {
    const cronString = '0 0,12 1 */2 *';
    const nextRunDate = customDateFormat(
      getNextRunAfterDate(cronString, MOCK_DATE)
    );
    const humanReadableCron = getHumanReadableCron(cronString);
    expect(nextRunDate).toContain('January 1, 2021, 12:00 AM');
    expect(humanReadableCron).toContain(
      'On the 1st of every 2nd month at minute 0 past every 12th hour'
    );
  });

  it('Get next run date for specific time on range of days of month', async () => {
    const cronString = '0 4 16-20 * *';
    const nextRunDate = customDateFormat(
      getNextRunAfterDate(cronString, MOCK_DATE)
    );
    const humanReadableCron = getHumanReadableCron(cronString);
    expect(nextRunDate).toContain('November 16, 2020, 4:00 AM');
    expect(humanReadableCron).toContain(
      'On the 16th, 17th, 18th, 19th and 20th of every month at 4:00 AM'
    );
  });

  it('Get next run date for specific time on specific days and weekdays', async () => {
    const cronString = '0 0 1,15 * 3';
    const nextRunDate = customDateFormat(
      getNextRunAfterDate(cronString, MOCK_DATE)
    );
    const humanReadableCron = getHumanReadableCron(cronString);
    expect(nextRunDate).toContain('November 15, 2020, 12:00 AM');
    expect(humanReadableCron).toContain(
      'On the 1st and 15th of every month and on Wednesday at 12:00 AM'
    );
  });

  it('Every day at time', async () => {
    const cronString = '0 14 */1 * *';
    const nextRunDate = customDateFormat(
      getNextRunAfterDate(cronString, MOCK_DATE)
    );
    const humanReadableCron = getHumanReadableCron(cronString);
    expect(nextRunDate).toContain('November 11, 2020, 2:00 PM');
    expect(humanReadableCron).toContain('Every day at 2:00 PM');
  });

  it('Every x day at time', async () => {
    const cronString = '0 14 */3 * *';
    const nextRunDate = customDateFormat(
      getNextRunAfterDate(cronString, MOCK_DATE)
    );
    const humanReadableCron = getHumanReadableCron(cronString);
    expect(nextRunDate).toContain('November 13, 2020, 2:00 PM');
    expect(humanReadableCron).toContain('Every 3 days at 2:00 PM');
  });

  it('Every hour at minute', async () => {
    const cronString = '0 */1 * * *';
    const nextRunDate = customDateFormat(
      getNextRunAfterDate(cronString, MOCK_DATE)
    );
    const humanReadableCron = getHumanReadableCron(cronString);
    expect(nextRunDate).toContain('November 11, 2020, 12:00 PM');
    expect(humanReadableCron).toContain('At minute 0 past every hour');
  });

  it('Every x hour at minutes', async () => {
    const cronString = '0 */4 * * *';
    const nextRunDate = customDateFormat(
      getNextRunAfterDate(cronString, MOCK_DATE)
    );
    const humanReadableCron = getHumanReadableCron(cronString);
    expect(nextRunDate).toContain('November 11, 2020, 12:00 PM');
    expect(humanReadableCron).toContain('At minute 0 past every 4th hour');
  });

  it('Every month at time and day', async () => {
    const cronString = '0 14 14 */1 *';
    const nextRunDate = customDateFormat(
      getNextRunAfterDate(cronString, MOCK_DATE)
    );
    const humanReadableCron = getHumanReadableCron(cronString);
    expect(nextRunDate).toContain('November 14, 2020, 2:00 PM');
    expect(humanReadableCron).toContain(
      'On the 14th of every month at 2:00 PM'
    );
  });

  it('Every x months at time and day', async () => {
    const cronString = '0 14 14 */5 *';
    const nextRunDate = customDateFormat(
      getNextRunAfterDate(cronString, MOCK_DATE)
    );
    const humanReadableCron = getHumanReadableCron(cronString);
    expect(nextRunDate).toContain('November 14, 2020, 2:00 PM');
    expect(humanReadableCron).toContain(
      'On the 14th of every 5th month at 2:00 PM'
    );
  });

  it('Some weekdays at time', async () => {
    const cronString = '0 14 * * 2,6,4';
    const nextRunDate = customDateFormat(
      getNextRunAfterDate(cronString, MOCK_DATE)
    );
    const humanReadableCron = getHumanReadableCron(cronString);
    expect(nextRunDate).toContain('November 12, 2020, 2:00 PM');
    expect(humanReadableCron).toContain(
      'On Tuesday, Thursday and Saturday at 2:00 PM'
    );
  });
});
