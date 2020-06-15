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

import { JobListItem } from './job_list_item';
import { TEST_PROJECT, getAiPlatformJob } from '../test_helpers';
import { GcpService } from '../service/gcp';
import { IconButtonMenu } from 'gcp-jupyterlab-shared';

const toLocaleString = Date.prototype.toLocaleString;

describe('JobListItem', () => {
  const mockImportNotebook = jest.fn();
  const mockGcpService = ({
    importNotebook: mockImportNotebook,
  } as unknown) as GcpService;

  beforeEach(() => {
    Date.prototype.toLocaleString = jest
      .fn()
      .mockReturnValue('5/1/2020, 3:09:42 PM');
  });

  afterEach(() => {
    Date.prototype.toLocaleString = toLocaleString;
  });

    it('Calls GcpService on Import', () => {
        const jobListItem = shallow(
          <JobListItem
            gcpService={mockGcpService}
            projectId={TEST_PROJECT}
            job={getAiPlatformJob()}
          />
        );
    
        jobListItem
          .find(IconButtonMenu)
          .dive()
          .findWhere(w => w.text() === 'Import')
          .parent()
          .simulate('click');
    
        expect(mockGcpService.importNotebook).toHaveBeenCalledWith(
          'test-project/notebook_job1/job1.ipynb'
        );
      });
    

  it('Renders for successful job', () => {
    const component = shallow(
      <JobListItem
        gcpService={mockGcpService}
        projectId={TEST_PROJECT}
        job={getAiPlatformJob()}
      />
    );
    expect(component).toMatchSnapshot();
  });

  it('Renders for failed job', () => {
    const job = getAiPlatformJob();
    job.state = 'FAILED';
    const component = shallow(
      <JobListItem
        gcpService={mockGcpService}
        projectId={TEST_PROJECT}
        job={getAiPlatformJob()}
      />
    );
    expect(component).toMatchSnapshot();
  });

  it('Renders for running job', () => {
    const job = getAiPlatformJob();
    job.state = 'RUNNING';
    const component = shallow(
      <JobListItem
        gcpService={mockGcpService}
        projectId={TEST_PROJECT}
        job={getAiPlatformJob()}
      />
    );
    expect(component).toMatchSnapshot();
  });
});
