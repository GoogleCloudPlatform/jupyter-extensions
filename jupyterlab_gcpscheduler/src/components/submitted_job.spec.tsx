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

import * as React from 'react';
import { shallow } from 'enzyme';

import { SubmittedJob } from './submitted_job';
import { TEST_PROJECT } from '../test_helpers';
import { RunNotebookRequest } from '../service/gcp';

describe('SubmittedJob', () => {
  const projectId = TEST_PROJECT;
  const gcsBucket = `gs://${TEST_PROJECT}`;
  const mockOnFormReset = jest.fn();
  const mockDialogClose = jest.fn();
  const request: RunNotebookRequest = {
    jobId: 'test_job_1234',
    imageUri: 'gcr.io/deeplearning-platform-release/tf-gpu.1-15:latest',
    inputNotebookGcsPath: `${gcsBucket}/test_job_1234/test_job_1234.ipynb`,
    masterType: 'complex_model_m_gpu',
    outputNotebookGcsPath: `${gcsBucket}/test_job/test_job.ipynb`,
    scaleTier: 'CUSTOM',
    region: 'us-east1',
  };
  const mockProps = {
    onDialogClose: mockDialogClose,
    onFormReset: mockOnFormReset,
    request,
    projectId,
    schedule: '',
  };

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('Renders for immediate job', async () => {
    const creator = shallow(<SubmittedJob {...mockProps} />);
    expect(creator).toMatchSnapshot();
  });

  it('Renders for scheduled job', async () => {
    mockProps.schedule = '0 15 * * *';
    const creator = shallow(<SubmittedJob {...mockProps} />);
    expect(creator).toMatchSnapshot();
  });

  it('Invokes onFormReset when Submit another job is clicked', async () => {
    const creator = shallow(<SubmittedJob {...mockProps} />);
    creator.find('button').simulate('click');
    expect(mockOnFormReset).toHaveBeenCalled();
  });
});
