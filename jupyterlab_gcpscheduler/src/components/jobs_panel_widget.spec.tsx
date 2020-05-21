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
import { TEST_PROJECT, getAiPlatformJob } from '../test_helpers';

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
  const mockListNotebookJobs = jest.fn();
  const mockGcpService = ({
    get projectId() {
      return mockProjectId();
    },
    listNotebookJobs: mockListNotebookJobs,
  } as unknown) as GcpService;

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('Renders when not visible', () => {
    const component = shallow(
      <GcpScheduledJobsPanel gcpService={mockGcpService} isVisible={false} />
    );
    expect(component).toMatchSnapshot();
    expect(mockListNotebookJobs).not.toHaveBeenCalled();
  });

  it('Shows error if project cannot be determined', async () => {
    const rejectedProjectId = Promise.reject('No project');
    mockProjectId.mockReturnValue(rejectedProjectId);
    const component = shallow(
      <GcpScheduledJobsPanel gcpService={mockGcpService} isVisible={false} />
    );
    await rejectedProjectId.catch(() => null);

    expect(component).toMatchSnapshot();
    expect(mockListNotebookJobs).not.toHaveBeenCalled();
  });

  it('Shows error if jobs cannot be retrieved', async () => {
    const rejectedJobs = Promise.reject('Cannot retrieve jobs');
    mockProjectId.mockResolvedValue(TEST_PROJECT);
    mockListNotebookJobs.mockReturnValue(rejectedJobs);

    const component = shallow(
      <GcpScheduledJobsPanel gcpService={mockGcpService} isVisible={false} />
    );
    component.setProps({ isVisible: true });
    await rejectedJobs.catch(() => null);

    expect(component).toMatchSnapshot();
    expect(mockListNotebookJobs).toHaveBeenCalled();
  });

  it('Shows loading indicator', async () => {
    const resolvedProject = Promise.resolve(TEST_PROJECT);
    mockProjectId.mockReturnValue(resolvedProject);
    mockListNotebookJobs.mockResolvedValue([]);

    const component = shallow(
      <GcpScheduledJobsPanel gcpService={mockGcpService} isVisible={false} />
    );
    component.setProps({ isVisible: true });
    await resolvedProject;

    expect(component).toMatchSnapshot();
    expect(mockListNotebookJobs).toHaveBeenCalled();
  });

  it('Shows jobs', async () => {
    const resolvedJobs = Promise.resolve({
      jobs: [
        getAiPlatformJob(),
        { ...getAiPlatformJob(), jobId: 'notebook_job2_fghijk' },
      ],
    });
    mockProjectId.mockResolvedValue(TEST_PROJECT);
    mockListNotebookJobs.mockReturnValue(resolvedJobs);

    const component = shallow(
      <GcpScheduledJobsPanel gcpService={mockGcpService} isVisible={false} />
    );
    component.setProps({ isVisible: true });
    await resolvedJobs;

    expect(component).toMatchSnapshot();
    expect(mockListNotebookJobs).toHaveBeenCalled();
  });

  it('Refreshes jobs', async () => {
    const resolvedJobs = Promise.resolve({
      jobs: [
        getAiPlatformJob(),
        { ...getAiPlatformJob(), jobId: 'notebook_job2_fghijk' },
      ],
    });
    mockProjectId.mockResolvedValue(TEST_PROJECT);
    mockListNotebookJobs.mockReturnValue(resolvedJobs);

    const component = shallow(
      <GcpScheduledJobsPanel gcpService={mockGcpService} isVisible={false} />
    );
    component.setProps({ isVisible: true });
    await resolvedJobs;

    component.find({ title: 'Refresh Jobs' }).simulate('click');
    expect(mockListNotebookJobs).toHaveBeenCalledTimes(2);
  });
});
