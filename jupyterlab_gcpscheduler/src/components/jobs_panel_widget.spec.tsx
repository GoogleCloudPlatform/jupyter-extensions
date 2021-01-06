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
import { TEST_PROJECT, getExecution, getSchedule } from '../test_helpers';

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
  const mockListExecutions = jest.fn();
  const mockListSchedules = jest.fn();
  const mockGcpService = ({
    get projectId() {
      return mockProjectId();
    },
    listExecutions: mockListExecutions,
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
    expect(mockListExecutions).not.toHaveBeenCalled();
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
    expect(mockListExecutions).not.toHaveBeenCalled();
    expect(mockListSchedules).not.toHaveBeenCalled();
  });

  it('Shows error if executions cannot be retrieved', async () => {
    const rejectedPromise = Promise.reject('Cannot retrieve executions');
    const resolvedSchedules = Promise.resolve({
      schedules: [
        getSchedule(),
        { ...getSchedule(), id: 'notebook_execution2_fghijk' },
      ],
    });
    mockProjectId.mockResolvedValue(TEST_PROJECT);
    mockListExecutions.mockReturnValue(rejectedPromise);
    mockListSchedules.mockResolvedValue(resolvedSchedules);

    const component = shallow(
      <GcpScheduledJobsPanel gcpService={mockGcpService} isVisible={false} />
    );
    component.setProps({ isVisible: true });
    await rejectedPromise.catch(() => null);
    await expect(component).toMatchSnapshot();
    expect(mockListExecutions).toHaveBeenCalled();
    expect(mockListSchedules).not.toHaveBeenCalled();
  });

  it('Shows error if schedules cannot be retrieved', async () => {
    const rejectedPromise = Promise.reject('Cannot retrieve schedules');
    const resolvedExecutions = Promise.resolve({
      executions: [
        getExecution(),
        { ...getExecution(), id: 'notebook_execution2_fghijk' },
      ],
    });
    mockProjectId.mockResolvedValue(TEST_PROJECT);
    mockListExecutions.mockResolvedValue(resolvedExecutions);
    mockListSchedules.mockReturnValue(rejectedPromise);

    const component = shallow(
      <GcpScheduledJobsPanel gcpService={mockGcpService} isVisible={false} />
    );
    component.setProps({ isVisible: true });
    await resolvedExecutions;

    (component.instance() as GcpScheduledJobsPanel).handleChangeTab(null, 1);
    await rejectedPromise.catch(() => null);

    await expect(component).toMatchSnapshot();
    expect(component.state('tab')).toEqual(1);
    expect(mockListExecutions).toHaveBeenCalled();
    expect(mockListSchedules).toHaveBeenCalled();
  });

  it('Shows loading indicator', async () => {
    const resolvedProject = Promise.resolve(TEST_PROJECT);
    const resolvedExecutions = Promise.resolve({
      executions: [
        getExecution(),
        { ...getExecution(), id: 'notebook_execution2_fghijk' },
      ],
    });
    const resolvedSchedules = Promise.resolve({
      schedules: [
        getSchedule(),
        { ...getSchedule(), id: 'notebook_execution2_fghijk' },
      ],
    });
    mockProjectId.mockReturnValue(resolvedProject);
    mockListExecutions.mockReturnValue(resolvedExecutions);
    mockListSchedules.mockReturnValue(resolvedSchedules);

    const component = shallow(
      <GcpScheduledJobsPanel gcpService={mockGcpService} isVisible={false} />
    );
    component.setProps({ isVisible: true });

    expect(component).toMatchSnapshot();
    expect(mockListExecutions).toHaveBeenCalled();
    expect(mockListSchedules).not.toHaveBeenCalled();
  });

  it('Shows executions', async () => {
    const resolvedExecutions = Promise.resolve({
      executions: [
        getExecution(),
        { ...getExecution(), id: 'notebook_execution2_fghijk' },
      ],
    });
    const resolvedSchedules = Promise.resolve({
      schedules: [
        getSchedule(),
        { ...getSchedule(), id: 'notebook_execution2_fghijk' },
      ],
    });
    mockProjectId.mockResolvedValue(TEST_PROJECT);
    mockListExecutions.mockReturnValue(resolvedExecutions);
    mockListSchedules.mockReturnValue(resolvedSchedules);

    const component = shallow(
      <GcpScheduledJobsPanel gcpService={mockGcpService} isVisible={false} />
    );
    component.setProps({ isVisible: true });
    await resolvedExecutions;
    // await resolvedSchedules;

    expect(component).toMatchSnapshot();
    expect(mockListExecutions).toHaveBeenCalled();
    expect(mockListSchedules).not.toHaveBeenCalled();
  });

  it('Shows schedules', async () => {
    const resolvedExecutions = Promise.resolve({
      executions: [
        getExecution(),
        { ...getExecution(), id: 'notebook_execution2_fghijk' },
      ],
    });
    const resolvedSchedules = Promise.resolve({
      schedules: [
        getSchedule(),
        { ...getSchedule(), id: 'notebook_execution2_fghijk' },
      ],
    });
    mockProjectId.mockResolvedValue(TEST_PROJECT);
    mockListExecutions.mockReturnValue(resolvedExecutions);
    mockListSchedules.mockReturnValue(resolvedSchedules);

    const component = shallow(
      <GcpScheduledJobsPanel gcpService={mockGcpService} isVisible={false} />
    );
    component.setProps({ isVisible: true });
    await resolvedExecutions;

    (component.instance() as GcpScheduledJobsPanel).handleChangeTab(null, 1);
    await resolvedSchedules;

    expect(component).toMatchSnapshot();
    expect(component.state('tab')).toEqual(1);
    expect(mockListExecutions).toHaveBeenCalled();
    expect(mockListSchedules).toHaveBeenCalled();
  });

  it('Refreshes executions', async () => {
    const resolvedExecutions = Promise.resolve({
      executions: [
        getExecution(),
        { ...getExecution(), id: 'notebook_execution2_fghijk' },
      ],
    });
    mockProjectId.mockResolvedValue(TEST_PROJECT);
    mockListExecutions.mockReturnValue(resolvedExecutions);

    const component = shallow(
      <GcpScheduledJobsPanel gcpService={mockGcpService} isVisible={false} />
    );
    component.setProps({ isVisible: true });
    await resolvedExecutions;

    component.find({ title: 'Refresh' }).simulate('click');
    expect(mockListExecutions).toHaveBeenCalledTimes(2);
  });

  it('Executions pagination works', async () => {
    const resolvedExecutions = Promise.resolve({
      executions: [
        getExecution(),
        { ...getExecution(), id: 'notebook_execution2_fghijk' },
      ],
      pageToken: 'abc',
    });
    const nextPageResolvedExecutions = Promise.resolve({
      executions: [
        getExecution(),
        { ...getExecution(), id: 'notebook_execution2_fghijk' },
      ],
      pageToken: 'def',
    });
    const lastPageResolvedExecutions = Promise.resolve({
      executions: [
        getExecution(),
        { ...getExecution(), id: 'notebook_execution2_fghijk' },
      ],
      pageToken: 'ghi',
    });
    mockProjectId.mockResolvedValue(TEST_PROJECT);
    mockListExecutions
      .mockReturnValueOnce(resolvedExecutions)
      .mockReturnValueOnce(nextPageResolvedExecutions)
      .mockReturnValueOnce(lastPageResolvedExecutions);
    const component = shallow(
      <GcpScheduledJobsPanel gcpService={mockGcpService} isVisible={false} />
    );
    component.setProps({ isVisible: true });
    await resolvedExecutions;
    expect(component.state('page')).toEqual(0);
    (component.instance() as GcpScheduledJobsPanel).handleChangePage(null, 1);
    expect(component.state('page')).toEqual(1);
    await nextPageResolvedExecutions;
    expect(mockListExecutions).toHaveBeenCalledWith('', 10, 'abc');
    (component.instance() as GcpScheduledJobsPanel).handleChangePage(null, 2);
    expect(component.state('page')).toEqual(2);
    await lastPageResolvedExecutions;
    expect(mockListExecutions).toHaveBeenCalledWith('', 10, 'def');
    expect(mockListExecutions).toHaveBeenCalledTimes(3);
  });

  it('Executions page size change', async () => {
    const resolvedExecutions = Promise.resolve({
      executions: [
        getExecution(),
        { ...getExecution(), id: 'notebook_execution2_fghijk' },
      ],
      pageToken: 'abc',
    });
    mockProjectId.mockResolvedValue(TEST_PROJECT);
    mockListExecutions.mockReturnValue(resolvedExecutions);
    const component = shallow(
      <GcpScheduledJobsPanel gcpService={mockGcpService} isVisible={false} />
    );
    component.setProps({ isVisible: true });
    await resolvedExecutions;
    expect(component.state('rowsPerPage')).toEqual(10);
    (component.instance() as GcpScheduledJobsPanel).handleChangeRowsPerPage({
      target: {
        value: '100',
      },
    } as React.ChangeEvent<HTMLInputElement>);
    expect(component.state('rowsPerPage')).toEqual(100);
    expect(mockListExecutions).toHaveBeenCalledTimes(2);
  });

  it('Schedules pagination works', async () => {
    const resolvedExecutions = Promise.resolve({
      executions: [
        getExecution(),
        { ...getExecution(), id: 'notebook_execution2_fghijk' },
      ],
    });
    const resolvedSchedules = Promise.resolve({
      schedules: [
        getSchedule(),
        { ...getSchedule(), id: 'notebook_execution2_fghijk' },
      ],
      pageToken: 'abc',
    });
    const nextPageResolvedSchedules = Promise.resolve({
      schedules: [
        getSchedule(),
        { ...getSchedule(), id: 'notebook_execution2_fghijk' },
      ],
      pageToken: 'def',
    });
    const lastPageResolvedSchedules = Promise.resolve({
      schedules: [
        getSchedule(),
        { ...getSchedule(), id: 'notebook_execution2_fghijk' },
      ],
      pageToken: 'ghi',
    });
    mockProjectId.mockResolvedValue(TEST_PROJECT);
    mockListExecutions.mockReturnValue(resolvedExecutions);
    mockListSchedules
      .mockReturnValueOnce(resolvedSchedules)
      .mockReturnValueOnce(nextPageResolvedSchedules)
      .mockReturnValueOnce(lastPageResolvedSchedules);
    const component = shallow(
      <GcpScheduledJobsPanel gcpService={mockGcpService} isVisible={false} />
    );
    component.setProps({ isVisible: true });
    await resolvedExecutions;

    (component.instance() as GcpScheduledJobsPanel).handleChangeTab(null, 1);
    await resolvedSchedules;

    expect(component.state('tab')).toEqual(1);
    expect(component.state('page')).toEqual(0);
    (component.instance() as GcpScheduledJobsPanel).handleChangePage(null, 1);
    expect(component.state('page')).toEqual(1);
    await nextPageResolvedSchedules;
    expect(mockListSchedules).toHaveBeenCalledWith(10, 'abc');
    (component.instance() as GcpScheduledJobsPanel).handleChangePage(null, 2);
    expect(component.state('page')).toEqual(2);
    await lastPageResolvedSchedules;
    expect(mockListSchedules).toHaveBeenCalledWith(10, 'def');
    expect(mockListSchedules).toHaveBeenCalledTimes(3);
  });

  it('Schedules page size change', async () => {
    const resolvedExecutions = Promise.resolve({
      executions: [
        getExecution(),
        { ...getExecution(), id: 'notebook_execution2_fghijk' },
      ],
    });
    const resolvedSchedules = Promise.resolve({
      schedules: [
        getSchedule(),
        { ...getSchedule(), id: 'notebook_execution2_fghijk' },
      ],
      pageToken: 'abc',
    });
    mockProjectId.mockResolvedValue(TEST_PROJECT);
    mockListExecutions.mockReturnValue(resolvedExecutions);
    mockListSchedules.mockReturnValue(resolvedSchedules);
    const component = shallow(
      <GcpScheduledJobsPanel gcpService={mockGcpService} isVisible={false} />
    );
    component.setProps({ isVisible: true });
    await resolvedExecutions;

    (component.instance() as GcpScheduledJobsPanel).handleChangeTab(null, 1);
    await resolvedSchedules;

    expect(component.state('tab')).toEqual(1);
    expect(component.state('rowsPerPage')).toEqual(10);
    (component.instance() as GcpScheduledJobsPanel).handleChangeRowsPerPage({
      target: {
        value: '100',
      },
    } as React.ChangeEvent<HTMLInputElement>);
    expect(component.state('rowsPerPage')).toEqual(100);
    expect(mockListSchedules).toHaveBeenCalledTimes(2);
  });
});
