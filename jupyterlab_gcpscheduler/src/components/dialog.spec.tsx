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
import { NBTestUtils } from '@jupyterlab/testutils';
import { Dialog } from '@material-ui/core';
import { shallow } from 'enzyme';
import { IconButtonMenu } from 'gcp-jupyterlab-shared';
import * as React from 'react';

import { GcpService } from '../service/gcp';
import { LaunchSchedulerRequest, SchedulerDialog, GcpSettings } from './dialog';
import { INotebookModel } from '@jupyterlab/notebook';
import { TEST_PROJECT, getProjectState } from '../test_helpers';
import {
  ClientTransportService,
  ServerProxyTransportService,
  TransportService,
} from '../service/transport';
import { ProjectStateService, ProjectState } from '../service/project_state';
import { ActionBar } from './action_bar';
import { Initializer } from './initialization/initializer';
import { BUCKET_NAME_SUFFIX } from '../data';

describe('SchedulerDialog', () => {
  const getPermissionsPromise = Promise.resolve({
    toInitialize: [],
    toExecute: [],
    toSchedule: [],
  });
  const mockGetProjectState = jest.fn();
  const mockSetProjectId = jest.fn();
  const mockSetTransportService = jest.fn();
  const mockSettingsChangedConnect = jest.fn();
  const mockSettingsSet = jest.fn();
  const mockGetPermissions = jest.fn();
  const mockProjectStateService = ({
    set projectId(projectId: string) {
      mockSetProjectId(projectId);
    },
    getProjectState: mockGetProjectState,
    getPermissions: mockGetPermissions,
  } as unknown) as ProjectStateService;
  const mockGcpService = {
    set transportService(transportService: TransportService) {
      mockSetTransportService(transportService);
    },
  } as GcpService;
  const fakeNotebook = NBTestUtils.createNotebook();
  NBTestUtils.populateNotebook(fakeNotebook);
  const launchSchedulerRequest: LaunchSchedulerRequest = {
    timestamp: Date.now(),
    notebook: null,
    notebookName: null,
  };

  function getSettings(gcpSettings: Partial<GcpSettings>) {
    return ({
      changed: {
        connect: mockSettingsChangedConnect,
        disconnect: jest.fn(),
      },
      composite: gcpSettings,
      save: jest.fn(),
      set: mockSettingsSet,
    } as unknown) as ISettingRegistry.ISettings;
  }

  beforeEach(() => {
    jest.resetAllMocks();
    jest.useFakeTimers();
    mockGetPermissions.mockReturnValue(getPermissionsPromise);
    launchSchedulerRequest.notebookName = null;
    launchSchedulerRequest.notebook = null;
  });

  it('Renders closed Dialog without Notebook', async () => {
    const settings = getSettings({});
    const dialog = shallow(
      <SchedulerDialog
        projectStateService={mockProjectStateService}
        gcpService={mockGcpService}
        request={launchSchedulerRequest}
        settings={settings}
      />
    );
    expect(settings.changed.connect).toHaveBeenCalled();
    expect(dialog).toMatchSnapshot('Dialog Closed');
  });

  it('Renders with Python2 warning', async () => {
    const settings = getSettings({
      projectId: TEST_PROJECT,
      gcsBucket: 'gs://test-project/notebooks',
      schedulerRegion: 'us-east1',
    });
    launchSchedulerRequest.notebookName = 'p2-nb.ipynb';
    launchSchedulerRequest.notebook = {
      defaultKernelName: 'Python 2',
    } as INotebookModel;

    const dialog = shallow(
      <SchedulerDialog
        projectStateService={mockProjectStateService}
        gcpService={mockGcpService}
        request={launchSchedulerRequest}
        settings={settings}
      />
    );
    expect(settings.changed.connect).toHaveBeenCalled();
    expect(mockSetProjectId).toHaveBeenCalledWith(TEST_PROJECT);
    expect(dialog).toMatchSnapshot('Python2Warning');
  });

  it('Renders with Checking IAM Message', async () => {
    const settings = getSettings({
      projectId: TEST_PROJECT,
      gcsBucket: 'gs://test-project/notebooks',
      schedulerRegion: 'us-east1',
    });
    launchSchedulerRequest.notebookName = 'Foo.ipynb';
    launchSchedulerRequest.notebook = fakeNotebook.model;

    const dialog = shallow(
      <SchedulerDialog
        projectStateService={mockProjectStateService}
        gcpService={mockGcpService}
        request={launchSchedulerRequest}
        settings={settings}
      />
    );
    expect(mockGetPermissions).toHaveBeenCalledTimes(1);
    expect(settings.changed.connect).toHaveBeenCalled();
    expect(mockSetProjectId).toHaveBeenCalledWith(TEST_PROJECT);
    expect(dialog).toMatchSnapshot('IamMessage');
  });

  it('Renders with SchedulerForm', async () => {
    const settings = getSettings({
      projectId: TEST_PROJECT,
      gcsBucket: 'gs://test-project/notebooks',
      schedulerRegion: 'us-east1',
    });
    launchSchedulerRequest.notebookName = 'Foo.ipynb';
    launchSchedulerRequest.notebook = fakeNotebook.model;

    const dialog = shallow(
      <SchedulerDialog
        projectStateService={mockProjectStateService}
        gcpService={mockGcpService}
        request={launchSchedulerRequest}
        settings={settings}
      />
    );
    await getPermissionsPromise;
    expect(mockGetPermissions).toHaveBeenCalledTimes(1);
    expect(settings.changed.connect).toHaveBeenCalled();
    expect(mockSetProjectId).toHaveBeenCalledWith(TEST_PROJECT);
    expect(dialog).toMatchSnapshot('SchedulerForm');
  });

  it('Renders with Initializer', async () => {
    const settings = getSettings({
      projectId: TEST_PROJECT,
    });
    launchSchedulerRequest.notebookName = 'Foo.ipynb';
    launchSchedulerRequest.notebook = fakeNotebook.model;

    const dialog = shallow(
      <SchedulerDialog
        projectStateService={mockProjectStateService}
        gcpService={mockGcpService}
        request={launchSchedulerRequest}
        settings={settings}
      />
    );
    expect(mockSetProjectId).toHaveBeenCalledWith(TEST_PROJECT);
    expect(dialog).toMatchSnapshot('Initializer');
  });

  it('Closes dialog when clicked', async () => {
    const settings = getSettings({
      projectId: TEST_PROJECT,
      gcsBucket: 'gs://test-project/notebooks',
      schedulerRegion: 'us-east1',
    });
    launchSchedulerRequest.notebookName = 'Foo.ipynb';
    launchSchedulerRequest.notebook = fakeNotebook.model;

    const dialog = shallow(
      <SchedulerDialog
        projectStateService={mockProjectStateService}
        gcpService={mockGcpService}
        request={launchSchedulerRequest}
        settings={settings}
      />
    );
    expect(dialog.state('dialogClosedByUser')).toBe(false);
    dialog
      .find(ActionBar)
      .dive()
      .find('button')
      .simulate('click');
    expect(dialog.state('dialogClosedByUser')).toBe(true);
  });

  it('Updates settings from Initializer', async () => {
    const settings = getSettings({});
    const projectState: ProjectState = {
      ...getProjectState(),
      canSubmitScheduledJobs: true,
      hasGcsBucket: true,
      schedulerRegion: 'us-central1',
    };
    launchSchedulerRequest.notebookName = 'Foo.ipynb';
    launchSchedulerRequest.notebook = fakeNotebook.model;

    const dialog = shallow(
      <SchedulerDialog
        projectStateService={mockProjectStateService}
        gcpService={mockGcpService}
        request={launchSchedulerRequest}
        settings={settings}
      />
    );
    dialog.find(Initializer).prop('onInitialized')(projectState);
    expect(mockSettingsSet).toHaveBeenCalledWith(
      'projectId',
      projectState.projectId
    );
    expect(mockSettingsSet).toHaveBeenCalledWith(
      'gcsBucket',
      `gs://${projectState.projectId}${BUCKET_NAME_SUFFIX}`
    );
    expect(mockSettingsSet).toHaveBeenCalledWith(
      'schedulerRegion',
      projectState.schedulerRegion
    );
  });

  it('Clears settings when Reset is clicked', async () => {
    const settings = getSettings({
      projectId: TEST_PROJECT,
      gcsBucket: 'gs://test-project/notebooks',
      schedulerRegion: 'us-east1',
    });
    launchSchedulerRequest.notebookName = 'Foo.ipynb';
    launchSchedulerRequest.notebook = fakeNotebook.model;

    const dialog = shallow(
      <SchedulerDialog
        projectStateService={mockProjectStateService}
        gcpService={mockGcpService}
        request={launchSchedulerRequest}
        settings={settings}
      />
    );

    dialog
      .find(IconButtonMenu)
      .dive()
      .findWhere(w => w.text() === 'Reset configuration')
      .parent()
      .simulate('click');
    expect(settings.save).toHaveBeenCalledWith('{}');
  });

  it('Reopens a closed dialog when request prop changes', async () => {
    const settings = getSettings({
      projectId: TEST_PROJECT,
      gcsBucket: 'gs://test-project/notebooks',
      schedulerRegion: 'us-east1',
    });
    launchSchedulerRequest.notebookName = 'Foo.ipynb';
    launchSchedulerRequest.notebook = fakeNotebook.model;

    const dialog = shallow(
      <SchedulerDialog
        projectStateService={mockProjectStateService}
        gcpService={mockGcpService}
        request={launchSchedulerRequest}
        settings={settings}
      />
    );
    expect(dialog.find(Dialog).prop('open')).toBe(true);
    dialog.setState({ dialogClosedByUser: true });
    expect(dialog.find(Dialog).prop('open')).toBe(false);

    const newRequest: LaunchSchedulerRequest = {
      timestamp: Date.now(),
      notebookName: 'A different notebook.ipynb',
      notebook: launchSchedulerRequest.notebook,
    };
    dialog.setProps({ request: newRequest });
    expect(dialog.find(Dialog).prop('open')).toBe(true);
  });

  it('Uses ClientTransportService when OAuth Client ID is set', () => {
    const settings = getSettings({
      projectId: TEST_PROJECT,
      oAuthClientId: 'test.apps.googleusercontent.com',
    });

    shallow(
      <SchedulerDialog
        projectStateService={mockProjectStateService}
        gcpService={mockGcpService}
        request={launchSchedulerRequest}
        settings={settings}
      />
    );
    expect(mockSetProjectId).toHaveBeenCalledWith(TEST_PROJECT);
    const setTransportServiceCalls = mockSetTransportService.mock.calls;
    expect(setTransportServiceCalls.length).toBe(1);
    expect(setTransportServiceCalls[0][0]).toBeInstanceOf(
      ClientTransportService
    );
  });

  it('Uses ServerProxyTransportService when OAuth Client ID is removed', () => {
    const settings = getSettings({
      projectId: TEST_PROJECT,
      oAuthClientId: 'test.apps.googleusercontent.com',
    });

    mockSettingsChangedConnect.mockImplementation(handler => {
      setTimeout(() => {
        handler(getSettings({ projectId: TEST_PROJECT }));
      }, 1);
    });

    shallow(
      <SchedulerDialog
        projectStateService={mockProjectStateService}
        gcpService={mockGcpService}
        request={launchSchedulerRequest}
        settings={settings}
      />
    );
    const setTransportServiceCalls = mockSetTransportService.mock.calls;
    expect(mockSetProjectId).toHaveBeenCalledWith(TEST_PROJECT);
    expect(setTransportServiceCalls.length).toBe(1);
    expect(setTransportServiceCalls[0][0]).toBeInstanceOf(
      ClientTransportService
    );
    jest.advanceTimersByTime(1);
    expect(setTransportServiceCalls.length).toBe(2);
    expect(setTransportServiceCalls[1][0]).toBeInstanceOf(
      ServerProxyTransportService
    );
  });
});
