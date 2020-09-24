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
import { mount, shallow } from 'enzyme';
import { Message, ToggleSwitch } from 'gcp_jupyterlab_shared';
import * as React from 'react';

import {
  CONTAINER_IMAGES,
  CUSTOM,
  RECURRING,
  DAY,
  WEEK,
  MONTH,
  SCHEDULE_TYPES,
  ACCELERATOR_TYPES,
  ACCELERATOR_TYPES_REDUCED,
} from '../data';
import { GcpService, RunNotebookRequest } from '../service/gcp';
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
import { GcpSettings } from './dialog';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function shallowInnerSchedulerForm(props: any) {
  return shallow(<SchedulerForm {...props} />)
    .dive()
    .find(InnerSchedulerForm)
    .dive();
}

describe('SchedulerForm', () => {
  const notebookName = 'Test Notebook.ipynb';
  const notebookContents = '{"notebook": "test"}';
  const gcsBucket = `gs://${TEST_PROJECT}`;

  const mockUploadNotebook = jest.fn();
  const mockRunNotebook = jest.fn();
  const mockScheduleNotebook = jest.fn();
  const mockNotebookContents = jest.fn();
  const mockDialogClose = jest.fn();
  const mockGetImageUri = jest.fn();
  const mockSettingsGet = jest.fn();
  const mockSettingsSet = jest.fn();
  const mockGcpService = ({
    uploadNotebook: mockUploadNotebook,
    runNotebook: mockRunNotebook,
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

  it('Should populate Run name with Notebook name and timestamp', async () => {
    const fakeTimestamp = 1570406400000;
    jest.spyOn(Date, 'now').mockReturnValue(fakeTimestamp);

    let schedulerForm = mount(<SchedulerForm {...mockProps} />);
    expect(schedulerForm.find('TextInput[name="jobId"]').prop('value')).toBe(
      `test_notebook__${fakeTimestamp}`
    );

    mockProps.notebookName = `path/to/folder/with/${mockProps.notebookName}`;
    schedulerForm = mount(<SchedulerForm {...mockProps} />);
    expect(schedulerForm.find('TextInput[name="jobId"]').prop('value')).toBe(
      `test_notebook__${fakeTimestamp}`
    );

    mockProps.notebookName =
      '/path/to/folder/(1) A Strange Notebook Name.ipynb';
    schedulerForm = mount(<SchedulerForm {...mockProps} />);
    expect(schedulerForm.find('TextInput[name="jobId"]').prop('value')).toBe(
      `a_1__a_strange_notebook_name__${fakeTimestamp}`
    );
  });

  it('Should show error message if run name is empty', async () => {
    const schedulerForm = mount(<SchedulerForm {...mockProps} />);
    simulateFieldChange(schedulerForm, 'input[name="jobId"]', 'jobId', '');
    schedulerForm.find('SubmitButton button').simulate('click');
    await immediatePromise();
    expect(schedulerForm.html()).toContain('Run name is required');
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

  it(`Should show error message if run name contains character other than letter
      , number, and underscore`, async () => {
    const schedulerForm = mount(<SchedulerForm {...mockProps} />);
    simulateFieldChange(schedulerForm, 'input[name="jobId"]', 'jobId', '!');
    await immediatePromise();
    expect(schedulerForm.html()).toContain(
      'Run name can only contain letters, numbers, or underscores.'
    );

    simulateFieldChange(schedulerForm, 'input[name="jobId"]', 'jobId', '  ');
    await immediatePromise();
    expect(schedulerForm.html()).toContain(
      'Run name can only contain letters, numbers, or underscores.'
    );
  });

  it('Should show error message if frequency is empty', async () => {
    const schedulerForm = mount(<SchedulerForm {...mockProps} />);
    simulateFieldChange(
      schedulerForm,
      'input[name="jobId"]',
      'jobId',
      'test_scheduled_job'
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
      'input[name="jobId"]',
      'jobId',
      'test_scheduled_job'
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
      jobId: 'test_scheduled_job',
      imageUri: 'gcr.io/deeplearning-platform-release/base-cpu:latest',
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
      'input[name="jobId"]',
      'jobId',
      'test_scheduled_job'
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
      jobId: 'test_scheduled_job',
      imageUri: 'gcr.io/deeplearning-platform-release/base-cpu:latest',
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
      'input[name="jobId"]',
      'jobId',
      'test_scheduled_job'
    );
    simulateFieldChange(
      schedulerForm,
      'input[name="scheduleType"]',
      'scheduleType',
      RECURRING
    );

    await immediatePromise();
    expect(schedulerForm.find('InnerSchedulerForm').props().values).toEqual({
      jobId: 'test_scheduled_job',
      imageUri: 'gcr.io/deeplearning-platform-release/base-cpu:latest',
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
      'input[name="jobId"]',
      'jobId',
      'test_scheduled_job'
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
      'input[name="sundayRun"]',
      'sundayRun',
      true
    );
    simulateCheckBoxChange(
      schedulerForm,
      'input[name="fridayRun"]',
      'fridayRun',
      true
    );
    await immediatePromise();
    expect(schedulerForm.find('InnerSchedulerForm').props().values).toEqual({
      jobId: 'test_scheduled_job',
      imageUri: 'gcr.io/deeplearning-platform-release/base-cpu:latest',
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
      'input[name="jobId"]',
      'jobId',
      'test_scheduled_job'
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
      'input[name="wednesdayRun"]',
      'wednesdayRun',
      true
    );
    simulateCheckBoxChange(
      schedulerForm,
      'input[name="saturdayRun"]',
      'saturdayRun',
      true
    );
    await immediatePromise();
    expect(schedulerForm.find('InnerSchedulerForm').props().values).toEqual({
      jobId: 'test_scheduled_job',
      imageUri: 'gcr.io/deeplearning-platform-release/base-cpu:latest',
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
      'input[name="wednesdayRun"]',
      'wednesdayRun',
      false
    );
    simulateCheckBoxChange(
      schedulerForm,
      'input[name="saturdayRun"]',
      'saturdayRun',
      false
    );
    expect(schedulerForm.find('InnerSchedulerForm').props().values).toEqual({
      jobId: 'test_scheduled_job',
      imageUri: 'gcr.io/deeplearning-platform-release/base-cpu:latest',
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

  it('Should only allow single runs if there is no scheduler region', async () => {
    const gcpSettings: GcpSettings = {
      ...mockProps.gcpSettings,
      schedulerRegion: '',
    };
    const props = { ...mockProps, gcpSettings };
    const schedulerForm = shallowInnerSchedulerForm(props);
    expect(
      schedulerForm.find('SelectInput[name="scheduleType"]').prop('options')
    ).toEqual([SCHEDULE_TYPES[0]]);
  });

  it('Updates settings accordingly when new values are empty', async () => {
    const uploadNotebookPromise = triggeredResolver();
    const runNotebookPromise = triggeredResolver({ jobId: 'aiplatform_job_1' });

    mockNotebookContents.mockReturnValue(notebookContents);
    mockUploadNotebook.mockReturnValue(uploadNotebookPromise.promise);
    mockRunNotebook.mockReturnValue(runNotebookPromise.promise);
    mockSettingsGet
      .mockReturnValueOnce({ composite: 'us-central1' })
      .mockReturnValueOnce({ composite: 'CUSTOM' })
      .mockReturnValueOnce({ composite: 'n1-standard-4' })
      .mockReturnValueOnce({ composite: 'NVIDIA_TESLA_K80' })
      .mockReturnValueOnce({ composite: '1' })
      .mockReturnValueOnce({
        composite: 'gcr.io/deeplearning-platform-release/base-cpu:latest',
      });

    const props = {
      ...mockProps,
      gcpSettings: {
        projectId: TEST_PROJECT,
        gcsBucket: gcsBucket,
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
      'input[name="jobId"]',
      'jobId',
      'test_immediate_job'
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
            'Uploading Test Notebook.ipynb to gs://test-project/test_immediate_job/Test Notebook.ipynb'
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
          text={'Submitting Job to AI Platform'}
        />
      )
    ).toBe(true);

    runNotebookPromise.resolve();
    await runNotebookPromise.promise;
    schedulerForm.update();

    const gcsPath = `${gcsBucket}/test_immediate_job/${notebookName}`;
    expect(mockGcpService.uploadNotebook).toHaveBeenCalledWith(
      notebookContents,
      gcsPath
    );
    const aiPlatformRequest: RunNotebookRequest = {
      jobId: 'test_immediate_job',
      imageUri: 'gcr.io/deeplearning-platform-release/base-cpu:latest',
      inputNotebookGcsPath: gcsPath,
      masterType: '',
      outputNotebookGcsPath: `${gcsBucket}/test_immediate_job/test_immediate_job.ipynb`,
      scaleTier: 'BASIC',
      region: 'us-central1',
      acceleratorType: '',
      acceleratorCount: '',
    };
    expect(mockGcpService.runNotebook).toHaveBeenCalledWith(aiPlatformRequest);
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
    const runNotebookPromise = triggeredResolver({ jobId: 'aiplatform_job_1' });

    mockNotebookContents.mockReturnValue(notebookContents);
    mockUploadNotebook.mockReturnValue(uploadNotebookPromise.promise);
    mockRunNotebook.mockReturnValue(runNotebookPromise.promise);

    const props = {
      ...mockProps,
      gcpSettings: {
        projectId: TEST_PROJECT,
        gcsBucket: gcsBucket,
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
      'input[name="jobId"]',
      'jobId',
      'test_immediate_job'
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
            'Uploading Test Notebook.ipynb to gs://test-project/test_immediate_job/Test Notebook.ipynb'
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
          text={'Submitting Job to AI Platform'}
        />
      )
    ).toBe(true);

    runNotebookPromise.resolve();
    await runNotebookPromise.promise;
    schedulerForm.update();

    const gcsPath = `${gcsBucket}/test_immediate_job/${notebookName}`;
    expect(mockGcpService.uploadNotebook).toHaveBeenCalledWith(
      notebookContents,
      gcsPath
    );
    const aiPlatformRequest: RunNotebookRequest = {
      jobId: 'test_immediate_job',
      imageUri: 'gcr.io/deeplearning-platform-release/base-cpu:latest',
      inputNotebookGcsPath: gcsPath,
      masterType: 'n1-standard-4',
      outputNotebookGcsPath: `${gcsBucket}/test_immediate_job/test_immediate_job.ipynb`,
      scaleTier: 'CUSTOM',
      region: 'us-central1',
      acceleratorType: 'NVIDIA_TESLA_K80',
      acceleratorCount: '1',
    };
    expect(mockGcpService.runNotebook).toHaveBeenCalledWith(aiPlatformRequest);
    expect(mockSettings.set).toHaveBeenCalledWith(
      'jobRegion',
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
      'containerImage',
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
      name: 'cloudscheduler_job_1',
    });

    mockNotebookContents.mockReturnValue(notebookContents);
    mockUploadNotebook.mockReturnValue(uploadNotebookPromise.promise);
    mockScheduleNotebook.mockReturnValue(scheduleNotebookPromise.promise);
    mockSettingsGet
      .mockReturnValueOnce({ composite: 'us-east1' })
      .mockReturnValueOnce({ composite: 'CUSTOM' })
      .mockReturnValueOnce({ composite: 'n1-standard-16' })
      .mockReturnValueOnce({ composite: 'NVIDIA_TESLA_K80' })
      .mockReturnValueOnce({ composite: '1' })
      .mockReturnValueOnce({
        composite: 'gcr.io/deeplearning-platform-release/tf-gpu.1-15:latest',
      });

    const schedulerForm = mount(<SchedulerForm {...mockProps} />);
    simulateFieldChange(
      schedulerForm,
      'input[name="jobId"]',
      'jobId',
      'test_scheduled_job'
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
      String(CONTAINER_IMAGES[2].value)
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
          text={'Submitting Job to Cloud Scheduler'}
        />
      )
    ).toBe(true);

    scheduleNotebookPromise.resolve();
    await scheduleNotebookPromise.promise;
    schedulerForm.update();

    const gcsPath = `${gcsBucket}/test_scheduled_job/${notebookName}`;
    expect(mockGcpService.uploadNotebook).toHaveBeenCalledWith(
      notebookContents,
      gcsPath
    );
    const aiPlatformRequest: RunNotebookRequest = {
      jobId: 'test_scheduled_job',
      imageUri: 'gcr.io/deeplearning-platform-release/tf-gpu.1-15:latest',
      inputNotebookGcsPath: gcsPath,
      masterType: 'n1-standard-16',
      outputNotebookGcsPath: `${gcsBucket}/test_scheduled_job/test_scheduled_job.ipynb`,
      scaleTier: 'CUSTOM',
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

  it('Fails to upload Notebook to GCS', async () => {
    mockNotebookContents.mockReturnValue(notebookContents);
    mockUploadNotebook.mockRejectedValue('UNAVAILABLE: GCS is unavailable');

    const schedulerForm = mount(<SchedulerForm {...mockProps} />);

    simulateFieldChange(
      schedulerForm,
      'input[name="jobId"]',
      'jobId',
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
    expect(mockGcpService.runNotebook).not.toHaveBeenCalled();
    expect(schedulerForm.find(SubmittedJob).exists()).toBe(false);
  });

  it('Fails to submit job', async () => {
    mockNotebookContents.mockReturnValue(notebookContents);
    mockUploadNotebook.mockResolvedValue(true);
    mockRunNotebook.mockRejectedValue(
      'PERMISSION_DENIED: User does not have necessary permissions'
    );

    const schedulerForm = mount(<SchedulerForm {...mockProps} />);

    simulateFieldChange(
      schedulerForm,
      'input[name="jobId"]',
      'jobId',
      'test_failed_job_submission'
    );

    // Submit the form and wait for an immediate promise to flush other promises
    schedulerForm.find('SubmitButton button').simulate('click');
    await immediatePromise();
    schedulerForm.update();

    const gcsPath = `${gcsBucket}/test_failed_job_submission/${notebookName}`;
    const errorText =
      'PERMISSION_DENIED: User does not have necessary permissions: Unable to submit job';
    expect(
      schedulerForm.contains(
        <Message asActivity={false} asError={true} text={errorText} />
      )
    ).toBe(true);

    expect(mockGcpService.uploadNotebook).toHaveBeenCalledWith(
      notebookContents,
      gcsPath
    );
    const aiPlatformRequest: RunNotebookRequest = {
      jobId: 'test_failed_job_submission',
      imageUri: 'gcr.io/deeplearning-platform-release/base-cpu:latest',
      inputNotebookGcsPath: gcsPath,
      masterType: '',
      outputNotebookGcsPath: `${gcsBucket}/test_failed_job_submission/test_failed_job_submission.ipynb`,
      scaleTier: 'BASIC',
      region: 'us-central1',
      acceleratorType: '',
      acceleratorCount: '',
    };
    expect(mockGcpService.runNotebook).toHaveBeenCalledWith(aiPlatformRequest);
    expect(schedulerForm.find(SubmittedJob).exists()).toBe(false);
  });
});
