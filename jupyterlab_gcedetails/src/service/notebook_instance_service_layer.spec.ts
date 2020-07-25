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
  NotebookInstanceServiceLayer,
  NOTEBOOKS_API_PATH,
  Instance,
  State,
} from './notebook_instance_service_layer';

const TEST_PROJECT = 'test-project';
const TEST_INSTANCE_NAME = 'test-instance-name';
const TEST_LOCATION_ID = 'test-location-id';

function getState(): State {
  return {
    serviceEnabled: false,
    projectId: TEST_PROJECT,
    instanceName: TEST_INSTANCE_NAME,
    locationId: TEST_LOCATION_ID,
  };
}

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
  let notebookInstanceServiceLayer: NotebookInstanceServiceLayer;

  beforeEach(() => {
    jest.resetAllMocks();
    jest.useFakeTimers();

    notebookInstanceServiceLayer = new NotebookInstanceServiceLayer(
      { submit: mockSubmit },
      null
    );
    notebookInstanceServiceLayer.projectId = TEST_PROJECT;
    notebookInstanceServiceLayer.instanceName = TEST_INSTANCE_NAME;
    notebookInstanceServiceLayer.locationId = TEST_LOCATION_ID;
  });

  describe('Get State', () => {
    it('Gets fully enabled state', async () => {
      const state = await notebookInstanceServiceLayer.getState();
      const expectedState: State = getState();
      expect(state).toEqual(expectedState);
    });

    it('Gets empty state with project ID from server', async () => {
      const project = 'other-project-id';
      notebookInstanceServiceLayer.projectId = null;
      mockGetMetadata.mockResolvedValue({ project });

      const state = await notebookInstanceServiceLayer.getState();
      const expectedState = getState();
      expectedState.projectId = project;
      expect(state).toEqual(expectedState);
    });

    it('Fails to retrieve a project ID', async () => {
      const error = {
        result: 'Unable to retrieve metadata from VM',
      };
      notebookInstanceServiceLayer.projectId = null;
      mockGetMetadata.mockRejectedValue(error);

      expect.assertions(1);
      try {
        await notebookInstanceServiceLayer.getState();
      } catch (err) {
        expect(err).toEqual(error);
      }
    });

    it('Gets empty state with instance name from server', async () => {
      const instanceName = 'other-istance-name';
      notebookInstanceServiceLayer.instanceName = null;
      mockGetMetadata.mockResolvedValue({ name: instanceName });

      const state = await notebookInstanceServiceLayer.getState();
      const expectedState = getState();
      expectedState.instanceName = instanceName;
      expect(state).toEqual(expectedState);
    });

    it('Fails to retrieve an instance name', async () => {
      const error = {
        result: 'Unable to retrieve metadata from VM',
      };
      notebookInstanceServiceLayer.instanceName = null;
      mockGetMetadata.mockRejectedValue(error);

      expect.assertions(1);
      try {
        await notebookInstanceServiceLayer.getState();
      } catch (err) {
        expect(err).toEqual(error);
      }
    });

    it('Gets empty state with location ID from server', async () => {
      const zone = 'projects/test-project/zones/other-location-id';
      notebookInstanceServiceLayer.locationId = null;
      mockGetMetadata.mockResolvedValue({ zone });

      const state = await notebookInstanceServiceLayer.getState();
      const expectedState = getState();
      expectedState.locationId = zone.split('/')[3];
      expect(state).toEqual(expectedState);
    });

    it('Fails to retrieve a location ID', async () => {
      const error = {
        result: 'Unable to retrieve metadata from VM',
      };
      notebookInstanceServiceLayer.locationId = null;
      mockGetMetadata.mockRejectedValue(error);

      expect.assertions(1);
      try {
        await notebookInstanceServiceLayer.getState();
      } catch (err) {
        expect(err).toEqual(error);
      }
    });
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
      const result = await notebookInstanceServiceLayer.stop();
      stopTimers();

      expect(result.state).toBe('STOPPED');
      expect(mockSubmit).toHaveBeenCalledTimes(3);
      expect(mockSubmit).toHaveBeenNthCalledWith(1, {
        path: stopPath,
        method: 'POST',
        headers: { Authorization: `Bearer ${null}` },
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
        await notebookInstanceServiceLayer.stop();
      } catch (err) {
        expect(err).toEqual('400: Could not stop Notebook Instance');
      }
      stopTimers();

      expect(mockSubmit).toHaveBeenCalledTimes(3);
      expect(mockSubmit).toHaveBeenNthCalledWith(1, {
        path: stopPath,
        method: 'POST',
        headers: { Authorization: `Bearer ${null}` },
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
        await notebookInstanceServiceLayer.stop();
      } catch (err) {
        expect(err).toEqual('Unexpected error fetching operation');
      }
      stopTimers();

      expect(mockSubmit).toHaveBeenCalledTimes(4);
      expect(mockSubmit).toHaveBeenNthCalledWith(1, {
        path: stopPath,
        method: 'POST',
        headers: { Authorization: `Bearer ${null}` },
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
      const result = await notebookInstanceServiceLayer.start();
      stopTimers();

      expect(result.state).toBe('ACTIVE');
      expect(mockSubmit).toHaveBeenCalledTimes(3);
      expect(mockSubmit).toHaveBeenNthCalledWith(1, {
        path: startPath,
        method: 'POST',
        headers: { Authorization: `Bearer ${null}` },
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
        await notebookInstanceServiceLayer.start();
      } catch (err) {
        expect(err).toEqual('400: Could not start Notebook Instance');
      }
      stopTimers();

      expect(mockSubmit).toHaveBeenCalledTimes(3);
      expect(mockSubmit).toHaveBeenNthCalledWith(1, {
        path: startPath,
        method: 'POST',
        headers: { Authorization: `Bearer ${null}` },
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
        await notebookInstanceServiceLayer.start();
      } catch (err) {
        expect(err).toEqual('Unexpected error fetching operation');
      }
      stopTimers();

      expect(mockSubmit).toHaveBeenCalledTimes(4);
      expect(mockSubmit).toHaveBeenNthCalledWith(1, {
        path: startPath,
        method: 'POST',
        headers: { Authorization: `Bearer ${null}` },
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
      const result = await notebookInstanceServiceLayer.setMachineType(
        machineType
      );
      stopTimers();

      expect(result.machineType).toBe(machineType);
      expect(mockSubmit).toHaveBeenCalledTimes(3);
      expect(mockSubmit).toHaveBeenNthCalledWith(1, {
        path: setMachineTypePath,
        method: 'PATCH',
        headers: { Authorization: `Bearer ${null}` },
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
        await notebookInstanceServiceLayer.setMachineType(machineType);
      } catch (err) {
        expect(err).toEqual(
          '400: Could not set Machine Type of Notebook Instance'
        );
      }
      stopTimers();

      expect(mockSubmit).toHaveBeenCalledTimes(3);
      expect(mockSubmit).toHaveBeenNthCalledWith(1, {
        path: setMachineTypePath,
        method: 'PATCH',
        headers: { Authorization: `Bearer ${null}` },
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
        await notebookInstanceServiceLayer.setMachineType(machineType);
      } catch (err) {
        expect(err).toEqual('Unexpected error fetching operation');
      }
      stopTimers();

      expect(mockSubmit).toHaveBeenCalledTimes(4);
      expect(mockSubmit).toHaveBeenNthCalledWith(1, {
        path: setMachineTypePath,
        method: 'PATCH',
        headers: { Authorization: `Bearer ${null}` },
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
      const result = await notebookInstanceServiceLayer.setAccelerator(
        type,
        coreCount
      );
      stopTimers();

      expect(result.acceleratorConfig.type).toBe(type);
      expect(result.acceleratorConfig.coreCount).toBe(coreCount);
      expect(mockSubmit).toHaveBeenCalledTimes(3);
      expect(mockSubmit).toHaveBeenNthCalledWith(1, {
        path: setAcceleratorPath,
        method: 'PATCH',
        headers: { Authorization: `Bearer ${null}` },
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
        await notebookInstanceServiceLayer.setAccelerator(type, coreCount);
      } catch (err) {
        expect(err).toEqual(
          '400: Could not attach Accelerator to Notebook Instance'
        );
      }
      stopTimers();

      expect(mockSubmit).toHaveBeenCalledTimes(3);
      expect(mockSubmit).toHaveBeenNthCalledWith(1, {
        path: setAcceleratorPath,
        method: 'PATCH',
        headers: { Authorization: `Bearer ${null}` },
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
        await notebookInstanceServiceLayer.setAccelerator(type, coreCount);
      } catch (err) {
        expect(err).toEqual('Unexpected error fetching operation');
      }
      stopTimers();

      expect(mockSubmit).toHaveBeenCalledTimes(4);
      expect(mockSubmit).toHaveBeenNthCalledWith(1, {
        path: setAcceleratorPath,
        method: 'PATCH',
        headers: { Authorization: `Bearer ${null}` },
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
