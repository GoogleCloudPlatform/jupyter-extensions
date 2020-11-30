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

/* eslint-disable @typescript-eslint/no-unused-vars */
import { shallow } from 'enzyme';
import * as React from 'react';

import {
  GcpScheduledJobsWidget,
  GcpScheduledJobsPanel,
} from './jobs_panel_widget';
import { GcpService } from '../service/gcp';
import { TEST_PROJECT, getRun, getSchedule } from '../test_helpers';

describe('GcpScheduledJobsWidget', () => {
  const fakeGcpService = {} as GcpService;

  it('Renders with undefined visibility status', () => {
    const widget = new GcpScheduledJobsWidget(fakeGcpService);
    const element = shallow(widget.render());
    expect(
      element.find(GcpScheduledJobsPanel).prop('isVisible')
    ).toBeUndefined();
  });

  it('Set isVisible based on showing and hiding', () => {
    const widget = new GcpScheduledJobsWidget(fakeGcpService);
    const element = shallow(widget.render());
    widget.onAfterShow();
    expect(element.find(GcpScheduledJobsPanel).prop('isVisible')).toBe(true);

    widget.onAfterHide();
    expect(element.find(GcpScheduledJobsPanel).prop('isVisible')).toBe(false);
  });
});

describe('GcpScheduledJobsPanel', () => {
  const mockProjectId = jest.fn();
  const mockListRuns = jest.fn();
  const mockListSchedules = jest.fn();
  const mockGcpService = ({
    get projectId() {
      return mockProjectId();
    },
    listRuns: mockListRuns,
    listSchedules: mockListSchedules,
  } as unknown) as GcpService;

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('Renders when not visible', () => {
    const component = shallow(
      <GcpScheduledJobsPanel gcpService={mockGcpService} isVisible={false} />
    );
    expect(component).toMatchSnapshot();
    expect(mockListRuns).not.toHaveBeenCalled();
    expect(mockListSchedules).not.toHaveBeenCalled();
  });

  it('Shows error if project cannot be determined', async () => {
    const rejectedProjectId = Promise.reject('No project');
    mockProjectId.mockReturnValue(rejectedProjectId);
    const component = shallow(
      <GcpScheduledJobsPanel gcpService={mockGcpService} isVisible={false} />
    );
    await rejectedProjectId.catch(() => null);

    expect(component).toMatchSnapshot();
    expect(mockListRuns).not.toHaveBeenCalled();
    expect(mockListSchedules).not.toHaveBeenCalled();
  });

  it('Shows error if runs cannot be retrieved', async () => {
    const rejectedPromise = Promise.reject('Cannot retrieve runs');
    const resolvedSchedules = Promise.resolve({
      schedules: [
        getSchedule(),
        { ...getSchedule(), id: 'notebook_run2_fghijk' },
      ],
    });
    mockProjectId.mockResolvedValue(TEST_PROJECT);
    mockListRuns.mockReturnValue(rejectedPromise);
    mockListSchedules.mockResolvedValue(resolvedSchedules);

    const component = shallow(
      <GcpScheduledJobsPanel gcpService={mockGcpService} isVisible={false} />
    );
    component.setProps({ isVisible: true });
    await rejectedPromise.catch(() => null);
    await expect(component).toMatchSnapshot();
    expect(mockListRuns).toHaveBeenCalled();
    expect(mockListSchedules).not.toHaveBeenCalled();
  });

  it('Shows error if schedules cannot be retrieved', async () => {
    const rejectedPromise = Promise.reject('Cannot retrieve schedules');
    const resolvedRuns = Promise.resolve({
      runs: [getRun(), { ...getRun(), id: 'notebook_run2_fghijk' }],
    });
    mockProjectId.mockResolvedValue(TEST_PROJECT);
    mockListRuns.mockResolvedValue(resolvedRuns);
    mockListSchedules.mockReturnValue(rejectedPromise);

    const component = shallow(
      <GcpScheduledJobsPanel gcpService={mockGcpService} isVisible={false} />
    );
    component.setProps({ isVisible: true });
    await resolvedRuns;

    (component.instance() as GcpScheduledJobsPanel).handleChangeTab(null, 1);
    await rejectedPromise.catch(() => null);

    await expect(component).toMatchSnapshot();
    expect(component.state('tab')).toEqual(1);
    expect(mockListRuns).toHaveBeenCalled();
    expect(mockListSchedules).toHaveBeenCalled();
  });

  it('Shows loading indicator', async () => {
    const resolvedProject = Promise.resolve(TEST_PROJECT);
    const resolvedRuns = Promise.resolve({
      runs: [getRun(), { ...getRun(), id: 'notebook_run2_fghijk' }],
    });
    const resolvedSchedules = Promise.resolve({
      schedules: [
        getSchedule(),
        { ...getSchedule(), id: 'notebook_run2_fghijk' },
      ],
    });
    mockProjectId.mockReturnValue(resolvedProject);
    mockListRuns.mockReturnValue(resolvedRuns);
    mockListSchedules.mockReturnValue(resolvedSchedules);

    const component = shallow(
      <GcpScheduledJobsPanel gcpService={mockGcpService} isVisible={false} />
    );
    component.setProps({ isVisible: true });

    expect(component).toMatchSnapshot();
    expect(mockListRuns).toHaveBeenCalled();
    expect(mockListSchedules).not.toHaveBeenCalled();
  });

  it('Shows runs', async () => {
    const resolvedRuns = Promise.resolve({
      runs: [getRun(), { ...getRun(), id: 'notebook_run2_fghijk' }],
    });
    const resolvedSchedules = Promise.resolve({
      schedules: [
        getSchedule(),
        { ...getSchedule(), id: 'notebook_run2_fghijk' },
      ],
    });
    mockProjectId.mockResolvedValue(TEST_PROJECT);
    mockListRuns.mockReturnValue(resolvedRuns);
    mockListSchedules.mockReturnValue(resolvedSchedules);

    const component = shallow(
      <GcpScheduledJobsPanel gcpService={mockGcpService} isVisible={false} />
    );
    component.setProps({ isVisible: true });
    await resolvedRuns;
    // await resolvedSchedules;

    expect(component).toMatchSnapshot();
    expect(mockListRuns).toHaveBeenCalled();
    expect(mockListSchedules).not.toHaveBeenCalled();
  });

  it('Shows schedules', async () => {
    const resolvedRuns = Promise.resolve({
      runs: [getRun(), { ...getRun(), id: 'notebook_run2_fghijk' }],
    });
    const resolvedSchedules = Promise.resolve({
      schedules: [
        getSchedule(),
        { ...getSchedule(), id: 'notebook_run2_fghijk' },
      ],
    });
    mockProjectId.mockResolvedValue(TEST_PROJECT);
    mockListRuns.mockReturnValue(resolvedRuns);
    mockListSchedules.mockReturnValue(resolvedSchedules);

    const component = shallow(
      <GcpScheduledJobsPanel gcpService={mockGcpService} isVisible={false} />
    );
    component.setProps({ isVisible: true });
    await resolvedRuns;

    (component.instance() as GcpScheduledJobsPanel).handleChangeTab(null, 1);
    await resolvedSchedules;

    expect(component).toMatchSnapshot();
    expect(component.state('tab')).toEqual(1);
    expect(mockListRuns).toHaveBeenCalled();
    expect(mockListSchedules).toHaveBeenCalled();
  });

  it('Refreshes runs', async () => {
    const resolvedRuns = Promise.resolve({
      runs: [getRun(), { ...getRun(), id: 'notebook_run2_fghijk' }],
    });
    const resolvedSchedules = Promise.resolve({
      schedules: [
        getSchedule(),
        { ...getSchedule(), id: 'notebook_run2_fghijk' },
      ],
    });
    mockProjectId.mockResolvedValue(TEST_PROJECT);
    mockListRuns.mockReturnValue(resolvedRuns);
    mockListSchedules.mockReturnValue(resolvedSchedules);

    const component = shallow(
      <GcpScheduledJobsPanel gcpService={mockGcpService} isVisible={false} />
    );
    component.setProps({ isVisible: true });
    await resolvedRuns;
    await resolvedSchedules;

    component.find({ title: 'Refresh Jobs' }).simulate('click');
    expect(mockListRuns).toHaveBeenCalledTimes(2);
  });
});
