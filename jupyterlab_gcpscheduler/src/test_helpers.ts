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

/** Utility functions and helpers for tests. */
import { ReactWrapper, ShallowWrapper } from 'enzyme';
import {
  NotebooksApiExecution,
  NotebooksApiSchedule,
  Execution,
  Schedule,
} from './interfaces';
import { mount } from 'enzyme';
import {
  AI_PLATFORM_LINK,
  DOWNLOAD_LINK_BASE,
  SCHEDULES_DETAILS_LINK,
  VIEWER_LINK_BASE,
} from './data';
export const TEST_PROJECT = 'test-project';

/** Returns immediate promise that can be awaited */
export function immediatePromise(): Promise<void> {
  return new Promise(r => setTimeout(r));
}

/**
 * Function to resolve when triggered to allow testing multiple async promises.
 */
export function triggeredResolver(
  resolveValue?: any
): { resolve: () => void; promise: Promise<any> } {
  let done = false;
  const promise = new Promise(r => {
    const runner = async () => {
      while (!done) {
        await immediatePromise();
      }
      r(resolveValue);
    };
    runner();
  });
  const resolve = () => {
    done = true;
  };
  return { resolve, promise };
}

// Converts ShallowWrapper to ReactWrapper
export function createReactWrapper(wrapper: ShallowWrapper, selector: string) {
  return mount(
    wrapper
      .find(selector)
      .dive()
      .get(0)
  );
}

// Simulates a form input change
export function simulateFieldChange(
  wrapper: ReactWrapper | ShallowWrapper,
  selector: string,
  name: string,
  value: string
) {
  wrapper.find(selector).simulate('change', {
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    persist: () => {},
    target: { name, value },
  });
}

export function simulateCheckBoxChange(
  wrapper: ReactWrapper | ShallowWrapper,
  selector: string,
  name: string,
  checked: boolean
) {
  wrapper.find(selector).simulate('change', {
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    persist: () => {},
    target: { name, checked },
  });
}

export function getExecution(): Execution {
  const gcsFile = `${TEST_PROJECT}/notebook_abcd/abcd.ipynb`;
  const [bucket, executionName, ...object] = gcsFile.split('/');
  const name = executionName.replace('_', ' ');
  const encodedObjectPath = [executionName, ...object]
    .map(p => encodeURIComponent(p))
    .join('/');
  const link = `${AI_PLATFORM_LINK}/notebook_abcd_abcxyz?project=${TEST_PROJECT}`;
  const viewerLink = `${VIEWER_LINK_BASE}/${bucket}/${encodedObjectPath}`;
  const downloadLink = `${DOWNLOAD_LINK_BASE}/${gcsFile}`;
  const bucketLink = 'bucket';
  return {
    id: 'notebook_abcd_abcxyz',
    name,
    createTime: '2020-05-01T19:00:07Z',
    updateTime: '2020-05-01T19:09:42Z',
    gcsFile,
    type: 'Execution',
    state: 'SUCCEEDED',
    link,
    viewerLink,
    downloadLink,
    bucketLink,
    timeZone: 'UTC',
  };
}

export function getSchedule(): Schedule {
  const gcsFile = `${TEST_PROJECT}/notebook_abcd/abcd.ipynb`;
  const [bucket, executionName, ...object] = gcsFile.split('/');
  const name = executionName.replace('_', ' ');
  const encodedObjectPath = [executionName, ...object]
    .map(p => encodeURIComponent(p))
    .join('/');
  const link = `${SCHEDULES_DETAILS_LINK}/notebook_abcd_abcxyz?project=${TEST_PROJECT}`;
  const viewerLink = `${VIEWER_LINK_BASE}/${bucket}/${encodedObjectPath}`;
  const downloadLink = `${DOWNLOAD_LINK_BASE}/${gcsFile}`;
  return {
    id: 'notebook_abcd_abcxyz',
    name,
    createTime: '2020-05-01T19:00:07Z',
    updateTime: '2020-05-01T19:09:42Z',
    gcsFile,
    state: 'SUCCEEDED',
    link,
    viewerLink,
    downloadLink,
    timeZone: 'UTC',
    schedule: '30 9 */2 * *',
    hasExecutions: true,
  };
}

