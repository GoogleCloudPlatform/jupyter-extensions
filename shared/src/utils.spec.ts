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
import { InstanceMetadata, getMetadata } from './utils';
import { asFetchResponse } from './service/test_helpers';

const METADATA: InstanceMetadata = {
  project: 'test-project',
  numericProjectId: '1234',
  framework: 'PyTorch:1.4',
  id: '127546640929027970',
  name: 'pytorchvm',
  frameworkTitle: 'PyTorch/fastai/CUDA10.0',
  dlvmImageVersion: '44',
  machineType: 'projects/123456/machineTypes/n1-standard-1',
  zone: 'projects/123456/zones/us-west1-b',
};

describe('Utility functions', () => {
  const mockMakeRequest = jest.fn();

  beforeEach(() => {
    ServerConnection.makeRequest = mockMakeRequest;

    jest.resetAllMocks();
  });

  it('Gets Metadata', async () => {
    const detailsResponse = Promise.resolve(METADATA);
    const outerPromise = asFetchResponse(detailsResponse);
    mockMakeRequest.mockReturnValue(outerPromise);

    expect(await getMetadata()).toEqual(METADATA);
    expect(mockMakeRequest.mock.calls[0][0]).toMatch('/gcp/v1/metadata');
  });

  it('Fails to get metadata', async () => {
    mockMakeRequest.mockReturnValue({
      text: () => Promise.resolve('Could not fetch Metadata'),
      ok: false,
    });

    expect.assertions(2);
    try {
      await getMetadata();
    } catch (err) {
      expect(err).toEqual({ result: 'Could not fetch Metadata' });
    }
    expect(mockMakeRequest.mock.calls[0][0]).toMatch('/gcp/v1/metadata');
  });
});
