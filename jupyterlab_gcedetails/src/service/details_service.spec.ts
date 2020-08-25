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
import { DetailsService, COMPUTE_ENGINE_API_PATH } from './details_service';
import { ServerProxyTransportService } from 'gcp_jupyterlab_shared';
import { MACHINE_TYPES_RESPONSE } from '../test_helpers';

const TEST_PROJECT = 'test-project';
const TEST_ZONE = 'test-zone';

describe('DetailsService', () => {
  const name = `projects/${TEST_PROJECT}/zones/${TEST_ZONE}`;
  const mockSubmit = jest.fn();
  const transportService = ({
    submit: mockSubmit,
  } as unknown) as ServerProxyTransportService;
  let detailsService: DetailsService;

  beforeEach(() => {
    jest.resetAllMocks();
    jest.useFakeTimers();

    detailsService = new DetailsService(transportService);
    detailsService.projectId = TEST_PROJECT;
    detailsService.zone = TEST_ZONE;
  });

  describe('Get Machine Types', () => {
    it('Gets all machine types', async () => {
      mockSubmit.mockResolvedValue(
        asApiResponse({
          items: MACHINE_TYPES_RESPONSE,
        })
      );

      const response = await detailsService.getMachineTypes();

      expect(mockSubmit).toHaveBeenCalledWith({
        path: `${COMPUTE_ENGINE_API_PATH}/${name}/machineTypes`,
        params: {
          filter: 'isSharedCpu = false',
        },
      });
      expect(response).toEqual(MACHINE_TYPES_RESPONSE);
    });

    it('Fails to get machine types', async () => {
      mockSubmit.mockResolvedValue(
        asApiResponse({
          done: true,
          error: { code: 400, message: 'Unable to retrieve machine types.' },
        })
      );

      try {
        await detailsService.getMachineTypes();
      } catch (err) {
        expect(err).toEqual('Unable to retrieve machine types.');
      }

      expect(mockSubmit).toHaveBeenCalledWith({
        path: `${COMPUTE_ENGINE_API_PATH}/${name}/machineTypes`,
        params: {
          filter: 'isSharedCpu = false',
        },
      });
    });
  });
});
