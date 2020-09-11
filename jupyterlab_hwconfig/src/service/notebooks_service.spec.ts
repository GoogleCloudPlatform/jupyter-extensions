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

import { ApiRequest, asApiResponse } from 'gcp_jupyterlab_shared';
import {
  NotebooksService,
  NOTEBOOKS_API_PATH,
  Instance,
} from './notebooks_service';
import { ClientTransportService } from 'gcp_jupyterlab_shared';

const TEST_PROJECT = 'test-project';
const TEST_INSTANCE_NAME = 'test-instance-name';
const TEST_LOCATION_ID = 'test-location-id';

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

describe('NotebookInstanceServiceLayer', () => {
  const name = `projects/${TEST_PROJECT}/locations/${TEST_LOCATION_ID}/instances/${TEST_INSTANCE_NAME}`;
  const mockSubmit = jest.fn();
  const transportService = ({
    submit: mockSubmit,
  } as unknown) as ClientTransportService;
  let notebooksService: NotebooksService;

  beforeEach(() => {
    jest.resetAllMocks();
    jest.useFakeTimers();

    notebooksService = new NotebooksService(
      transportService,
      TEST_PROJECT,
      TEST_INSTANCE_NAME,
      TEST_LOCATION_ID
    );
  });

  describe('Stop Instance', () => {
    const stopPath = `${NOTEBOOKS_API_PATH}/${name}:stop`;
    const stopOperationName = 'stopoperation';
    const stopOperationPath = `${NOTEBOOKS_API_PATH}/${stopOperationName}`;

    it('Stops a Notebook Instance', async () => {
      const response: Instance = {
        name,
        state: 'STOPPED',
      };
      mockSubmit
        .mockReturnValueOnce(asApiResponse({ name: stopOperationName }))
        .mockReturnValueOnce(asApiResponse({ done: false }))
        .mockReturnValueOnce(asApiResponse({ done: true, response }));

      const stopTimers = pollerHelper();
      const result = await notebooksService.stop();
      stopTimers();

      expect(result.state).toBe('STOPPED');
      expect(mockSubmit).toHaveBeenCalledTimes(3);
      expect(mockSubmit).toHaveBeenNthCalledWith(1, {
        path: stopPath,
        method: 'POST',
        body: {},
      });
      expect(mockSubmit).toHaveBeenNthCalledWith(2, {
        path: stopOperationPath,
      });
      expect(mockSubmit).toHaveBeenNthCalledWith(3, {
        path: stopOperationPath,
      });
    });

    it('Fails to stop Notebook Instance', async () => {
      mockSubmit
        .mockReturnValueOnce(asApiResponse({ name: stopOperationName }))
        .mockReturnValueOnce(asApiResponse({ done: false }))
        .mockReturnValueOnce(
          asApiResponse({
            done: true,
            error: { code: 400, message: 'Could not stop Notebook Instance' },
          })
        );

      const stopTimers = pollerHelper();
      expect.assertions(5);
      try {
        await notebooksService.stop();
      } catch (err) {
        expect(err).toEqual('Could not stop Notebook Instance');
      }
      stopTimers();

      expect(mockSubmit).toHaveBeenCalledTimes(3);
      expect(mockSubmit).toHaveBeenNthCalledWith(1, {
        path: stopPath,
        method: 'POST',
        body: {},
      });
      expect(mockSubmit).toHaveBeenNthCalledWith(2, {
        path: stopOperationPath,
      });
      expect(mockSubmit).toHaveBeenNthCalledWith(3, {
        path: stopOperationPath,
      });
    });

    it('Retries polling', async () => {
      mockSubmit.mockImplementation((request: ApiRequest) => {
        if (request.path === stopPath) {
          return asApiResponse({ name: stopOperationName });
        } else {
          return Promise.reject('Unexpected error fetching operation');
        }
      });

      const stopTimers = pollerHelper();
      expect.assertions(6);
      try {
        await notebooksService.stop();
      } catch (err) {
        expect(err).toEqual('Unexpected error fetching operation');
      }
      stopTimers();

      expect(mockSubmit).toHaveBeenCalledTimes(4);
      expect(mockSubmit).toHaveBeenNthCalledWith(1, {
        path: stopPath,
        method: 'POST',
        body: {},
      });
      expect(mockSubmit).toHaveBeenNthCalledWith(2, {
        path: stopOperationPath,
      });
      expect(mockSubmit).toHaveBeenNthCalledWith(3, {
        path: stopOperationPath,
      });
      expect(mockSubmit).toHaveBeenNthCalledWith(4, {
        path: stopOperationPath,
      });
    });
  });

  describe('Start Instance', () => {
    const startPath = `${NOTEBOOKS_API_PATH}/${name}:start`;
    const startOperationName = 'startoperation';
    const startOperationPath = `${NOTEBOOKS_API_PATH}/${startOperationName}`;

    it('Starts a Notebook Instance', async () => {
      const response: Instance = {
        name,
        state: 'ACTIVE',
      };
      mockSubmit
        .mockReturnValueOnce(asApiResponse({ name: startOperationName }))
        .mockReturnValueOnce(asApiResponse({ done: false }))
        .mockReturnValueOnce(asApiResponse({ done: true, response }));

      const stopTimers = pollerHelper();
      const result = await notebooksService.start();
      stopTimers();

      expect(result.state).toBe('ACTIVE');
      expect(mockSubmit).toHaveBeenCalledTimes(3);
      expect(mockSubmit).toHaveBeenNthCalledWith(1, {
        path: startPath,
        method: 'POST',
        body: {},
      });
      expect(mockSubmit).toHaveBeenNthCalledWith(2, {
        path: startOperationPath,
      });
      expect(mockSubmit).toHaveBeenNthCalledWith(3, {
        path: startOperationPath,
      });
    });

    it('Fails to start Notebook Instance', async () => {
      mockSubmit
        .mockReturnValueOnce(asApiResponse({ name: startOperationName }))
        .mockReturnValueOnce(asApiResponse({ done: false }))
        .mockReturnValueOnce(
          asApiResponse({
            done: true,
            error: { code: 400, message: 'Could not start Notebook Instance' },
          })
        );

      const stopTimers = pollerHelper();
      expect.assertions(5);
      try {
        await notebooksService.start();
      } catch (err) {
        expect(err).toEqual('Could not start Notebook Instance');
      }
      stopTimers();

      expect(mockSubmit).toHaveBeenCalledTimes(3);
      expect(mockSubmit).toHaveBeenNthCalledWith(1, {
        path: startPath,
        method: 'POST',
        body: {},
      });
      expect(mockSubmit).toHaveBeenNthCalledWith(2, {
        path: startOperationPath,
      });
      expect(mockSubmit).toHaveBeenNthCalledWith(3, {
        path: startOperationPath,
      });
    });

    it('Retries polling', async () => {
      mockSubmit.mockImplementation((request: ApiRequest) => {
        if (request.path === startPath) {
          return asApiResponse({ name: startOperationName });
        } else {
          return Promise.reject('Unexpected error fetching operation');
        }
      });

      const stopTimers = pollerHelper();
      expect.assertions(6);
      try {
        await notebooksService.start();
      } catch (err) {
        expect(err).toEqual('Unexpected error fetching operation');
      }
      stopTimers();

      expect(mockSubmit).toHaveBeenCalledTimes(4);
      expect(mockSubmit).toHaveBeenNthCalledWith(1, {
        path: startPath,
        method: 'POST',
        body: {},
      });
      expect(mockSubmit).toHaveBeenNthCalledWith(2, {
        path: startOperationPath,
      });
      expect(mockSubmit).toHaveBeenNthCalledWith(3, {
        path: startOperationPath,
      });
      expect(mockSubmit).toHaveBeenNthCalledWith(4, {
        path: startOperationPath,
      });
    });
  });

  describe('Set Machine Type of Instance', () => {
    const setMachineTypePath = `${NOTEBOOKS_API_PATH}/${name}:setMachineType`;
    const setMachineTypeOperationName = 'setmachinetypeoperation';
    const setMachineTypeOperationPath = `${NOTEBOOKS_API_PATH}/${setMachineTypeOperationName}`;
    const machineType = 'new-machine-type';

    it('Sets Machine Type of Notebook Instance', async () => {
      const response: Instance = {
        name,
        machineType,
      };
      mockSubmit
        .mockReturnValueOnce(
          asApiResponse({ name: setMachineTypeOperationName })
        )
        .mockReturnValueOnce(asApiResponse({ done: false }))
        .mockReturnValueOnce(asApiResponse({ done: true, response }));

      const stopTimers = pollerHelper();
      const result = await notebooksService.setMachineType(machineType);
      stopTimers();

      expect(result.machineType).toBe(machineType);
      expect(mockSubmit).toHaveBeenCalledTimes(3);
      expect(mockSubmit).toHaveBeenNthCalledWith(1, {
        path: setMachineTypePath,
        method: 'PATCH',
        body: { machineType },
      });
      expect(mockSubmit).toHaveBeenNthCalledWith(2, {
        path: setMachineTypeOperationPath,
      });
      expect(mockSubmit).toHaveBeenNthCalledWith(3, {
        path: setMachineTypeOperationPath,
      });
    });

    it('Fails to set Machine Type of Notebook Instance', async () => {
      mockSubmit
        .mockReturnValueOnce(
          asApiResponse({ name: setMachineTypeOperationName })
        )
        .mockReturnValueOnce(asApiResponse({ done: false }))
        .mockReturnValueOnce(
          asApiResponse({
            done: true,
            error: {
              code: 400,
              message: 'Could not set Machine Type of Notebook Instance',
            },
          })
        );

      const stopTimers = pollerHelper();
      expect.assertions(5);
      try {
        await notebooksService.setMachineType(machineType);
      } catch (err) {
        expect(err).toEqual('Could not set Machine Type of Notebook Instance');
      }
      stopTimers();

      expect(mockSubmit).toHaveBeenCalledTimes(3);
      expect(mockSubmit).toHaveBeenNthCalledWith(1, {
        path: setMachineTypePath,
        method: 'PATCH',
        body: { machineType },
      });
      expect(mockSubmit).toHaveBeenNthCalledWith(2, {
        path: setMachineTypeOperationPath,
      });
      expect(mockSubmit).toHaveBeenNthCalledWith(3, {
        path: setMachineTypeOperationPath,
      });
    });

    it('Retries polling', async () => {
      mockSubmit.mockImplementation((request: ApiRequest) => {
        if (request.path === setMachineTypePath) {
          return asApiResponse({ name: setMachineTypeOperationName });
        } else {
          return Promise.reject('Unexpected error fetching operation');
        }
      });

      const stopTimers = pollerHelper();
      expect.assertions(6);
      try {
        await notebooksService.setMachineType(machineType);
      } catch (err) {
        expect(err).toEqual('Unexpected error fetching operation');
      }
      stopTimers();

      expect(mockSubmit).toHaveBeenCalledTimes(4);
      expect(mockSubmit).toHaveBeenNthCalledWith(1, {
        path: setMachineTypePath,
        method: 'PATCH',
        body: { machineType },
      });
      expect(mockSubmit).toHaveBeenNthCalledWith(2, {
        path: setMachineTypeOperationPath,
      });
      expect(mockSubmit).toHaveBeenNthCalledWith(3, {
        path: setMachineTypeOperationPath,
      });
      expect(mockSubmit).toHaveBeenNthCalledWith(4, {
        path: setMachineTypeOperationPath,
      });
    });
  });

  describe('Attach Accelerator to Instance', () => {
    const setAcceleratorPath = `${NOTEBOOKS_API_PATH}/${name}:setAccelerator`;
    const setAcceleratorOperationName = 'setacceleratoroperation';
    const setAcceleratorOperationPath = `${NOTEBOOKS_API_PATH}/${setAcceleratorOperationName}`;
    const type = 'accelerator-type';
    const coreCount = '1';

    it('Attaches Accelerator to Notebook Instance', async () => {
      const response: Instance = {
        name,
        acceleratorConfig: {
          type,
          coreCount,
        },
      };
      mockSubmit
        .mockReturnValueOnce(
          asApiResponse({ name: setAcceleratorOperationName })
        )
        .mockReturnValueOnce(asApiResponse({ done: false }))
        .mockReturnValueOnce(asApiResponse({ done: true, response }));

      const stopTimers = pollerHelper();
      const result = await notebooksService.setAccelerator(type, coreCount);
      stopTimers();

      expect(result.acceleratorConfig.type).toBe(type);
      expect(result.acceleratorConfig.coreCount).toBe(coreCount);
      expect(mockSubmit).toHaveBeenCalledTimes(3);
      expect(mockSubmit).toHaveBeenNthCalledWith(1, {
        path: setAcceleratorPath,
        method: 'PATCH',
        body: { type, coreCount },
      });
      expect(mockSubmit).toHaveBeenNthCalledWith(2, {
        path: setAcceleratorOperationPath,
      });
      expect(mockSubmit).toHaveBeenNthCalledWith(3, {
        path: setAcceleratorOperationPath,
      });
    });

    it('Fails to attach Accelerator to Notebook Instance', async () => {
      // Mock a chain of requests so the operation poller has to poll twice
      mockSubmit
        .mockReturnValueOnce(
          asApiResponse({ name: setAcceleratorOperationName })
        )
        .mockReturnValueOnce(asApiResponse({ done: false }))
        .mockReturnValueOnce(
          asApiResponse({
            done: true,
            error: {
              code: 400,
              message: 'Could not attach Accelerator to Notebook Instance',
            },
          })
        );

      const stopTimers = pollerHelper();
      expect.assertions(5);
      try {
        await notebooksService.setAccelerator(type, coreCount);
      } catch (err) {
        expect(err).toEqual(
          'Could not attach Accelerator to Notebook Instance'
        );
      }
      stopTimers();

      expect(mockSubmit).toHaveBeenCalledTimes(3);
      expect(mockSubmit).toHaveBeenNthCalledWith(1, {
        path: setAcceleratorPath,
        method: 'PATCH',
        body: { type, coreCount },
      });
      expect(mockSubmit).toHaveBeenNthCalledWith(2, {
        path: setAcceleratorOperationPath,
      });
      expect(mockSubmit).toHaveBeenNthCalledWith(3, {
        path: setAcceleratorOperationPath,
      });
    });

    it('Retries polling', async () => {
      mockSubmit.mockImplementation((request: ApiRequest) => {
        if (request.path === setAcceleratorPath) {
          return asApiResponse({ name: setAcceleratorOperationName });
        } else {
          return Promise.reject('Unexpected error fetching operation');
        }
      });

      const stopTimers = pollerHelper();
      expect.assertions(6);
      try {
        await notebooksService.setAccelerator(type, coreCount);
      } catch (err) {
        expect(err).toEqual('Unexpected error fetching operation');
      }
      stopTimers();

      expect(mockSubmit).toHaveBeenCalledTimes(4);
      expect(mockSubmit).toHaveBeenNthCalledWith(1, {
        path: setAcceleratorPath,
        method: 'PATCH',
        body: { type, coreCount },
      });
      expect(mockSubmit).toHaveBeenNthCalledWith(2, {
        path: setAcceleratorOperationPath,
      });
      expect(mockSubmit).toHaveBeenNthCalledWith(3, {
        path: setAcceleratorOperationPath,
      });
      expect(mockSubmit).toHaveBeenNthCalledWith(4, {
        path: setAcceleratorOperationPath,
      });
    });
  });
});
