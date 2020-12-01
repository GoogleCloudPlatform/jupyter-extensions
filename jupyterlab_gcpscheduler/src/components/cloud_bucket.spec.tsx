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

/* eslint-disable @typescript-eslint/no-unused-vars */
import { shallow } from 'enzyme';
import * as React from 'react';
import { CloudBucketSelector, BucketOption } from './cloud_bucket';
import { GcpService } from '../service/gcp';
import { getBucket } from '../test_helpers';

describe('CloudBucketSelector', () => {
  const mockProjectId = jest.fn();
  const mockCreateBucket = jest.fn();
  const mockListBuckets = jest.fn();
  const mockOnGcsBucketChange = jest.fn();
  const mockGcpService = ({
    get projectId() {
      return mockProjectId();
    },
    createUniformAccessBucket: mockCreateBucket,
    listBuckets: mockListBuckets,
  } as unknown) as GcpService;

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('Renders loading', async () => {
    const resolvedBuckets = Promise.resolve({
      buckets: [getBucket('bucket1'), getBucket('bucket2')],
    });
    mockListBuckets.mockReturnValue(resolvedBuckets);
    const component = shallow(
      <CloudBucketSelector
        gcpService={mockGcpService}
        onGcsBucketChange={mockOnGcsBucketChange}
      />
    );
    expect(component).toMatchSnapshot();
    expect(mockListBuckets).toHaveBeenCalled();
    expect(mockCreateBucket).not.toHaveBeenCalled();
  });

  it('Renders', async () => {
    const resolvedBuckets = Promise.resolve({
      buckets: [getBucket('bucket1'), getBucket('bucket2')],
    });
    mockListBuckets.mockReturnValue(resolvedBuckets);
    const component = shallow(
      <CloudBucketSelector
        gcpService={mockGcpService}
        onGcsBucketChange={mockOnGcsBucketChange}
      />
    );
    await resolvedBuckets;
    expect(component).toMatchSnapshot();
    expect(mockListBuckets).toHaveBeenCalled();
    expect(mockOnGcsBucketChange).toHaveBeenCalledWith(null);
    expect(mockCreateBucket).not.toHaveBeenCalled();
  });

  it('Tries to render with error', async () => {
    const rejectedList = Promise.reject('Error error error');
    mockListBuckets.mockReturnValue(rejectedList);
    const component = shallow(
      <CloudBucketSelector
        gcpService={mockGcpService}
        gcsBucket="bucket1"
        onGcsBucketChange={mockOnGcsBucketChange}
      />
    );
    await rejectedList.catch(() => null);
    expect(mockListBuckets).toHaveBeenCalledTimes(1);
    expect(mockCreateBucket).not.toHaveBeenCalled();
    expect(mockOnGcsBucketChange).toHaveBeenCalledWith(null);
    expect(component.state('error')).toBe(
      'Unable to retrieve Buckets: Error error error'
    );
  });

  it('Tries to render with value not from list', async () => {
    const resolvedBuckets = Promise.resolve({
      buckets: [getBucket('bucket1'), getBucket('bucket2')],
    });
    mockListBuckets.mockReturnValue(resolvedBuckets);
    shallow(
      <CloudBucketSelector
        gcpService={mockGcpService}
        gcsBucket="bucket10"
        onGcsBucketChange={mockOnGcsBucketChange}
      />
    );
    await resolvedBuckets;
    expect(mockListBuckets).toHaveBeenCalledTimes(1);
    expect(mockCreateBucket).not.toHaveBeenCalled();
    expect(mockOnGcsBucketChange).toHaveBeenCalledWith(null);
  });

  it('Renders with preselected value', async () => {
    const resolvedBuckets = Promise.resolve({
      buckets: [getBucket('bucket1'), getBucket('bucket2')],
    });
    mockListBuckets.mockReturnValue(resolvedBuckets);
    const component = shallow(
      <CloudBucketSelector
        gcpService={mockGcpService}
        gcsBucket="bucket2"
        onGcsBucketChange={mockOnGcsBucketChange}
      />
    );
    await resolvedBuckets;
    expect(component).toMatchSnapshot();
    expect(mockListBuckets).toHaveBeenCalled();
    expect(mockOnGcsBucketChange).toHaveBeenCalledWith('bucket2');
    expect(mockCreateBucket).not.toHaveBeenCalled();
  });

  it('Renders with preselected value and changes value', async () => {
    const resolvedBuckets = Promise.resolve({
      buckets: [getBucket('bucket1'), getBucket('bucket2')],
    });
    mockListBuckets.mockReturnValue(resolvedBuckets);
    const component = shallow(
      <CloudBucketSelector
        gcpService={mockGcpService}
        gcsBucket="bucket2"
        onGcsBucketChange={mockOnGcsBucketChange}
      />
    );
    await resolvedBuckets;
    (component.instance() as CloudBucketSelector).handleChange(
      null,
      {
        ...getBucket('bucket1'),
      } as BucketOption,
      'select-option'
    );
    expect(mockListBuckets).toHaveBeenCalled();
    expect(mockCreateBucket).not.toHaveBeenCalled();
    expect(mockOnGcsBucketChange).toHaveBeenCalledTimes(2);
    expect(mockOnGcsBucketChange).toHaveBeenCalledWith('bucket1');
  });

  it('Renders with preselected value and changes value with enter', async () => {
    const resolvedBuckets = Promise.resolve({
      buckets: [getBucket('bucket1'), getBucket('bucket2')],
    });
    mockListBuckets.mockReturnValue(resolvedBuckets);
    const component = shallow(
      <CloudBucketSelector
        gcpService={mockGcpService}
        gcsBucket="bucket2"
        onGcsBucketChange={mockOnGcsBucketChange}
      />
    );
    await resolvedBuckets;
    (component.instance() as CloudBucketSelector).handleChange(
      null,
      'bucket1',
      'select-option'
    );
    expect(mockListBuckets).toHaveBeenCalled();
    expect(mockCreateBucket).not.toHaveBeenCalled();
    expect(mockOnGcsBucketChange).toHaveBeenCalledTimes(2);
    expect(mockOnGcsBucketChange).toHaveBeenCalledWith('bucket1');
  });

  it('Renders and creates with click', async () => {
    const resolvedBuckets = Promise.resolve({
      buckets: [getBucket('bucket1'), getBucket('bucket2')],
    });
    const afterCreateResolvedBuckets = Promise.resolve({
      buckets: [
        getBucket('bucket1'),
        getBucket('bucket2'),
        getBucket('new_bucket'),
      ],
    });
    mockListBuckets
      .mockReturnValueOnce(resolvedBuckets)
      .mockReturnValueOnce(afterCreateResolvedBuckets);
    const component = shallow(
      <CloudBucketSelector
        gcpService={mockGcpService}
        onGcsBucketChange={mockOnGcsBucketChange}
      />
    );
    await resolvedBuckets;
    (component.instance() as CloudBucketSelector).handleChange(
      null,
      {
        ...getBucket('Create and select "new_bucket"'),
        inputValue: 'new_bucket',
      } as BucketOption,
      'create-option'
    );
    await afterCreateResolvedBuckets;
    expect(mockListBuckets).toHaveBeenCalledTimes(2);
    expect(mockCreateBucket).toHaveBeenCalledWith('new_bucket');
    expect(mockOnGcsBucketChange).toHaveBeenCalledWith('new_bucket');
  });

  it('Renders and creates with enter', async () => {
    const resolvedBuckets = Promise.resolve({
      buckets: [getBucket('bucket1'), getBucket('bucket2')],
    });
    const afterCreateResolvedBuckets = Promise.resolve({
      buckets: [
        getBucket('bucket1'),
        getBucket('bucket2'),
        getBucket('new_bucket'),
      ],
    });
    mockListBuckets
      .mockReturnValueOnce(resolvedBuckets)
      .mockReturnValueOnce(afterCreateResolvedBuckets);
    const component = shallow(
      <CloudBucketSelector
        gcpService={mockGcpService}
        onGcsBucketChange={mockOnGcsBucketChange}
      />
    );
    await resolvedBuckets;
    (component.instance() as CloudBucketSelector).handleChange(
      null,
      'new_bucket',
      'select-option'
    );
    await afterCreateResolvedBuckets;
    expect(mockListBuckets).toHaveBeenCalledTimes(2);
    expect(mockCreateBucket).toHaveBeenCalledWith('new_bucket');
    expect(mockOnGcsBucketChange).toHaveBeenCalledWith('new_bucket');
  });

  it('Renders and tries to create with error', async () => {
    const resolvedBuckets = Promise.resolve({
      buckets: [getBucket('bucket1'), getBucket('bucket2')],
    });
    const rejectedCreate = Promise.reject('Error error error');
    mockListBuckets.mockReturnValue(resolvedBuckets);
    mockCreateBucket.mockReturnValue(rejectedCreate);
    const component = shallow(
      <CloudBucketSelector
        gcpService={mockGcpService}
        onGcsBucketChange={mockOnGcsBucketChange}
      />
    );
    await resolvedBuckets;
    (component.instance() as CloudBucketSelector).handleChange(
      null,
      'new_bucket',
      'select-option'
    );
    await rejectedCreate.catch(() => null);
    expect(mockListBuckets).toHaveBeenCalledTimes(1);
    expect(mockCreateBucket).toHaveBeenCalledWith('new_bucket');
    expect(mockOnGcsBucketChange).toHaveBeenCalledWith(null);
    expect(component.state('error')).toBe('Error error error');
  });

  it('Renders and removes', async () => {
    const resolvedBuckets = Promise.resolve({
      buckets: [getBucket('bucket1'), getBucket('bucket2')],
    });
    mockListBuckets.mockReturnValue(resolvedBuckets);
    const component = shallow(
      <CloudBucketSelector
        gcpService={mockGcpService}
        gcsBucket="bucket2"
        onGcsBucketChange={mockOnGcsBucketChange}
      />
    );
    await resolvedBuckets;
    (component.instance() as CloudBucketSelector).handleChange(
      null,
      '',
      'remove-option'
    );
    expect(mockListBuckets).toHaveBeenCalled();
    expect(component.state('value')).toBe(null);
    expect(mockOnGcsBucketChange).toHaveBeenCalledWith(null);
    expect(component.state('error')).toBe(
      'A bucket is required to store results'
    );
  });

  it('Renders and tries to create existing fine grain', async () => {
    const resolvedBuckets = Promise.resolve({
      buckets: [
        getBucket('bucket1'),
        getBucket('bucket2'),
        getBucket('bucketfg', false),
      ],
    });
    mockListBuckets.mockReturnValue(resolvedBuckets);
    const component = shallow(
      <CloudBucketSelector
        gcpService={mockGcpService}
        gcsBucket="bucket2"
        onGcsBucketChange={mockOnGcsBucketChange}
      />
    );
    await resolvedBuckets;
    (component.instance() as CloudBucketSelector).handleChange(
      null,
      {
        ...getBucket('Create and select "bucketfg"'),
        inputValue: 'bucketfg',
      } as BucketOption,
      'create-option'
    );
    expect(component).toMatchSnapshot();
    expect(mockListBuckets).toHaveBeenCalled();
    expect(component.state('value')).toBe(null);
    expect(component.state('error')).toBe(
      'A bucket with incompatible access controls already exists with that name'
    );
    expect(mockOnGcsBucketChange).toHaveBeenCalledWith(null);
  });
});
