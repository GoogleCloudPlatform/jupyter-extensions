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
const mockGetMetadata = jest.fn();
jest.mock('gcp_jupyterlab_shared', () => {
  const orig = jest.requireActual('gcp_jupyterlab_shared');

  return {
    __esModule: true,
    ...orig,
    getMetadata: mockGetMetadata,
  };
});

import { asApiResponse } from 'gcp_jupyterlab_shared';
import { TEST_PROJECT } from '../test_helpers';
import { ProjectStateService } from './project_state';

describe('ProjectStateService', () => {
  const mockSubmit = jest.fn();
  let projectStateService: ProjectStateService;

  beforeEach(() => {
    jest.resetAllMocks();
    jest.useFakeTimers();

    projectStateService = new ProjectStateService({ submit: mockSubmit });
    projectStateService.projectId = TEST_PROJECT;
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
