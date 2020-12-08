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

import { ISettingRegistry } from '@jupyterlab/coreutils';
import { INotebookModel } from '@jupyterlab/notebook';
import { mount } from 'enzyme';
import { Message, ToggleSwitch } from 'gcp_jupyterlab_shared';
import * as React from 'react';

import {
  CUSTOM_CONTAINER,
  ENVIRONMENT_IMAGES,
  CUSTOM,
  RECURRING,
  DAY,
  WEEK,
  MONTH,
  ACCELERATOR_TYPES,
  ACCELERATOR_TYPES_REDUCED,
} from '../data';
import { GcpService } from '../service/gcp';
import { ExecuteNotebookRequest } from '../interfaces';
import { GetPermissionsResponse } from '../service/project_state';
import { SchedulerForm, InnerSchedulerForm } from './scheduler_form';
import { SubmittedJob } from './submitted_job';

import {
  immediatePromise,
  triggeredResolver,
  TEST_PROJECT,
  simulateCheckBoxChange,
  simulateFieldChange,
} from '../test_helpers';

describe('SchedulerForm', () => {
  const notebookName = 'Test Notebook.ipynb';
  const notebookContents = '{"notebook": "test"}';
  const gcsBucket = `gs://${TEST_PROJECT}`;

  const mockUploadNotebook = jest.fn();
  const mockExecuteNotebook = jest.fn();
  const mockScheduleNotebook = jest.fn();
  const mockNotebookContents = jest.fn();
  const mockDialogClose = jest.fn();
  const mockScheduleTypeChange = jest.fn();
  const mockShowFormChange = jest.fn();
  const mockGetImageUri = jest.fn();
  const mockSettingsGet = jest.fn();
  const mockSettingsSet = jest.fn();
  const mockGcpService = ({
    uploadNotebook: mockUploadNotebook,
    executeNotebook: mockExecuteNotebook,
    scheduleNotebook: mockScheduleNotebook,
    getImageUri: mockGetImageUri,
  } as unknown) as GcpService;
  const mockNotebook = ({
    toString: mockNotebookContents,
  } as unknown) as INotebookModel;
  const mockSettings = ({
    get: mockSettingsGet,
    set: mockSettingsSet,
  } as unknown) as ISettingRegistry.ISettings;
  const permissions: GetPermissionsResponse = {
    toInitialize: [],
    toExecute: [],
    toSchedule: [],
  };

  const mockProps = {
    gcpService: mockGcpService,
    gcpSettings: {
      projectId: TEST_PROJECT,
      gcsBucket: gcsBucket,
      schedulerRegion: 'us-east1',
    },
    notebook: mockNotebook,
    notebookName,
    onDialogClose: mockDialogClose,
    settings: mockSettings,
    permissions,
    onScheduleTypeChange: mockScheduleTypeChange,
    onShowFormChange: mockShowFormChange,
  };

  beforeEach(() => {
    jest.resetAllMocks();
    mockProps.notebookName = notebookName;
    mockGetImageUri.mockResolvedValue('');
    mockSettingsGet.mockReturnValue({});
    mockSettingsSet.mockResolvedValue(null);
  });

  it('Toggles visibility based on Scale tier', async () => {
    const schedulerForm = mount(<SchedulerForm {...mockProps} />);
    expect(schedulerForm.find('input[name="masterType"]')).toHaveLength(0);
    expect(schedulerForm.find('input[name="acceleratorType"]')).toHaveLength(0);
    expect(schedulerForm.find('input[name="acceleratorCount"]')).toHaveLength(
      0
    );
    simulateFieldChange(
      schedulerForm,
      'input[name="scaleTier"]',
      'scaleTier',
      CUSTOM
    );

    await immediatePromise();
    expect(schedulerForm.find('InnerSchedulerForm').props().values).toEqual(
      expect.objectContaining({
        acceleratorCount: '',
        acceleratorType: '',
        masterType: 'n1-standard-4',
        scaleTier: 'CUSTOM',
      })
    );
  });

  it('Updates available Accelerator Types based on selected Master Type', async () => {
    spyOn(global.Date, 'now').and.returnValue(1593194344000);
    const schedulerForm = mount(<SchedulerForm {...mockProps} />);
    simulateFieldChange(
      schedulerForm,
      'input[name="scaleTier"]',
      'scaleTier',
      CUSTOM
    );

    expect(
      schedulerForm.find('SelectInput[name="acceleratorType"]').prop('options')
    ).toEqual(ACCELERATOR_TYPES);

    simulateFieldChange(
      schedulerForm,
      'input[name="masterType"]',
      'masterType',
      'n1-standard-64'
    );

    expect(
      schedulerForm.find('SelectInput[name="acceleratorType"]').prop('options')
    ).toEqual(ACCELERATOR_TYPES_REDUCED);

    await immediatePromise();
    expect(schedulerForm.find('InnerSchedulerForm').props().values).toEqual(
      expect.objectContaining({
        acceleratorCount: '',
        acceleratorType: '',
        masterType: 'n1-standard-64',
        scaleTier: 'CUSTOM',
      })
    );
  });

  it('Updates acceleratorCount based on acceleratorType', async () => {
    const schedulerForm = mount(<SchedulerForm {...mockProps} />);
    simulateFieldChange(
      schedulerForm,
      'input[name="scaleTier"]',
      'scaleTier',
      CUSTOM
    );
    expect(schedulerForm.find('input[name="acceleratorCount"]').length).toBe(0);
    simulateFieldChange(
      schedulerForm,
      'input[name="acceleratorType"]',
      'acceleratorType',
      'NVIDIA_TESLA_P4'
    );

    await immediatePromise();
    expect(schedulerForm.find('InnerSchedulerForm').props().values).toEqual(
      expect.objectContaining({
        acceleratorCount: '1',
        acceleratorType: 'NVIDIA_TESLA_P4',
        masterType: 'n1-standard-4',
        scaleTier: 'CUSTOM',
      })
    );

    simulateFieldChange(
      schedulerForm,
      'input[name="acceleratorType"]',
      'acceleratorType',
      ''
    );

    await immediatePromise();
    expect(schedulerForm.find('InnerSchedulerForm').props().values).toEqual(
      expect.objectContaining({
        acceleratorCount: '',
        acceleratorType: '',
        masterType: 'n1-standard-4',
        scaleTier: 'CUSTOM',
      })
    );
  });

  it('Toggles Schedule visibility based on Frequency', async () => {
    const schedulerForm = mount(<SchedulerForm {...mockProps} />);
    expect(schedulerForm.find('input[name="schedule"]')).toHaveLength(0);
    expect(schedulerForm.find('input[name="frequency"]')).toHaveLength(0);

    simulateFieldChange(
      schedulerForm,
      'input[name="scheduleType"]',
      'scheduleType',
      RECURRING
    );

    expect(schedulerForm.find('input[name="schedule"]')).toHaveLength(0);
    expect(schedulerForm.find('input[name="frequency"]')).toHaveLength(1);
  });

  it('Toggles Schedule Builder to show Advanced Builder', async () => {
    const schedulerForm = mount(<SchedulerForm {...mockProps} />);
    expect(schedulerForm.find('input[name="schedule"]')).toHaveLength(0);
    expect(schedulerForm.find('input[name="frequency"]')).toHaveLength(0);
    simulateFieldChange(
      schedulerForm,
      'input[name="scheduleType"]',
      'scheduleType',
      RECURRING
    );
    schedulerForm
      .find(ToggleSwitch)
      .find('input')
      .simulate('change', {
        target: { checked: true },
      });
    expect(schedulerForm.find('input[name="schedule"]')).toHaveLength(1);
    expect(schedulerForm.find('input[name="frequency"]')).toHaveLength(0);
  });

  it('Should populate Execution name with Notebook name and timestamp', async () => {
    const fakeTimestamp = 1570406400000;
    jest.spyOn(Date, 'now').mockReturnValue(fakeTimestamp);

    let schedulerForm = mount(<SchedulerForm {...mockProps} />);
    expect(schedulerForm.find('TextInput[name="name"]').prop('value')).toBe(
      `test_notebook__${fakeTimestamp}`
    );

    mockProps.notebookName = `path/to/folder/with/${mockProps.notebookName}`;
    schedulerForm = mount(<SchedulerForm {...mockProps} />);
    expect(schedulerForm.find('TextInput[name="name"]').prop('value')).toBe(
      `test_notebook__${fakeTimestamp}`
    );

    mockProps.notebookName =
      '/path/to/folder/(1) A Strange Notebook Name.ipynb';
    schedulerForm = mount(<SchedulerForm {...mockProps} />);
    expect(schedulerForm.find('TextInput[name="name"]').prop('value')).toBe(
      `a_1__a_strange_notebook_name__${fakeTimestamp}`
    );
  });

  it('Should show error message if execution name is empty', async () => {
    const schedulerForm = mount(<SchedulerForm {...mockProps} />);
    simulateFieldChange(schedulerForm, 'input[name="name"]', 'name', '');
    schedulerForm.find('SubmitButton button').simulate('click');
    await immediatePromise();
    expect(schedulerForm.html()).toContain('Execution name is required');
  });

  it('Should show error message if bucket is empty', async () => {
    const schedulerForm = mount(<SchedulerForm {...mockProps} />);
    (schedulerForm
      .find('InnerSchedulerForm')
      .instance() as InnerSchedulerForm).updateGcsBucket(null);
    schedulerForm.find('SubmitButton button').simulate('click');
    await immediatePromise();
    expect(schedulerForm.html()).toContain(
      'A cloud storage bucket is required to store results'
    );
  });

  it('Should prepopulate imageUri if it match options in form', async () => {
    mockGetImageUri.mockResolvedValue(
      'gcr.io/deeplearning-platform-release/tf-gpu.1-15'
    );
    const schedulerForm = mount(<SchedulerForm {...mockProps} />);

    await immediatePromise();
    schedulerForm.update();

    expect(schedulerForm.find('input[name="imageUri"]').props().value).toBe(
      'gcr.io/deeplearning-platform-release/tf-gpu.1-15:latest'
    );
  });

  it('Should prepopulate imageUri if it does not match options in form', async () => {
    mockGetImageUri.mockResolvedValue(
      'gcr.io/deeplearning-platform-release/tf-gpu.1-23:latest'
    );
    const schedulerForm = mount(<SchedulerForm {...mockProps} />);

    await immediatePromise();
    schedulerForm.update();

    expect(schedulerForm.find('input[name="imageUri"]').props().value).toBe(
      CUSTOM_CONTAINER.value
    );
    expect(
      schedulerForm.find('input[name="customContainerImageUri"]').props().value
    ).toBe('gcr.io/deeplearning-platform-release/tf-gpu.1-23:latest');
  });

  it('Should prepopulate imageUri if it is empty', async () => {
    mockGetImageUri.mockResolvedValue('');
    const schedulerForm = mount(<SchedulerForm {...mockProps} />);

    await immediatePromise();
    schedulerForm.update();

    expect(schedulerForm.find('input[name="imageUri"]').props().value).toBe(
      'gcr.io/deeplearning-platform-release/tf-cpu.1-15:latest'
    );
  });

  it(`Should show error message if execution name contains character other than letter
      , number, and underscore`, async () => {
    const schedulerForm = mount(<SchedulerForm {...mockProps} />);
    simulateFieldChange(schedulerForm, 'input[name="name"]', 'name', '!');
    await immediatePromise();
    expect(schedulerForm.html()).toContain(
      'Execution name can only contain letters, numbers, or underscores.'
    );

    simulateFieldChange(schedulerForm, 'input[name="name"]', 'name', '  ');
    await immediatePromise();
    expect(schedulerForm.html()).toContain(
      'Execution name can only contain letters, numbers, or underscores.'
    );
  });

  it('Should show error message if frequency is empty', async () => {
    const schedulerForm = mount(<SchedulerForm {...mockProps} />);
    simulateFieldChange(
      schedulerForm,
      'input[name="name"]',
      'name',
      'test_schedule'
    );
    simulateFieldChange(
      schedulerForm,
      'input[name="scheduleType"]',
      'scheduleType',
      RECURRING
    );
    schedulerForm
      .find(ToggleSwitch)
      .find('input')
      .simulate('change', {
        target: { checked: true },
      });
    simulateFieldChange(
      schedulerForm,
      'input[name="schedule"]',
      'schedule',
      ''
    );
    schedulerForm.find('SubmitButton button').simulate('click');
    await immediatePromise();
    expect(schedulerForm.html()).toContain('Frequency is required');
  });

  it('Should show schedule if frequency type is DAY', async () => {
    const schedulerForm = mount(<SchedulerForm {...mockProps} />);
    simulateFieldChange(
      schedulerForm,
      'input[name="name"]',
      'name',
      'test_schedule'
    );
    simulateFieldChange(
      schedulerForm,
      'input[name="scheduleType"]',
      'scheduleType',
      RECURRING
    );

    simulateFieldChange(
      schedulerForm,
      'input[name="frequencyType"]',
      'frequencyType',
      DAY
    );
    await immediatePromise();
    expect(schedulerForm.find('InnerSchedulerForm').props().values).toEqual({
      name: 'test_schedule',
      gcsBucket: 'gs://test-project',
      imageUri: 'gcr.io/deeplearning-platform-release/tf-cpu.1-15:latest',
      region: 'us-central1',
      scaleTier: 'BASIC',
      masterType: '',
      acceleratorCount: '',
      acceleratorType: '',
      scheduleType: 'recurring',
      schedule: '00 14 */1 * *',
    });
  });

  it('Should show schedule if frequency type is MONTH', async () => {
    const schedulerForm = mount(<SchedulerForm {...mockProps} />);
    simulateFieldChange(
      schedulerForm,
      'input[name="name"]',
      'name',
      'test_schedule'
    );
    simulateFieldChange(
      schedulerForm,
      'input[name="scheduleType"]',
      'scheduleType',
      RECURRING
    );

    simulateFieldChange(
      schedulerForm,
      'input[name="frequencyType"]',
      'frequencyType',
      MONTH
    );
    await immediatePromise();
    expect(schedulerForm.find('InnerSchedulerForm').props().values).toEqual({
      name: 'test_schedule',
      gcsBucket: 'gs://test-project',
      imageUri: 'gcr.io/deeplearning-platform-release/tf-cpu.1-15:latest',
      region: 'us-central1',
      scaleTier: 'BASIC',
      acceleratorCount: '',
      acceleratorType: '',
      masterType: '',
      scheduleType: 'recurring',
      schedule: '00 12 1 */1 *',
    });
  });

  it('Should show schedule if frequency type is HOUR', async () => {
    const schedulerForm = mount(<SchedulerForm {...mockProps} />);
    simulateFieldChange(
      schedulerForm,
      'input[name="name"]',
      'name',
      'test_schedule'
    );
    simulateFieldChange(
      schedulerForm,
      'input[name="scheduleType"]',
      'scheduleType',
      RECURRING
    );

    await immediatePromise();
    expect(schedulerForm.find('InnerSchedulerForm').props().values).toEqual({
      name: 'test_schedule',
      gcsBucket: 'gs://test-project',
      imageUri: 'gcr.io/deeplearning-platform-release/tf-cpu.1-15:latest',
      region: 'us-central1',
      scaleTier: 'BASIC',
      acceleratorCount: '',
      acceleratorType: '',
      masterType: '',
      scheduleType: 'recurring',
      schedule: '00 */1 * * *',
    });
  });

  it('Should show schedule if frequency type is WEEK', async () => {
    const schedulerForm = mount(<SchedulerForm {...mockProps} />);
    simulateFieldChange(
      schedulerForm,
      'input[name="name"]',
      'name',
      'test_schedule'
    );
    simulateFieldChange(
      schedulerForm,
      'input[name="scheduleType"]',
      'scheduleType',
      RECURRING
    );

    simulateFieldChange(
      schedulerForm,
      'input[name="frequencyType"]',
      'frequencyType',
      WEEK
    );
    simulateCheckBoxChange(
      schedulerForm,
      'input[name="sundayExecution"]',
      'sundayExecution',
      true
    );
    simulateCheckBoxChange(
      schedulerForm,
      'input[name="fridayExecution"]',
      'fridayExecution',
      true
    );
    await immediatePromise();
    expect(schedulerForm.find('InnerSchedulerForm').props().values).toEqual({
      name: 'test_schedule',
      gcsBucket: 'gs://test-project',
      imageUri: 'gcr.io/deeplearning-platform-release/tf-cpu.1-15:latest',
      region: 'us-central1',
      scaleTier: 'BASIC',
      acceleratorCount: '',
      acceleratorType: '',
      masterType: '',
      scheduleType: 'recurring',
      schedule: '00 09 * * 0,5',
    });
  });

  it('Should toggle schedule if frequency type is WEEK', async () => {
    const schedulerForm = mount(<SchedulerForm {...mockProps} />);
    simulateFieldChange(
      schedulerForm,
      'input[name="name"]',
      'name',
      'test_schedule'
    );
    simulateFieldChange(
      schedulerForm,
      'input[name="scheduleType"]',
      'scheduleType',
      RECURRING
    );

    simulateFieldChange(
      schedulerForm,
      'input[name="frequencyType"]',
      'frequencyType',
      WEEK
    );
    simulateCheckBoxChange(
      schedulerForm,
      'input[name="wednesdayExecution"]',
      'wednesdayExecution',
      true
    );
    simulateCheckBoxChange(
      schedulerForm,
      'input[name="saturdayExecution"]',
      'saturdayExecution',
      true
    );
    await immediatePromise();
    expect(schedulerForm.find('InnerSchedulerForm').props().values).toEqual({
      name: 'test_schedule',
      gcsBucket: 'gs://test-project',
      imageUri: 'gcr.io/deeplearning-platform-release/tf-cpu.1-15:latest',
      region: 'us-central1',
      scaleTier: 'BASIC',
      acceleratorCount: '',
      acceleratorType: '',
      masterType: '',
      scheduleType: 'recurring',
      schedule: '00 09 * * 3,6',
    });
    simulateCheckBoxChange(
      schedulerForm,
      'input[name="wednesdayExecution"]',
      'wednesdayExecution',
      false
    );
    simulateCheckBoxChange(
      schedulerForm,
      'input[name="saturdayExecution"]',
      'saturdayExecution',
      false
    );
    expect(schedulerForm.find('InnerSchedulerForm').props().values).toEqual({
      name: 'test_schedule',
      gcsBucket: 'gs://test-project',
      imageUri: 'gcr.io/deeplearning-platform-release/tf-cpu.1-15:latest',
      region: 'us-central1',
      scaleTier: 'BASIC',
      acceleratorCount: '',
      acceleratorType: '',
      masterType: '',
      scheduleType: 'recurring',
      schedule: '',
    });
  });

  it('Should show error message if missing permissions', async () => {
    const missingPermissions: GetPermissionsResponse = {
      ...permissions,
      toExecute: ['ml.jobs.create'],
      toSchedule: ['cloudscheduler.jobs.create'],
    };
    const props = { ...mockProps, permissions: missingPermissions };
    const schedulerForm = mount(<SchedulerForm {...props} />);
    expect(
      schedulerForm.contains(
        <Message
          asError={true}
          text={'The following IAM permissions are missing: ml.jobs.create'}
        />
      )
    ).toBe(true);

    simulateFieldChange(
      schedulerForm,
      'input[name="scheduleType"]',
      'scheduleType',
      RECURRING
    );
    expect(
      schedulerForm.contains(
        <Message
          asError={true}
          text={
            'The following IAM permissions are missing: cloudscheduler.jobs.create'
          }
        />
      )
    ).toBe(true);
  });

  it('Should show error message if missing custom container', async () => {
    const props = { ...mockProps };
    const schedulerForm = mount(<SchedulerForm {...props} />);

    simulateFieldChange(
      schedulerForm,
      'input[name="imageUri"]',
      'imageUri',
      String(CUSTOM_CONTAINER.value)
    );
    simulateFieldChange(
      schedulerForm,
      'input[name="customContainerImageUri"]',
      'customContainerImageUri',
      ''
    );

    schedulerForm.find('SubmitButton button').simulate('click');
    await immediatePromise();
    schedulerForm.update();

    expect(schedulerForm.html()).toContain(
      'A docker container image must be provided for a custom container'
    );
  });

  it('Updates settings accordingly when new values are empty', async () => {
    const uploadNotebookPromise = triggeredResolver();
    const executeNotebookPromise = triggeredResolver({
      name: 'aiplatform_execution_1',
    });

    mockNotebookContents.mockReturnValue(notebookContents);
    mockUploadNotebook.mockReturnValue(uploadNotebookPromise.promise);
    mockExecuteNotebook.mockReturnValue(executeNotebookPromise.promise);
    mockSettingsGet
      .mockReturnValueOnce({ composite: 'us-central1' })
      .mockReturnValueOnce({ composite: 'CUSTOM' })
      .mockReturnValueOnce({ composite: 'gs://test-project' })
      .mockReturnValueOnce({ composite: 'n1-standard-4' })
      .mockReturnValueOnce({ composite: 'NVIDIA_TESLA_K80' })
      .mockReturnValueOnce({ composite: '1' })
      .mockReturnValueOnce({
        composite: 'gcr.io/deeplearning-platform-release/tf-cpu.1-15:latest',
      });

    const props = {
      ...mockProps,
      gcpSettings: {
        projectId: TEST_PROJECT,
        schedulerRegion: 'us-central1',
        scaleTier: 'CUSTOM',
        gcsBucket: 'gs://test-project',
        masterType: 'n1-standard-4',
        acceleratorType: 'NVIDIA_TESLA_K80',
        acceleratorCount: '1',
      },
    };
    const schedulerForm = mount(<SchedulerForm {...props} />);

    simulateFieldChange(
      schedulerForm,
      'input[name="name"]',
      'name',
      'test_execution'
    );

    simulateFieldChange(
      schedulerForm,
      'input[name="scaleTier"]',
      'scaleTier',
      'BASIC'
    );

    // Submit the form and wait for an immediate promise to flush other promises
    schedulerForm.find('SubmitButton button').simulate('click');
    await immediatePromise();
    schedulerForm.update();
    expect(
      schedulerForm.contains(
        <Message
          asActivity={true}
          asError={false}
          text={
            'Uploading Test Notebook.ipynb to gs://test-project/test_execution/Test Notebook.ipynb'
          }
        />
      )
    ).toBe(true);

    uploadNotebookPromise.resolve();
    await uploadNotebookPromise.promise;
    schedulerForm.update();
    expect(
      schedulerForm.contains(
        <Message
          asError={false}
          asActivity={true}
          text={'Submitting execution'}
        />
      )
    ).toBe(true);

    executeNotebookPromise.resolve();
    await executeNotebookPromise.promise;
    schedulerForm.update();

    const gcsPath = `${gcsBucket}/test_execution/${notebookName}`;
    expect(mockGcpService.uploadNotebook).toHaveBeenCalledWith(
      notebookContents,
      gcsPath
    );
    const aiPlatformRequest: ExecuteNotebookRequest = {
      name: 'test_execution',
      imageUri: 'gcr.io/deeplearning-platform-release/tf-cpu.1-15:latest',
      inputNotebookGcsPath: gcsPath,
      masterType: '',
      outputNotebookGcsPath: `${gcsBucket}/test_execution/test_execution.ipynb`,
      scaleTier: 'BASIC',
      gcsBucket: 'gs://test-project',
      region: 'us-central1',
      acceleratorType: '',
      acceleratorCount: '',
    };
    expect(mockGcpService.executeNotebook).toHaveBeenCalledWith(
      aiPlatformRequest
    );
    expect(mockSettings.set).toHaveBeenCalledWith(
      'scaleTier',
      aiPlatformRequest.scaleTier
    );
    expect(mockSettings.set).toHaveBeenCalledWith(
      'masterType',
      aiPlatformRequest.masterType
    );
    expect(mockSettings.set).toHaveBeenCalledWith(
      'acceleratorType',
      aiPlatformRequest.acceleratorType
    );
    expect(mockSettings.set).toHaveBeenCalledWith(
      'acceleratorCount',
      aiPlatformRequest.acceleratorCount
    );
    expect(schedulerForm.find('form').exists()).toBe(false);

    const submittedJob = schedulerForm.find(SubmittedJob);
    expect(submittedJob.exists()).toBe(true);
    expect(submittedJob.prop('request')).toEqual(aiPlatformRequest);
    expect(submittedJob.prop('schedule')).toBeUndefined();
    expect(submittedJob.prop('projectId')).toBe(TEST_PROJECT);
  });

  it('Submits an immediate job to AI Platform', async () => {
    const uploadNotebookPromise = triggeredResolver();
    const executeNotebookPromise = triggeredResolver({
      name: 'aiplatform_execution_1',
    });

    mockNotebookContents.mockReturnValue(notebookContents);
    mockUploadNotebook.mockReturnValue(uploadNotebookPromise.promise);
    mockExecuteNotebook.mockReturnValue(executeNotebookPromise.promise);

    const props = {
      ...mockProps,
      gcpSettings: {
        projectId: TEST_PROJECT,
        gcsBucket: 'gs://test-project',
        schedulerRegion: 'us-central1',
        scaleTier: 'CUSTOM',
        masterType: 'n1-standard-4',
        acceleratorType: 'NVIDIA_TESLA_K80',
        acceleratorCount: '1',
      },
    };
    const schedulerForm = mount(<SchedulerForm {...props} />);

    simulateFieldChange(
      schedulerForm,
      'input[name="name"]',
      'name',
      'test_execution'
    );

    // Submit the form and wait for an immediate promise to flush other promises
    schedulerForm.find('SubmitButton button').simulate('click');
    await immediatePromise();
    schedulerForm.update();
    expect(
      schedulerForm.contains(
        <Message
          asActivity={true}
          asError={false}
          text={
            'Uploading Test Notebook.ipynb to gs://test-project/test_execution/Test Notebook.ipynb'
          }
        />
      )
    ).toBe(true);

    uploadNotebookPromise.resolve();
    await uploadNotebookPromise.promise;
    schedulerForm.update();
    expect(
      schedulerForm.contains(
        <Message
          asError={false}
          asActivity={true}
          text={'Submitting execution'}
        />
      )
    ).toBe(true);

    executeNotebookPromise.resolve();
    await executeNotebookPromise.promise;
    schedulerForm.update();

    const gcsPath = `${gcsBucket}/test_execution/${notebookName}`;
    expect(mockGcpService.uploadNotebook).toHaveBeenCalledWith(
      notebookContents,
      gcsPath
    );
    const aiPlatformRequest: ExecuteNotebookRequest = {
      name: 'test_execution',
      imageUri: 'gcr.io/deeplearning-platform-release/tf-cpu.1-15:latest',
      inputNotebookGcsPath: gcsPath,
      masterType: 'n1-standard-4',
      outputNotebookGcsPath: `${gcsBucket}/test_execution/test_execution.ipynb`,
      scaleTier: 'CUSTOM',
      gcsBucket: 'gs://test-project',
      region: 'us-central1',
      acceleratorType: 'NVIDIA_TESLA_K80',
      acceleratorCount: '1',
    };
    expect(mockGcpService.executeNotebook).toHaveBeenCalledWith(
      aiPlatformRequest
    );
    expect(mockSettings.set).toHaveBeenCalledWith(
      'region',
      aiPlatformRequest.region
    );
    expect(mockSettings.set).toHaveBeenCalledWith(
      'scaleTier',
      aiPlatformRequest.scaleTier
    );
    expect(mockSettings.set).toHaveBeenCalledWith(
      'masterType',
      aiPlatformRequest.masterType
    );
    expect(mockSettings.set).toHaveBeenCalledWith(
      'acceleratorType',
      aiPlatformRequest.acceleratorType
    );
    expect(mockSettings.set).toHaveBeenCalledWith(
      'acceleratorCount',
      aiPlatformRequest.acceleratorCount
    );
    expect(mockSettings.set).toHaveBeenCalledWith(
      'environmentImage',
      aiPlatformRequest.imageUri
    );
    expect(schedulerForm.find('form').exists()).toBe(false);

    const submittedJob = schedulerForm.find(SubmittedJob);
    expect(submittedJob.exists()).toBe(true);
    expect(submittedJob.prop('request')).toEqual(aiPlatformRequest);
    expect(submittedJob.prop('schedule')).toBeUndefined();
    expect(submittedJob.prop('projectId')).toBe(TEST_PROJECT);
  });

  it('Submits a scheduled job to Cloud Scheduler', async () => {
    const uploadNotebookPromise = triggeredResolver();
    const scheduleNotebookPromise = triggeredResolver({
      name: 'scheduler_execution',
    });

    mockNotebookContents.mockReturnValue(notebookContents);
    mockUploadNotebook.mockReturnValue(uploadNotebookPromise.promise);
    mockScheduleNotebook.mockReturnValue(scheduleNotebookPromise.promise);
    mockSettingsGet
      .mockReturnValueOnce({ composite: 'us-east1' })
      .mockReturnValueOnce({ composite: 'CUSTOM' })
      .mockReturnValueOnce({ composite: 'gs://test-project' })
      .mockReturnValueOnce({ composite: 'n1-standard-16' })
      .mockReturnValueOnce({ composite: 'NVIDIA_TESLA_K80' })
      .mockReturnValueOnce({ composite: '1' })
      .mockReturnValueOnce({
        composite: 'gcr.io/deeplearning-platform-release/tf-gpu.1-15:latest',
      });

    const schedulerForm = mount(<SchedulerForm {...mockProps} />);
    simulateFieldChange(
      schedulerForm,
      'input[name="name"]',
      'name',
      'test_schedule'
    );
    simulateFieldChange(
      schedulerForm,
      'input[name="region"]',
      'region',
      'us-east1'
    );
    simulateFieldChange(
      schedulerForm,
      'input[name="scaleTier"]',
      'scaleTier',
      CUSTOM
    );
    simulateFieldChange(
      schedulerForm,
      'input[name="masterType"]',
      'masterType',
      'n1-standard-16'
    );
    simulateFieldChange(
      schedulerForm,
      'input[name="acceleratorType"]',
      'acceleratorType',
      'NVIDIA_TESLA_K80'
    );
    simulateFieldChange(
      schedulerForm,
      'input[name="acceleratorCount"]',
      'acceleratorCount',
      '1'
    );
    simulateFieldChange(
      schedulerForm,
      'input[name="imageUri"]',
      'imageUri',
      String(ENVIRONMENT_IMAGES[2].value)
    );
    simulateFieldChange(
      schedulerForm,
      'input[name="scheduleType"]',
      'scheduleType',
      RECURRING
    );
    schedulerForm
      .find(ToggleSwitch)
      .find('input')
      .simulate('change', {
        target: { checked: true },
      });
    simulateFieldChange(
      schedulerForm,
      'input[name="schedule"]',
      'schedule',
      '0 0 * * *'
    );
    // Submit the form and wait for an immediate promise to flush other promises
    schedulerForm.find('SubmitButton button').simulate('click');
    await immediatePromise();
    uploadNotebookPromise.resolve();
    await uploadNotebookPromise.promise;
    schedulerForm.update();
    expect(
      schedulerForm.contains(
        <Message
          asError={false}
          asActivity={true}
          text={'Submitting schedule'}
        />
      )
    ).toBe(true);

    scheduleNotebookPromise.resolve();
    await scheduleNotebookPromise.promise;
    schedulerForm.update();

    const gcsPath = `${gcsBucket}/test_schedule/${notebookName}`;
    expect(mockGcpService.uploadNotebook).toHaveBeenCalledWith(
      notebookContents,
      gcsPath
    );
    const aiPlatformRequest: ExecuteNotebookRequest = {
      name: 'test_schedule',
      imageUri: 'gcr.io/deeplearning-platform-release/tf-gpu.1-15:latest',
      inputNotebookGcsPath: gcsPath,
      masterType: 'n1-standard-16',
      outputNotebookGcsPath: `${gcsBucket}/test_schedule/test_schedule.ipynb`,
      scaleTier: 'CUSTOM',
      gcsBucket: 'gs://test-project',
      region: 'us-east1',
      acceleratorType: 'NVIDIA_TESLA_K80',
      acceleratorCount: '1',
    };
    expect(mockGcpService.scheduleNotebook).toHaveBeenCalledWith(
      aiPlatformRequest,
      'us-east1',
      '0 0 * * *'
    );
    expect(mockSettingsSet).not.toHaveBeenCalled();
    expect(schedulerForm.find('form').exists()).toBe(false);

    const submittedJob = schedulerForm.find(SubmittedJob);
    expect(submittedJob.exists()).toBe(true);
    expect(submittedJob.prop('request')).toEqual(aiPlatformRequest);
    expect(submittedJob.prop('schedule')).toBe('0 0 * * *');
    expect(submittedJob.prop('projectId')).toBe(TEST_PROJECT);

    // Simulate reset
    submittedJob.prop('onFormReset')();
    schedulerForm.update();
    expect(schedulerForm.find(SubmittedJob).exists()).toBe(false);
    expect(schedulerForm.find('form').exists()).toBe(true);
  });

  it('Submits an immediate job with custom container to AI Platform', async () => {
    const uploadNotebookPromise = triggeredResolver();
    const executeNotebookPromise = triggeredResolver({
      name: 'aiplatform_execution_1',
    });

    mockNotebookContents.mockReturnValue(notebookContents);
    mockUploadNotebook.mockReturnValue(uploadNotebookPromise.promise);
    mockExecuteNotebook.mockReturnValue(executeNotebookPromise.promise);

    const schedulerForm = mount(<SchedulerForm {...mockProps} />);

    simulateFieldChange(
      schedulerForm,
      'input[name="name"]',
      'name',
      'test_execution'
    );

    simulateFieldChange(
      schedulerForm,
      'input[name="imageUri"]',
      'imageUri',
      String(CUSTOM_CONTAINER.value)
    );
    simulateFieldChange(
      schedulerForm,
      'input[name="customContainerImageUri"]',
      'customContainerImageUri',
      'gcr.io/test'
    );

    // Submit the form and wait for an immediate promise to flush other promises
    schedulerForm.find('SubmitButton button').simulate('click');
    await immediatePromise();
    schedulerForm.update();

    uploadNotebookPromise.resolve();
    await uploadNotebookPromise.promise;
    schedulerForm.update();
    expect(
      schedulerForm.contains(
        <Message
          asError={false}
          asActivity={true}
          text={'Submitting execution'}
        />
      )
    ).toBe(true);

    executeNotebookPromise.resolve();
    await executeNotebookPromise.promise;
    schedulerForm.update();

    const gcsPath = `${gcsBucket}/test_execution/${notebookName}`;
    const aiPlatformRequest: ExecuteNotebookRequest = {
      name: 'test_execution',
      imageUri: 'gcr.io/test',
      inputNotebookGcsPath: gcsPath,
      masterType: '',
      outputNotebookGcsPath: `${gcsBucket}/test_execution/test_execution.ipynb`,
      scaleTier: 'BASIC',
      gcsBucket: 'gs://test-project',
      region: 'us-central1',
      acceleratorType: '',
      acceleratorCount: '',
    };

    expect(mockGcpService.executeNotebook).toHaveBeenCalledWith(
      aiPlatformRequest
    );
  });

  it('Fails to upload Notebook to GCS', async () => {
    mockNotebookContents.mockReturnValue(notebookContents);
    mockUploadNotebook.mockRejectedValue('UNAVAILABLE: GCS is unavailable');

    const schedulerForm = mount(<SchedulerForm {...mockProps} />);

    simulateFieldChange(
      schedulerForm,
      'input[name="name"]',
      'name',
      'test_failed_upload'
    );

    // Submit the form and wait for an immediate promise to flush other promises
    schedulerForm.find('SubmitButton button').simulate('click');
    await immediatePromise();
    schedulerForm.update();

    const gcsPath = `${gcsBucket}/test_failed_upload/${notebookName}`;
    const errorText =
      'UNAVAILABLE: GCS is unavailable: Unable to upload Test ' +
      'Notebook.ipynb to gs://test-project/test_failed_upload/Test Notebook.ipynb';
    expect(
      schedulerForm.contains(
        <Message asActivity={false} asError={true} text={errorText} />
      )
    ).toBe(true);

    expect(mockGcpService.uploadNotebook).toHaveBeenCalledWith(
      notebookContents,
      gcsPath
    );
    expect(mockGcpService.executeNotebook).not.toHaveBeenCalled();
    expect(schedulerForm.find(SubmittedJob).exists()).toBe(false);
  });

  it('Fails to submit execution', async () => {
    mockNotebookContents.mockReturnValue(notebookContents);
    mockUploadNotebook.mockResolvedValue(true);
    mockExecuteNotebook.mockRejectedValue(
      'PERMISSION_DENIED: User does not have necessary permissions'
    );

    const schedulerForm = mount(<SchedulerForm {...mockProps} />);

    simulateFieldChange(
      schedulerForm,
      'input[name="name"]',
      'name',
      'test_failed_execution'
    );

    // Submit the form and wait for an immediate promise to flush other promises
    schedulerForm.find('SubmitButton button').simulate('click');
    await immediatePromise();
    schedulerForm.update();

    const gcsPath = `${gcsBucket}/test_failed_execution/${notebookName}`;
    const errorText =
      'PERMISSION_DENIED: User does not have necessary permissions: Unable to submit execution';
    expect(
      schedulerForm.contains(
        <Message asActivity={false} asError={true} text={errorText} />
      )
    ).toBe(true);

    expect(mockGcpService.uploadNotebook).toHaveBeenCalledWith(
      notebookContents,
      gcsPath
    );
    const aiPlatformRequest: ExecuteNotebookRequest = {
      name: 'test_failed_execution',
      imageUri: 'gcr.io/deeplearning-platform-release/tf-cpu.1-15:latest',
      inputNotebookGcsPath: gcsPath,
      masterType: '',
      outputNotebookGcsPath: `${gcsBucket}/test_failed_execution/test_failed_execution.ipynb`,
      scaleTier: 'BASIC',
      gcsBucket: 'gs://test-project',
      region: 'us-central1',
      acceleratorType: '',
      acceleratorCount: '',
    };
    expect(mockGcpService.executeNotebook).toHaveBeenCalledWith(
      aiPlatformRequest
    );
    expect(schedulerForm.find(SubmittedJob).exists()).toBe(false);
  });
});
