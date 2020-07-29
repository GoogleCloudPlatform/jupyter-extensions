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

import { ServerConnection } from '@jupyterlab/services';

import { TEST_PROJECT, asFetchResponse, asApiResponse } from './test_helpers';
import {
  ApiRequest,
  ServerProxyTransportService,
  ClientTransportService,
  TransportService,
} from './transport';

const SERVICES_REQUEST: ApiRequest = {
  params: {
    consumerId: `project:${TEST_PROJECT}`,
    pageSize: 100,
  },
  path: 'https://servicemanagement.googleapis.com/v1/services',
};
const CREATE_BUCKET_REQUEST: ApiRequest = {
  path: 'https://www.googleapis.com/storage/v1/b',
  method: 'POST',
  params: { project: TEST_PROJECT },
  body: {
    name: 'test-bucket',
    versioning: { enabled: true },
  },
};
const UPLOAD_REQUEST: ApiRequest = {
  headers: { 'Content-Type': 'application/json' },
  params: { name: 'notebook.json', uploadType: 'media' },
  path: 'https://www.googleapis.com/upload/storage/v1/b/fake-bucket/o',
  method: 'POST',
  body: '{"foo": "bar"}',
};

describe('ServerProxyTransportService', () => {
  const transportService = new ServerProxyTransportService();
  const mockMakeRequest = jest.fn();

  // Returns calls from mockMakeRequest in an easier form to assert
  function getMockServerRequests() {
    return mockMakeRequest.mock.calls.map(c => {
      const gcpPathStart = c[0].indexOf('/gcp/v1');
      if (gcpPathStart === -1) {
        throw new Error(
          `mockMakeRequest: ${c[0]} is not a valid GCP extension URL`
        );
      }
      const url =
        c[0].indexOf('/gcp/v1/proxy/') >= 0
          ? atob(c[0].slice(c[0].lastIndexOf('/') + 1))
          : c[0].slice(gcpPathStart);
      return {
        url,
        body: c[1].body ? JSON.parse(c[1].body) : undefined,
        method: c[1].method,
      };
    });
  }

  beforeEach(() => {
    jest.resetAllMocks();

    ServerConnection.makeRequest = mockMakeRequest;
  });

  it('Submits GET request', async () => {
    mockMakeRequest.mockReturnValue(asFetchResponse('all good'));

    const response = await transportService.submit(SERVICES_REQUEST);
    expect(response.result).toBe('all good');
    const mockApiCalls = getMockServerRequests();
    expect(mockApiCalls.length).toBe(1);
    expect(mockApiCalls[0]).toEqual({
      body: undefined,
      method: 'GET',
      url:
        'https://servicemanagement.googleapis.com/v1/services?consumerId=project%3Atest-project&pageSize=100',
    });
  });

  it('Submits POST request', async () => {
    mockMakeRequest.mockReturnValue(asFetchResponse('all good'));

    const response = await transportService.submit(CREATE_BUCKET_REQUEST);
    expect(response.result).toBe('all good');
    const mockApiCalls = getMockServerRequests();
    expect(mockApiCalls.length).toBe(1);
    expect(mockApiCalls[0]).toEqual({
      body: {
        name: 'test-bucket',
        versioning: { enabled: true },
      },
      method: 'POST',
      url: 'https://www.googleapis.com/storage/v1/b?project=test-project',
    });
  });

  it('Submits POST request with JSON-encoded body', async () => {
    mockMakeRequest.mockReturnValue(asFetchResponse('all good'));

    const response = await transportService.submit(UPLOAD_REQUEST);
    expect(response.result).toBe('all good');
    const mockApiCalls = getMockServerRequests();
    expect(mockApiCalls.length).toBe(1);
    expect(mockApiCalls[0]).toEqual({
      body: { foo: 'bar' },
      method: 'POST',
      url:
        'https://www.googleapis.com/upload/storage/v1/b/fake-bucket/o?name=notebook.json&uploadType=media',
    });
  });

  it('Throws error for response without ok', async () => {
    mockMakeRequest.mockReturnValue(asFetchResponse('not good', false));

    expect.assertions(3);
    try {
      await transportService.submit(SERVICES_REQUEST);
    } catch (err) {
      expect(err.result).toBe('not good');
    }
    const mockApiCalls = getMockServerRequests();
    expect(mockApiCalls.length).toBe(1);
    expect(mockApiCalls[0]).toEqual({
      body: undefined,
      method: 'GET',
      url:
        'https://servicemanagement.googleapis.com/v1/services?consumerId=project%3Atest-project&pageSize=100',
    });
  });
});

