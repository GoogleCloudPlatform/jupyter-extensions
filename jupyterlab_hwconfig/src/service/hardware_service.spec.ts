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

import {
  asApiResponse,
  ServerProxyTransportService,
} from 'gcp_jupyterlab_shared';
import { HardwareService, COMPUTE_ENGINE_API_PATH } from './hardware_service';
import {
  MACHINE_TYPES_RESPONSE,
  ACCELERATOR_TYPES_RESPONSE,
} from '../test_helpers';

const TEST_PROJECT = 'test-project';
const TEST_ZONE = 'test-zone';

describe('DetailsService', () => {
  const name = `projects/${TEST_PROJECT}/zones/${TEST_ZONE}`;
  const mockSubmit = jest.fn();
  const transportService = ({
    submit: mockSubmit,
  } as unknown) as ServerProxyTransportService;
  let detailsService: HardwareService;

  beforeEach(() => {
    jest.resetAllMocks();
    jest.useFakeTimers();

    detailsService = new HardwareService(
      transportService,
      TEST_PROJECT,
      TEST_ZONE
    );
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

  describe('Get Accelerator Types', () => {
    it('Gets all accelerator types', async () => {
      mockSubmit.mockResolvedValue(
        asApiResponse({
          items: ACCELERATOR_TYPES_RESPONSE,
        })
      );

      const response = await detailsService.getAcceleratorTypes();

      expect(mockSubmit).toHaveBeenCalledWith({
        path: `${COMPUTE_ENGINE_API_PATH}/${name}/acceleratorTypes`,
      });
      expect(response).toEqual(ACCELERATOR_TYPES_RESPONSE);
    });

    it('Fails to get accelerator types', async () => {
      mockSubmit.mockResolvedValue(
        asApiResponse({
          done: true,
          error: {
            code: 400,
            message: 'Unable to retrieve accelerator types.',
          },
        })
      );

      try {
        await detailsService.getAcceleratorTypes();
      } catch (err) {
        expect(err).toEqual('Unable to retrieve accelerator types.');
      }

      expect(mockSubmit).toHaveBeenCalledWith({
        path: `${COMPUTE_ENGINE_API_PATH}/${name}/acceleratorTypes`,
      });
    });
  });
});
