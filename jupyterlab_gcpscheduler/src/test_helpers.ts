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
import { ProjectState } from './service/project_state';
import { ReactWrapper, ShallowWrapper } from 'enzyme';
import { AiPlatformJob } from './service/gcp';

export const TEST_PROJECT = 'test-project';

/** Returns a blank project state. */
export function getProjectState(): ProjectState {
  return {
    allServicesEnabled: false,
    requiredServicesEnabled: false,
    hasCloudFunction: false,
    hasGcsBucket: false,
    projectId: TEST_PROJECT,
    schedulerRegion: '',
    serviceStatuses: [
      {
        enabled: false,
        service: {
          name: 'Cloud Storage API',
          endpoint: 'storage-api.googleapis.com',
          documentation: 'https://cloud.google.com/storage/',
          isOptional: false,
        },
      },
      {
        enabled: false,
        service: {
          name: 'AI Platform Training API',
          endpoint: 'ml.googleapis.com',
          documentation: 'https://cloud.google.com/ai-platform/',
          isOptional: false,
        },
      },
      {
        enabled: false,
        service: {
          name: 'Cloud Scheduler API',
          endpoint: 'cloudscheduler.googleapis.com',
          documentation: 'https://cloud.google.com/scheduler',
          isOptional: true,
        },
      },
      {
        enabled: false,
        service: {
          name: 'Cloud Functions API',
          endpoint: 'cloudfunctions.googleapis.com',
          documentation: 'https://cloud.google.com/functions/',
          isOptional: true,
        },
      },
    ],
    canSubmitImmediateJobs: false,
    canSubmitScheduledJobs: false,
  };
}

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

/** Returns an AI Platform Job object */
export function getAiPlatformJob(): AiPlatformJob {
  return {
    jobId: 'notebook_job1_abcxyz',
    trainingInput: {
      args: [
        'nbexecutor',
        '--input-notebook',
        `gs://${TEST_PROJECT}/notebook_job1/nb.ipynb`,
        '--output-notebook',
        `gs://${TEST_PROJECT}/notebook_job1/job1.ipynb`,
      ],
      region: 'us-central1',
      masterConfig: {
        imageUri: 'gcr.io/deeplearning-platform-release/tf-cpu.1-15:latest',
      },
    },
    createTime: '2020-05-01T19:00:07Z',
    startTime: '2020-05-01T19:04:08Z',
    endTime: '2020-05-01T19:09:42Z',
    state: 'SUCCEEDED',
    trainingOutput: { consumedMLUnits: 0.06 },
    labels: {
      /* eslint-disable @typescript-eslint/camelcase */
      job_type: 'jupyterlab_scheduled_notebook',
      scheduler_job_name: 'notebook_job1',
      /* eslint-enable @typescript-eslint/camelcase */
    },
  } as AiPlatformJob;
}
