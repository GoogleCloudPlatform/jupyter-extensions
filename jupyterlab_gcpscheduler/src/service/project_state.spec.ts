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

/* eslint-disable @typescript-eslint/camelcase */
import { ServerConnection } from '@jupyterlab/services';

import { BUCKET_NAME_SUFFIX, CLOUD_FUNCTION_REGION } from '../data';
import { ApiRequest } from './transport';
import {
  getProjectState,
  TEST_PROJECT,
  asApiResponse,
  asFetchResponse,
} from '../test_helpers';
import { ProjectStateService } from './project_state';

const _setTimeout = global.setTimeout;

// Helper to ensure that interval calls to the poller are scheduled immediately
// Implementation borrowed from
// https://github.com/facebook/jest/issues/7151#issuecomment-463370069
function pollerHelper(): () => void {
  let running = false;
  const start = async () => {
    running = true;
    while (running) {
      jest.runOnlyPendingTimers();
      await new Promise(r => _setTimeout(r, 1));
    }
  };
  start();
  return () => {
    running = false;
  };
}

describe('ProjectStateService', () => {
  const mockSubmit = jest.fn();
  const mockMakeRequest = jest.fn();
  const projectStateService = new ProjectStateService({ submit: mockSubmit });

  beforeEach(() => {
    jest.resetAllMocks();
    jest.useFakeTimers();

    ServerConnection.makeRequest = mockMakeRequest;

    projectStateService.projectId = TEST_PROJECT;
  });

  describe('API Services', () => {
    it('Gets fully enabled project state', async () => {
      mockSubmit.mockImplementation((request: ApiRequest) => {
        if (request.path.indexOf('servicemanagement') >= 0) {
          return asApiResponse({
            services: [
              { serviceName: 'storage-api.googleapis.com' },
              { serviceName: 'cloudscheduler.googleapis.com' },
              { serviceName: 'ml.googleapis.com' },
              { serviceName: 'cloudfunctions.googleapis.com' },
            ],
          });
        } else if (request.path.indexOf('cloudfunctions') >= 0) {
          return asApiResponse({
            name: 'submitScheduledNotebook',
            status: 'ACTIVE',
            httpsTrigger: {
              path: 'https://mycloudfunctiourl.goog',
            },
          });
        } else if (request.path.indexOf('storage') >= 0) {
          return asApiResponse({
            name: `${TEST_PROJECT}${BUCKET_NAME_SUFFIX}`,
          });
        } else if (request.path.indexOf('cloudscheduler') >= 0) {
          return asApiResponse({
            locations: [{ locationId: CLOUD_FUNCTION_REGION }],
          });
        }
      });
      const projectState = await projectStateService.getProjectState();
      const expectedState = getProjectState();
      expectedState.allServicesEnabled = true;
      expectedState.requiredServicesEnabled = true;
      expectedState.hasGcsBucket = true;
      expectedState.hasCloudFunction = true;
      expectedState.schedulerRegion = CLOUD_FUNCTION_REGION;
      expectedState.canSubmitImmediateJobs = true;
      expectedState.canSubmitScheduledJobs = true;
      expectedState.serviceStatuses.forEach(s => {
        s.enabled = true;
      });

      expect(projectState).toEqual(expectedState);
      expect(mockSubmit).toHaveBeenCalledTimes(4);
      expect(mockSubmit).toHaveBeenCalledWith({
        params: {
          consumerId: `project:${TEST_PROJECT}`,
          pageSize: 100,
        },
        path: 'https://servicemanagement.googleapis.com/v1/services',
      });
      expect(mockSubmit).toHaveBeenCalledWith({
        path: `https://cloudscheduler.googleapis.com/v1/projects/${TEST_PROJECT}/locations`,
      });
      expect(mockSubmit).toHaveBeenCalledWith({
        path: `https://www.googleapis.com/storage/v1/b/${TEST_PROJECT}${BUCKET_NAME_SUFFIX}`,
      });
      expect(mockSubmit).toHaveBeenCalledWith({
        path: `https://cloudfunctions.googleapis.com/v1/projects/${TEST_PROJECT}/locations/us-central1/functions/submitScheduledNotebook`,
      });
    });

    it('Gets project state with disabled APIs and no resources', async () => {
      mockSubmit.mockImplementation((request: ApiRequest) => {
        if (request.path.indexOf('servicemanagement') >= 0) {
          return asApiResponse({ services: [] });
        } else if (request.path.match(/(cloudfunctions|storage)/)) {
          return Promise.reject('404 Not Found');
        } else if (request.path.indexOf('cloudscheduler') >= 0) {
          return Promise.reject('403 Not Authorized');
        }
      });

      const projectState = await projectStateService.getProjectState();

      expect(projectState).toEqual(getProjectState());
      expect(mockSubmit).toHaveBeenCalledTimes(4);
      expect(mockSubmit).toHaveBeenCalledWith({
        params: {
          consumerId: `project:${TEST_PROJECT}`,
          pageSize: 100,
        },
        path: 'https://servicemanagement.googleapis.com/v1/services',
      });
      expect(mockSubmit).toHaveBeenCalledWith({
        path: `https://cloudscheduler.googleapis.com/v1/projects/${TEST_PROJECT}/locations`,
      });
      expect(mockSubmit).toHaveBeenCalledWith({
        path: `https://www.googleapis.com/storage/v1/b/${TEST_PROJECT}${BUCKET_NAME_SUFFIX}`,
      });
      expect(mockSubmit).toHaveBeenCalledWith({
        path: `https://cloudfunctions.googleapis.com/v1/projects/${TEST_PROJECT}/locations/us-central1/functions/submitScheduledNotebook`,
      });
    });

    it('Gets empty project state with project ID from server', async () => {
      const project = 'other-project-id';
      projectStateService.projectId = null;
      mockMakeRequest.mockReturnValue(asFetchResponse({ project }));
      mockSubmit.mockImplementation((request: ApiRequest) => {
        if (request.path.indexOf('servicemanagement') >= 0) {
          return asApiResponse({ services: [] });
        } else if (request.path.match(/(cloudfunctions|storage)/)) {
          return Promise.reject('404 Not Found');
        } else if (request.path.indexOf('cloudscheduler') >= 0) {
          return Promise.reject('403 Not Authorized');
        }
      });

      const projectState = await projectStateService.getProjectState();
      const expectedState = getProjectState();
      expectedState.projectId = project;
      expect(projectState).toEqual(expectedState);
      expect(mockSubmit).toHaveBeenCalledTimes(4);
      expect(mockSubmit).toHaveBeenCalledWith({
        params: {
          consumerId: `project:${project}`,
          pageSize: 100,
        },
        path: 'https://servicemanagement.googleapis.com/v1/services',
      });
      expect(mockSubmit).toHaveBeenCalledWith({
        path: `https://cloudscheduler.googleapis.com/v1/projects/${project}/locations`,
      });
      expect(mockSubmit).toHaveBeenCalledWith({
        path: `https://www.googleapis.com/storage/v1/b/${project}${BUCKET_NAME_SUFFIX}`,
      });
      expect(mockSubmit).toHaveBeenCalledWith({
        path: `https://cloudfunctions.googleapis.com/v1/projects/${project}/locations/us-central1/functions/submitScheduledNotebook`,
      });
    });

    it('Gets project state with no Cloud Function', async () => {
      mockSubmit.mockImplementation((request: ApiRequest) => {
        if (request.path.indexOf('servicemanagement') >= 0) {
          return asApiResponse({
            services: [
              { serviceName: 'storage-api.googleapis.com' },
              { serviceName: 'cloudscheduler.googleapis.com' },
              { serviceName: 'ml.googleapis.com' },
            ],
          });
        } else if (request.path.indexOf('cloudfunctions') >= 0) {
          return Promise.reject('404 Not Found');
        } else if (request.path.indexOf('storage') >= 0) {
          return asApiResponse({
            name: `${TEST_PROJECT}${BUCKET_NAME_SUFFIX}`,
          });
        } else if (request.path.indexOf('cloudscheduler') >= 0) {
          return asApiResponse({
            locations: [{ locationId: 'us-east1' }],
          });
        }
      });
      const projectState = await projectStateService.getProjectState();
      const expectedState = getProjectState();
      expectedState.allServicesEnabled = false;
      expectedState.requiredServicesEnabled = true;
      expectedState.hasGcsBucket = true;
      expectedState.hasCloudFunction = false;
      expectedState.schedulerRegion = 'us-east1';
      expectedState.canSubmitImmediateJobs = true;
      expectedState.canSubmitScheduledJobs = false;
      expectedState.serviceStatuses.forEach(s => {
        s.enabled = s.service.endpoint.startsWith('cloudfunctions')
          ? false
          : true;
      });

      expect(projectState).toEqual(expectedState);
      expect(mockSubmit).toHaveBeenCalledTimes(4);
      expect(mockSubmit).toHaveBeenCalledWith({
        params: {
          consumerId: `project:${TEST_PROJECT}`,
          pageSize: 100,
        },
        path: 'https://servicemanagement.googleapis.com/v1/services',
      });
      expect(mockSubmit).toHaveBeenCalledWith({
        path: `https://cloudscheduler.googleapis.com/v1/projects/${TEST_PROJECT}/locations`,
      });
      expect(mockSubmit).toHaveBeenCalledWith({
        path: `https://www.googleapis.com/storage/v1/b/${TEST_PROJECT}${BUCKET_NAME_SUFFIX}`,
      });
      expect(mockSubmit).toHaveBeenCalledWith({
        path: `https://cloudfunctions.googleapis.com/v1/projects/${TEST_PROJECT}/locations/us-central1/functions/submitScheduledNotebook`,
      });
    });

    it('Enables services', async () => {
      let operationNo = 1;
      mockSubmit.mockImplementation((request: ApiRequest) => {
        if (request.path.endsWith('enable')) {
          // Enable requests
          return asApiResponse({ name: `operation${operationNo++}` });
        } else {
          // Operation polls
          return asApiResponse({
            done: true,
            response: { name: request.path.split('/').pop() },
          });
        }
      });

      const stopTimers = pollerHelper();
      const operations = await projectStateService.enableServices([
        'service1',
        'service2',
      ]);
      stopTimers();
      expect(operations).toHaveLength(2);
      expect(mockSubmit).toHaveBeenCalledTimes(4);
      expect(mockSubmit).toHaveBeenCalledWith({
        body: { consumerId: 'project:test-project' },
        method: 'POST',
        path:
          'https://servicemanagement.googleapis.com/v1/services/service1:enable',
      });
      expect(mockSubmit).toHaveBeenCalledWith({
        body: { consumerId: 'project:test-project' },
        method: 'POST',
        path:
          'https://servicemanagement.googleapis.com/v1/services/service2:enable',
      });
      expect(mockSubmit).toHaveBeenCalledWith({
        path: `https://servicemanagement.googleapis.com/v1/operation1`,
      });
      expect(mockSubmit).toHaveBeenCalledWith({
        path: `https://servicemanagement.googleapis.com/v1/operation2`,
      });
    });

    it('Fails to retrieve a project ID', async () => {
      projectStateService.projectId = null;
      mockMakeRequest.mockRejectedValue('Unable to retrieve project');

      expect.assertions(3);
      try {
        await projectStateService.getProjectState();
      } catch (err) {
        expect(err).toBe('Unable to retrieve project');
      }
      const url = mockMakeRequest.mock.calls[0][0];
      expect(mockMakeRequest).toHaveBeenCalledTimes(1);
      expect(url).toMatch(new RegExp('/gcp/v1/project$'));
    });

    it('Enables services with failed operations', async () => {
      let operationNo = 1;
      mockSubmit.mockImplementation((request: ApiRequest) => {
        if (request.path.endsWith('enable')) {
          // Enable requests
          return asApiResponse({ name: `operation${operationNo++}` });
        } else {
          // Operation polls
          const operation = request.path.split('/').pop();
          const response: any = { done: true };
          if (operation === 'operation2') {
            response.error = { code: 500, message: `${operation} failed` };
          } else {
            response.response = `${operation} finished`;
          }
          return asApiResponse(response);
        }
      });

      const stopTimers = pollerHelper();
      expect.assertions(6);
      try {
        await projectStateService.enableServices(['service1', 'service2']);
      } catch (err) {
        expect(err).toEqual('500: operation2 failed');
      }
      stopTimers();
      expect(mockSubmit).toHaveBeenCalledTimes(4);
      expect(mockSubmit).toHaveBeenCalledWith({
        body: { consumerId: 'project:test-project' },
        method: 'POST',
        path:
          'https://servicemanagement.googleapis.com/v1/services/service1:enable',
      });
      expect(mockSubmit).toHaveBeenCalledWith({
        body: { consumerId: 'project:test-project' },
        method: 'POST',
        path:
          'https://servicemanagement.googleapis.com/v1/services/service2:enable',
      });
      expect(mockSubmit).toHaveBeenCalledWith({
        path: `https://servicemanagement.googleapis.com/v1/operation1`,
      });
      expect(mockSubmit).toHaveBeenCalledWith({
        path: `https://servicemanagement.googleapis.com/v1/operation2`,
      });
    });
  });

  describe('GCS', () => {
    const bucketName = `${TEST_PROJECT}${BUCKET_NAME_SUFFIX}`;

    it('Creates a Bucket', async () => {
      mockSubmit.mockReturnValue(asApiResponse({ name: bucketName }));

      const bucket = await projectStateService.createBucket();

      expect(bucket.name).toBe(bucketName);
      expect(mockSubmit).toHaveBeenCalledWith({
        body: {
          name: 'test-project-scheduled-notebooks',
          versioning: { enabled: true },
        },
        method: 'POST',
        params: { project: 'test-project' },
        path: 'https://www.googleapis.com/storage/v1/b',
      });
    });

    it('Throws an error when creating a Bucket', async () => {
      const error = {
        error: { code: 400, message: 'Could not create bucket' },
      };
      mockSubmit.mockRejectedValue(asApiResponse(error));

      expect.assertions(2);
      try {
        await projectStateService.createBucket();
      } catch (err) {
        expect(err).toEqual('400: Could not create bucket');
      }
      expect(mockSubmit).toHaveBeenCalledWith({
        body: {
          name: 'test-project-scheduled-notebooks',
          versioning: { enabled: true },
        },
        method: 'POST',
        params: { project: 'test-project' },
        path: 'https://www.googleapis.com/storage/v1/b',
      });
    });
  });

  describe('Cloud Functions', () => {
    const createPath =
      'https://cloudfunctions.googleapis.com/v1/projects/test-project/locations/us-central1/functions';

    it('Creates new Function', async () => {
      // Mock a chain of requests so the operation poller has to poll twice
      const createdFunction = {
        name:
          'projects/test-project/locations/us-central1/functions/submitScheduledNotebook',
        httpsTrigger: {
          path:
            'https://us-central1-test-project.cloudfunctions.net/submitScheduledNotebook',
        },
      };
      mockSubmit
        .mockReturnValueOnce(asApiResponse({ name: 'createoperation' }))
        .mockReturnValueOnce(asApiResponse({ done: false }))
        .mockReturnValueOnce(
          asApiResponse({ done: true, response: createdFunction })
        );

      const stopTimers = pollerHelper();
      const cloudFunction = await projectStateService.createCloudFunction(
        CLOUD_FUNCTION_REGION
      );
      stopTimers();

      expect(cloudFunction).toEqual(createdFunction);
      expect(mockSubmit).toHaveBeenCalledTimes(3);
      expect(mockSubmit).toHaveBeenNthCalledWith(1, {
        path: createPath,
        method: 'POST',
        body: {
          name:
            'projects/test-project/locations/us-central1/functions/submitScheduledNotebook',
          description: 'Submits a Notebook Job on AI Platform',
          entryPoint: 'submitScheduledNotebook',
          runtime: 'nodejs10',
          sourceArchiveUrl:
            'gs://deeplearning-platform-ui-public/gcp_scheduled_notebook_helper.zip',
          httpsTrigger: {},
        },
      });
      expect(mockSubmit).toHaveBeenNthCalledWith(2, {
        path: 'https://cloudfunctions.googleapis.com/v1/createoperation',
      });
      expect(mockSubmit).toHaveBeenNthCalledWith(3, {
        path: 'https://cloudfunctions.googleapis.com/v1/createoperation',
      });
    });

    it('Fails to create new Function', async () => {
      // Mock a chain of requests so the operation poller has to poll twice
      mockSubmit
        .mockReturnValueOnce(asApiResponse({ name: 'createoperation' }))
        .mockReturnValueOnce(asApiResponse({ done: false }))
        .mockReturnValueOnce(
          asApiResponse({
            done: true,
            error: { code: 400, message: 'Could not create Function' },
          })
        );

      const stopTimers = pollerHelper();
      expect.assertions(5);
      try {
        await projectStateService.createCloudFunction(CLOUD_FUNCTION_REGION);
      } catch (err) {
        expect(err).toEqual('400: Could not create Function');
      }
      stopTimers();

      expect(mockSubmit).toHaveBeenCalledTimes(3);
      expect(mockSubmit).toHaveBeenNthCalledWith(1, {
        path: createPath,
        method: 'POST',
        body: {
          name:
            'projects/test-project/locations/us-central1/functions/submitScheduledNotebook',
          description: 'Submits a Notebook Job on AI Platform',
          entryPoint: 'submitScheduledNotebook',
          runtime: 'nodejs10',
          sourceArchiveUrl:
            'gs://deeplearning-platform-ui-public/gcp_scheduled_notebook_helper.zip',
          httpsTrigger: {},
        },
      });
      expect(mockSubmit).toHaveBeenNthCalledWith(2, {
        path: 'https://cloudfunctions.googleapis.com/v1/createoperation',
      });
      expect(mockSubmit).toHaveBeenNthCalledWith(3, {
        path: 'https://cloudfunctions.googleapis.com/v1/createoperation',
      });
    });

    it('Retries polling', async () => {
      mockSubmit.mockImplementation((request: ApiRequest) => {
        if (request.path === createPath) {
          return asApiResponse({ name: 'createoperation' });
        } else {
          return Promise.reject('Unexpected error fetching operation');
        }
      });

      const stopTimers = pollerHelper();
      expect.assertions(6);
      try {
        await projectStateService.createCloudFunction(CLOUD_FUNCTION_REGION);
      } catch (err) {
        expect(err).toEqual('Unexpected error fetching operation');
      }
      stopTimers();

      expect(mockSubmit).toHaveBeenCalledTimes(4);
      expect(mockSubmit).toHaveBeenNthCalledWith(1, {
        path:
          'https://cloudfunctions.googleapis.com/v1/projects/test-project/locations/us-central1/functions',
        method: 'POST',
        body: {
          name:
            'projects/test-project/locations/us-central1/functions/submitScheduledNotebook',
          description: 'Submits a Notebook Job on AI Platform',
          entryPoint: 'submitScheduledNotebook',
          runtime: 'nodejs10',
          sourceArchiveUrl:
            'gs://deeplearning-platform-ui-public/gcp_scheduled_notebook_helper.zip',
          httpsTrigger: {},
        },
      });
      expect(mockSubmit).toHaveBeenNthCalledWith(2, {
        path: 'https://cloudfunctions.googleapis.com/v1/createoperation',
      });
      expect(mockSubmit).toHaveBeenNthCalledWith(3, {
        path: 'https://cloudfunctions.googleapis.com/v1/createoperation',
      });
      expect(mockSubmit).toHaveBeenNthCalledWith(4, {
        path: 'https://cloudfunctions.googleapis.com/v1/createoperation',
      });
    });
  });

  describe('IAM Permissions', () => {
    const allPermissions = [
      'appengine.applications.create',
      'cloudfunctions.functions.create',
      'serviceusage.services.enable',
      'storage.buckets.create',
      'storage.objects.create',
      'ml.jobs.create',
      'cloudscheduler.jobs.create',
    ];

    it('Gets IAM permissions with none returned', async () => {
      mockSubmit.mockResolvedValue(asApiResponse({}));

      const response = await projectStateService.getPermissions();
      expect(response).toEqual({
        toInitialize: [
          'appengine.applications.create',
          'cloudfunctions.functions.create',
          'serviceusage.services.enable',
          'storage.buckets.create',
        ],
        toExecute: ['storage.objects.create', 'ml.jobs.create'],
        toSchedule: ['storage.objects.create', 'cloudscheduler.jobs.create'],
      });
      expect(mockSubmit).toHaveBeenCalledWith({
        body: {
          permissions: allPermissions,
        },
        method: 'POST',
        path:
          'https://cloudresourcemanager.googleapis.com/v1/projects/test-project:testIamPermissions',
      });
    });

    it('Gets IAM permissions with all returned', async () => {
      mockSubmit.mockResolvedValue(
        asApiResponse({
          permissions: allPermissions,
        })
      );

      const response = await projectStateService.getPermissions();
      expect(response).toEqual({
        toInitialize: [],
        toExecute: [],
        toSchedule: [],
      });
    });

    it('Gets IAM permissions with some returned', async () => {
      mockSubmit.mockResolvedValue(
        asApiResponse({
          permissions: [
            'appengine.applications.create',
            'serviceusage.services.enable',
            'storage.buckets.create',
          ],
        })
      );

      const response = await projectStateService.getPermissions();
      expect(response).toEqual({
        toInitialize: ['cloudfunctions.functions.create'],
        toExecute: ['ml.jobs.create'],
        toSchedule: ['cloudscheduler.jobs.create'],
      });
    });

    it('Gets IAM permissions with request error', async () => {
      mockSubmit.mockRejectedValue(
        asApiResponse({
          error: {
            status: 'NOT_AUTHORIZED',
            message: 'Not Authorized',
          },
        })
      );

      const response = await projectStateService.getPermissions();
      expect(response).toEqual({
        toInitialize: [],
        toExecute: [],
        toSchedule: [],
      });
    });
  });
});
