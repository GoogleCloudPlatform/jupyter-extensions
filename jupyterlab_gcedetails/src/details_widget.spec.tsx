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

jest.mock('@jupyterlab/apputils');
import { showDialog, ReactWidget } from '@jupyterlab/apputils';
import { ServerConnection } from '@jupyterlab/services';
import { shallow } from 'enzyme';
import * as React from 'react';

import { STYLES, VmDetails } from './details_widget';
import { asFetchResponse, DETAILS_RESPONSE } from './test_helpers';

describe('VmDetails', () => {
  const mockMakeRequest = jest.fn();

  beforeEach(() => {
    ServerConnection.makeRequest = mockMakeRequest;

    jest.resetAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  it('Renders with details', async () => {
    const detailsResponse = Promise.resolve(JSON.parse(DETAILS_RESPONSE));
    const outerPromise = asFetchResponse(detailsResponse);
    mockMakeRequest.mockReturnValue(outerPromise);

    const vmDetails = shallow(<VmDetails />);
    expect(vmDetails).toMatchSnapshot('Retrieving');
    await Promise.all([outerPromise, detailsResponse]);

    expect(vmDetails).toMatchSnapshot('Details');
    expect(mockMakeRequest).toHaveBeenCalledTimes(1);
    expect(mockMakeRequest.mock.calls[0][0]).toMatch('/gcp/v1/details');
  });

  it('Renders with error', async () => {
    const errorResponse = asFetchResponse(null, false);
    mockMakeRequest.mockReturnValue(errorResponse);

    const vmDetails = shallow(<VmDetails />);
    expect(vmDetails).toMatchSnapshot('Retrieving');
    await errorResponse;

    expect(vmDetails).toMatchSnapshot('Received Error');
    vmDetails.find(`span.${STYLES.icon}`).simulate('click');
    expect(showDialog).toHaveBeenCalledWith({
      title: 'Notebook VM Details',
      body: 'Unable to retrieve GCE VM details, please check your server logs',
    });
  });

  it('Opens dialog when icon is clicked', async () => {
    const detailsResponse = Promise.resolve(JSON.parse(DETAILS_RESPONSE));
    const outerPromise = asFetchResponse(detailsResponse);
    mockMakeRequest.mockReturnValue(outerPromise);

    const vmDetails = shallow(<VmDetails />);
    await Promise.all([outerPromise, detailsResponse]);

    vmDetails.find(`span.${STYLES.icon}`).simulate('click');
    expect(showDialog).toHaveBeenCalled();
    expect(ReactWidget.create).toHaveBeenCalled();
  });

  it('Cycles through attributes when clicked', async () => {
    const detailsResponse = Promise.resolve(JSON.parse(DETAILS_RESPONSE));
    const outerPromise = asFetchResponse(detailsResponse);
    mockMakeRequest.mockReturnValue(outerPromise);

    const vmDetails = shallow(<VmDetails />);
    await Promise.all([outerPromise, detailsResponse]);

    let attributes = vmDetails.find(`span.${STYLES.attribute}`);
    expect(attributes.length).toBe(2);
    expect(attributes.first().text()).toBe('pytorch | ');
    expect(attributes.last().text()).toBe('test-project');

    attributes.first().simulate('click');
    attributes = vmDetails.find(`span.${STYLES.attribute}`);
    expect(attributes.first().text()).toBe('test-project | ');
    expect(attributes.last().text()).toBe('PyTorch:1.4');

    attributes.first().simulate('click');
    attributes = vmDetails.find(`span.${STYLES.attribute}`);
    expect(attributes.first().text()).toBe('PyTorch:1.4 | ');
    expect(attributes.last().text()).toBe('4 vCPU, 15 GB RAM (n1-standard-4)');

    // Simulate two clicks
    attributes.last().simulate('click');
    attributes.last().simulate('click');
    attributes = vmDetails.find(`span.${STYLES.attribute}`);
    expect(attributes.first().text()).toBe('CPU: 50.0% | ');
    expect(attributes.last().text()).toBe('Memory: 16.0%');

    attributes.first().simulate('click');
    attributes = vmDetails.find(`span.${STYLES.attribute}`);
    expect(attributes.first().text()).toBe('Memory: 16.0% | ');
    expect(attributes.last().text()).toBe('GPU: Tesla K80 - 100.0%');
  });

  it('Auto-refreshes when resource utilization are displayed', async () => {
    const detailsResponse = Promise.resolve(JSON.parse(DETAILS_RESPONSE));
    const outerPromise = asFetchResponse(detailsResponse);
    mockMakeRequest.mockReturnValue(outerPromise);

    const vmDetails = shallow(<VmDetails />);
    await Promise.all([outerPromise, detailsResponse]);

    expect(mockMakeRequest).toHaveBeenCalledTimes(1);
    // Click four times to move to CPU usage
    for (let i = 0; i < 4; i++) {
      vmDetails
        .find(`span.${STYLES.attribute}`)
        .first()
        .simulate('click');
    }

    let attributes = vmDetails.find(`span.${STYLES.attribute}`);
    expect(attributes.first().text()).toBe('CPU: 50.0% | ');
    expect(attributes.last().text()).toBe('Memory: 16.0%');

    jest.advanceTimersToNextTimer();
    expect(mockMakeRequest).toHaveBeenCalledTimes(2);

    attributes.first().simulate('click');
    attributes = vmDetails.find(`span.${STYLES.attribute}`);
    expect(attributes.first().text()).toBe('Memory: 16.0% | ');
    expect(attributes.last().text()).toBe('GPU: Tesla K80 - 100.0%');
    jest.advanceTimersToNextTimer();
    expect(mockMakeRequest).toHaveBeenCalledTimes(3);

    // Click twice and timer should not refresh data again
    attributes.first().simulate('click');
    attributes.first().simulate('click');
    attributes = vmDetails.find(`span.${STYLES.attribute}`);
    expect(attributes.first().text()).toBe('pytorch | ');
    expect(attributes.last().text()).toBe('test-project');
    jest.advanceTimersToNextTimer();
    expect(mockMakeRequest).toHaveBeenCalledTimes(3);
  });
});