describe('ClientTransportService', () => {
  const CLIENT_ID = 'testclient.apps.googleusercontent.com';
  const mockGapiInit = jest.fn();
  const mockGapiRequest = jest.fn();
  const mockGetAuthInstance = jest.fn();
  const mockGapiSetToken = jest.fn();
  let mockGapiLoad: jest.Mock;
  let transportService: TransportService;

  beforeEach(() => {
    jest.resetAllMocks();

    // Create ClientTransportService first before gapi is added to global
    transportService = new ClientTransportService(CLIENT_ID);

    document.createElement = jest.fn().mockReturnValue({});
    // Trigger the onload after the script is attached to the document
    document.body.appendChild = jest.fn(script => {
      ((script as unknown) as HTMLScriptElement).onload(null);
      return script;
    });

    mockGapiLoad = jest.fn((_: string, callback: () => void) => {
      callback();
    });
    (global as any).gapi = {
      load: mockGapiLoad,
      auth2: {
        getAuthInstance: mockGetAuthInstance,
      },
      client: {
        init: mockGapiInit,
        request: mockGapiRequest,
        setToken: mockGapiSetToken,
      },
    };
  });

  describe('User is authenticated', () => {
    beforeEach(() => {
      mockGapiInit.mockResolvedValue(true);
      mockGetAuthInstance.mockReturnValue({
        isSignedIn: {
          get: () => true,
        },
      });
    });

    it('Submits GET request', async () => {
      mockGapiRequest.mockResolvedValue(asApiResponse('all good'));

      const response = await transportService.submit(SERVICES_REQUEST);
      expect(response.result).toBe('all good');
      expect(mockGapiLoad).toHaveBeenCalled();
      expect(mockGapiInit).toHaveBeenCalledWith({
        clientId: CLIENT_ID,
        scope: 'https://www.googleapis.com/auth/cloud-platform',
      });
      expect(mockGetAuthInstance).toHaveBeenCalled();
      expect(mockGapiRequest).toHaveBeenCalledWith({
        params: {
          consumerId: 'project:test-project',
          pageSize: 100,
        },
        path: 'https://servicemanagement.googleapis.com/v1/services',
      });
    });

    it('Loads and initializes Gapi once', async () => {
      // Provide mock imp. to use request when building response
      mockGapiRequest.mockImplementation((request: ApiRequest) => {
        return Promise.resolve(
          asApiResponse(`response ${request.path.slice(-1)}`)
        );
      });
      const responses = await Promise.all([
        transportService.submit({
          path: 'https://servicemanagement.googleapis.com/v1/service/1',
        }),
        transportService.submit({
          path: 'https://servicemanagement.googleapis.com/v1/service/2',
        }),
      ]);
      expect(responses[0].result).toBe('response 1');
      expect(responses[1].result).toBe('response 2');
      expect(mockGapiLoad).toHaveBeenCalledTimes(1);
      expect(mockGapiInit).toHaveBeenCalledTimes(1);
      expect(mockGapiInit).toHaveBeenCalledWith({
        clientId: CLIENT_ID,
        scope: 'https://www.googleapis.com/auth/cloud-platform',
      });
      expect(mockGetAuthInstance).toHaveBeenCalledTimes(1);
      expect(mockGapiRequest).toHaveBeenCalledTimes(2);
    });

    it('Submits POST request', async () => {
      mockGapiRequest.mockResolvedValue(asApiResponse('all good'));

      const response = await transportService.submit(CREATE_BUCKET_REQUEST);
      expect(response.result).toBe('all good');
      expect(mockGapiRequest).toHaveBeenCalledWith({
        body: {
          name: 'test-bucket',
          versioning: { enabled: true },
        },
        method: 'POST',
        path: 'https://www.googleapis.com/storage/v1/b',
        params: { project: TEST_PROJECT },
      });
    });

    it('Submits POST request with JSON-encoded body', async () => {
      mockGapiRequest.mockResolvedValue(asApiResponse('all good'));

      const response = await transportService.submit(UPLOAD_REQUEST);
      expect(response.result).toBe('all good');
      expect(mockGapiRequest).toHaveBeenCalledWith({
        body: '{"foo": "bar"}',
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
        params: { name: 'notebook.json', uploadType: 'media' },
        path: 'https://www.googleapis.com/upload/storage/v1/b/fake-bucket/o',
      });
    });

    it('Raises response error', async () => {
      mockGapiRequest.mockRejectedValue(asApiResponse('not good'));

      expect.assertions(2);
      try {
        await transportService.submit(SERVICES_REQUEST);
      } catch (err) {
        expect(err.result).toBe('not good');
      }
      expect(mockGapiRequest).toHaveBeenCalledWith({
        params: {
          consumerId: 'project:test-project',
          pageSize: 100,
        },
        path: 'https://servicemanagement.googleapis.com/v1/services',
      });
    });

    it('Fails to init', async () => {
      const error = { details: 'Not a valid origin for the client' };
      mockGapiInit.mockRejectedValue(error);

      try {
        await transportService.submit(SERVICES_REQUEST);
      } catch (err) {
        expect(err).toEqual(
          'Unable to initialize to Google API client: Not a valid origin for the client'
        );
      }
      expect(mockGapiLoad).toHaveBeenCalled();
      expect(mockGapiInit).toHaveBeenCalledWith({
        clientId: CLIENT_ID,
        scope: 'https://www.googleapis.com/auth/cloud-platform',
      });
      expect(mockGetAuthInstance).not.toHaveBeenCalled();
      expect(mockGapiRequest).not.toHaveBeenCalled();
    });
  });

  describe('User is NOT authenticated', () => {
    let mockSignIn: jest.Mock;

    beforeEach(() => {
      mockSignIn = jest.fn();
      mockGapiInit.mockResolvedValue(true);
      mockGetAuthInstance.mockReturnValue({
        isSignedIn: {
          get: () => false,
        },
        signIn: mockSignIn,
      });
    });

    it('Signs in and submits GET request', async () => {
      mockSignIn.mockResolvedValue(true);
      mockGapiRequest.mockResolvedValue(asApiResponse('all good'));

      const response = await transportService.submit(SERVICES_REQUEST);
      expect(response.result).toBe('all good');
      expect(mockGapiLoad).toHaveBeenCalled();
      expect(mockGapiInit).toHaveBeenCalledWith({
        clientId: CLIENT_ID,
        scope: 'https://www.googleapis.com/auth/cloud-platform',
      });
      expect(mockSignIn).toHaveBeenCalled();
      expect(mockGapiRequest).toHaveBeenCalledWith({
        params: {
          consumerId: 'project:test-project',
          pageSize: 100,
        },
        path: 'https://servicemanagement.googleapis.com/v1/services',
      });
    });

    it('Signs in once', async () => {
      mockSignIn.mockResolvedValue(true);
      // Provide mock imp. to use request when building response
      mockGapiRequest.mockImplementation((request: ApiRequest) => {
        return Promise.resolve(
          asApiResponse(`response ${request.path.slice(-1)}`)
        );
      });
      const responses = await Promise.all([
        transportService.submit({
          path: 'https://servicemanagement.googleapis.com/v1/service/1',
        }),
        transportService.submit({
          path: 'https://servicemanagement.googleapis.com/v1/service/2',
        }),
      ]);
      expect(responses[0].result).toBe('response 1');
      expect(responses[1].result).toBe('response 2');

      expect(mockGapiLoad).toHaveBeenCalledTimes(1);
      expect(mockGapiInit).toHaveBeenCalledTimes(1);
      expect(mockSignIn).toHaveBeenCalledTimes(1);
      expect(mockGapiInit).toHaveBeenCalledWith({
        clientId: CLIENT_ID,
        scope: 'https://www.googleapis.com/auth/cloud-platform',
      });
      expect(mockGapiRequest).toHaveBeenCalledTimes(2);
    });

    it('Fails to sign in', async () => {
      mockSignIn.mockRejectedValue({ error: 'access_denied' });

      try {
        await transportService.submit(SERVICES_REQUEST);
      } catch (err) {
        expect(err).toEqual('Unable to authenticate to GCP: "access_denied"');
      }
      expect(mockGapiLoad).toHaveBeenCalled();
      expect(mockGapiInit).toHaveBeenCalledWith({
        clientId: CLIENT_ID,
        scope: 'https://www.googleapis.com/auth/cloud-platform',
      });
      expect(mockGetAuthInstance).toHaveBeenCalled();
      expect(mockGapiRequest).not.toHaveBeenCalled();
    });

    it('Retries sign-in if first attempt fails', async () => {
      mockSignIn
        .mockRejectedValueOnce({ error: 'access_denied' })
        .mockResolvedValueOnce(true);

      try {
        await transportService.submit(SERVICES_REQUEST);
      } catch (err) {
        expect(err).toEqual('Unable to authenticate to GCP: "access_denied"');
      }

      mockGapiRequest.mockResolvedValue(asApiResponse('all good'));
      const response = await transportService.submit(SERVICES_REQUEST);
      expect(response.result).toBe('all good');
      expect(mockGapiLoad).toHaveBeenCalledTimes(1);
      expect(mockGapiInit).toHaveBeenCalledTimes(2);
      expect(mockGapiInit).toHaveBeenCalledWith({
        clientId: CLIENT_ID,
        scope: 'https://www.googleapis.com/auth/cloud-platform',
      });
      expect(mockSignIn).toHaveBeenCalledTimes(2);
      expect(mockGapiRequest).toHaveBeenCalledWith({
        params: {
          consumerId: 'project:test-project',
          pageSize: 100,
        },
        path: 'https://servicemanagement.googleapis.com/v1/services',
      });
    });
  });

  describe('Uses access token for authentication', () => {
    it('Sets access token when submitting request', async () => {
      mockGapiRequest.mockResolvedValue(asApiResponse('all good'));
      const accessToken = 'access-token';
      const clientTransportService = new ClientTransportService();
      clientTransportService.accessToken = accessToken;

      const response = await clientTransportService.submit(SERVICES_REQUEST);
      expect(response.result).toBe('all good');
      expect(mockGapiLoad).toHaveBeenCalled();
      expect(mockGapiSetToken).toHaveBeenCalledWith({
        // eslint-disable-next-line @typescript-eslint/camelcase
        access_token: accessToken,
      });
    });
  });
});