/** Returns an AI Platform Job object */
export function getNotebooksApiExecution(
  name = 'notebook_abcd_abcxyz'
): NotebooksApiExecution {
  return {
    name,
    displayName: name,
    createTime: '2020-05-01T19:00:07Z',
    updateTime: '2020-05-01T19:09:42Z',
    state: 'SUCCEEDED',
    executionTemplate: {
      scaleTier: 'BASIC',
      masterType: 'n1-standard-4',
      acceleratorConfig: {
        type: 'NVIDIA_TESLA_K80',
        coreCount: '1',
      },
      inputNotebookFile: 'gs://test-project/notebook_abcd/abcd.ipynb',
      outputNotebookFolder: 'gs://test-project/notebook_abcd',
      containerImageUri: 'gcr.io/test:latest',
      location: 'us-west1-b',
    },
    outputNotebookFile: 'gs://test-project/notebook_abcd/abcd.ipynb',
  };
}

/** Returns an AI Platform Job object */
export function getNotebooksApiSchedule(
  name = 'notebook_abcd_abcxyz'
): NotebooksApiSchedule {
  return {
    name,
    displayName: name,
    createTime: '2020-05-01T19:00:07Z',
    updateTime: '2020-05-01T19:09:42Z',
    cronSchedule: '30 12 */2 * *',
    state: 'ENABLED',
    executionTemplate: {
      scaleTier: 'BASIC',
      masterType: 'n1-standard-4',
      acceleratorConfig: {
        type: 'NVIDIA_TESLA_K80',
        coreCount: '1',
      },
      inputNotebookFile: 'gs://test-project/notebook_abcd/abcd.ipynb',
      outputNotebookFolder: 'gs://test-project/notebook_abcd',
      containerImageUri: 'gcr.io/test:latest',
      location: 'us-west1-b',
    },
  };
}

export function getNotebooksApiExecutionConvertedIntoExecution(
  name = 'notebook_abcd_abcxyz'
): Execution {
  return {
    bucketLink:
      'https://console.cloud.google.com/storage/browser/test-project;tab=permissions',
    createTime: '2020-05-01T19:00:07Z',
    downloadLink:
      'https://storage.cloud.google.com/test-project/notebook_abcd/abcd.ipynb',
    updateTime: '2020-05-01T19:09:42Z',
    gcsFile: 'test-project/notebook_abcd/abcd.ipynb',
    id: name,
    link:
      'https://console.cloud.google.com/ai-platform/jobs/' +
      name +
      '?project=test-project',
    name,
    state: 'SUCCEEDED',
    type: 'Execution',
    viewerLink:
      'https://notebooks.cloud.google.com/view/test-project/notebook_abcd/abcd.ipynb?project=test-project',
  };
}

export function getNotebooksApiScheduleConvertedIntoSchedule(
  name = 'notebook_abcd_abcxyz'
): Schedule {
  return {
    createTime: '2020-05-01T19:00:07Z',
    downloadLink:
      'https://storage.cloud.google.com/test-project/notebook_abcd/abcd.ipynb',
    updateTime: '2020-05-01T19:09:42Z',
    gcsFile: 'test-project/notebook_abcd/abcd.ipynb',
    id: name,
    link:
      'https://console.cloud.google.com/ai-platform/notebooks/schedule-details/' +
      name +
      '?project=test-project',
    name,
    state: 'ENABLED',
    schedule: '30 12 */2 * *',
    viewerLink:
      'https://notebooks.cloud.google.com/view/test-project/notebook_abcd/abcd.ipynb?project=test-project',
    hasExecutions: true,
  };
}

export function getCloudStorageApiBucket(name: string, uniform = true) {
  return {
    id: name,
    iamConfiguration: {
      uniformBucketLevelAccess: {
        enabled: uniform,
      },
    },
  };
}

export function getBucket(name: string, uniform = true) {
  return {
    name,
    accessLevel: uniform ? 'uniform' : 'fine',
  };
}
