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
import { ServerConnection } from '@jupyterlab/services';
import { IDocumentManager } from '@jupyterlab/docmanager';
import { IMPORT_DIRECTORY } from '../data';
import { GcpService, NOTEBOOKS_API_BASE } from './gcp';
import { ExecuteNotebookRequest } from '../interfaces';
import {
  TEST_PROJECT,
  getNotebooksApiExecution,
  getNotebooksApiSchedule,
  getNotebooksApiExecutionConvertedIntoExecution,
  getNotebooksApiScheduleConvertedIntoSchedule,
  getCloudStorageApiBucket,
  getBucket,
} from '../test_helpers';
import { asApiResponse } from 'gcp_jupyterlab_shared';
import { ProjectStateService } from './project_state';
import { Contents } from '@jupyterlab/services';
import { INotebookModel, Notebook } from '@jupyterlab/notebook';

describe('GcpService', () => {
  const mockSubmit = jest.fn();
  const mockMakeRequest = jest.fn();
  const mockNewUntitled = jest.fn();
  const mockCreateNew = jest.fn();
  const mockRename = jest.fn();
  const mockDeleteFile = jest.fn();
  const mockFromString = jest.fn();

  const mockNotebook = {
    model: ({
      fromString: mockFromString,
    } as unknown) as INotebookModel,
  } as Notebook;

  const mockProjectState = {
    projectId: Promise.resolve(TEST_PROJECT),
  } as ProjectStateService;
  const mockDocumentManager = ({
    newUntitled: mockNewUntitled,
    rename: mockRename,
    deleteFile: mockDeleteFile,
    createNew: mockCreateNew,
  } as unknown) as IDocumentManager;
  const gcpService = new GcpService(
    { submit: mockSubmit },
    mockProjectState,
    mockDocumentManager
  );

  beforeEach(() => {
    jest.resetAllMocks();
    jest.useFakeTimers();

    ServerConnection.makeRequest = mockMakeRequest;
  });

  describe('GCS', () => {
    it('Uploads a Notebook', async () => {
      const fakeObject = { bucket: 'fake-bucket', name: 'notebook.json' };
      mockSubmit.mockReturnValue(asApiResponse(fakeObject));

      const fakeContents = 'fake Notebook content';
      const object = await gcpService.uploadNotebook(
        fakeContents,
        'gs://fake-bucket/notebook.json'
      );

      expect(object).toEqual(true);
      expect(mockSubmit).toHaveBeenCalledWith({
        headers: { 'Content-Type': 'application/json' },
        params: { name: 'notebook.json', uploadType: 'media' },
        path:
          'https://storage.googleapis.com/upload/storage/v1/b/fake-bucket/o',
        method: 'POST',
        body: fakeContents,
      });
    });

    it('Throws an error when uploading a Notebook', async () => {
      const error = {
        error: {
          code: 429,
          status: 'RESOURCE_EXHAUSTED',
          message: 'Could not upload Notebook',
        },
      };
      mockSubmit.mockRejectedValue(asApiResponse(error));

      const fakeContents = 'fake Notebook content';
      expect.assertions(2);
      try {
        await gcpService.uploadNotebook(
          fakeContents,
          'gs://fake-bucket/notebook.json'
        );
      } catch (err) {
        expect(err).toEqual('RESOURCE_EXHAUSTED: Could not upload Notebook');
      }
      expect(mockSubmit).toHaveBeenCalledWith({
        headers: { 'Content-Type': 'application/json' },
        params: { name: 'notebook.json', uploadType: 'media' },
        path:
          'https://storage.googleapis.com/upload/storage/v1/b/fake-bucket/o',
        method: 'POST',
        body: fakeContents,
      });
    });

    it('Imports a Notebook and creates a new directory', async () => {
      mockSubmit.mockReturnValue(
        asApiResponse({ contents: '{"content1":"test","content2":22}' })
      );
      mockNewUntitled.mockResolvedValue({ path: 'path' } as Contents.IModel);
      mockRename.mockResolvedValue({ path: 'newpath' } as Contents.IModel);
      mockCreateNew.mockReturnValue(mockNotebook);

      await gcpService.importNotebook(
        'gs://fake-bucket/intermediate path/notebook.json'
      );

      expect(mockSubmit).toHaveBeenCalledWith({
        params: { alt: 'media' },
        path:
          'https://storage.googleapis.com/storage/v1/b/fake-bucket/o/intermediate%20path%2Fnotebook.json',
      });
      expect(mockNewUntitled).toHaveBeenCalledWith({ type: 'directory' });
      expect(mockRename).toHaveBeenCalledWith('path', IMPORT_DIRECTORY);
      expect(mockDeleteFile).not.toHaveBeenCalled();
      expect(mockFromString).toHaveBeenCalledWith(
        '{"contents":"{\\"content1\\":\\"test\\",\\"content2\\":22}"}'
      );
    });

    it('Imports a Notebook into an already existing directory', async () => {
      mockSubmit.mockReturnValue(
        asApiResponse({ contents: '{"content1":"test","content2":22}' })
      );
      mockNewUntitled.mockResolvedValue({ path: 'path' } as Contents.IModel);
      const error = { message: '409' };
      mockRename.mockRejectedValue(error);
      mockCreateNew.mockReturnValue(mockNotebook);

      await gcpService.importNotebook(
        'gs://fake-bucket/intermediate path/notebook.json'
      );

      expect(mockSubmit).toHaveBeenCalledWith({
        params: { alt: 'media' },
        path:
          'https://storage.googleapis.com/storage/v1/b/fake-bucket/o/intermediate%20path%2Fnotebook.json',
      });
      expect(mockNewUntitled).toHaveBeenCalledWith({ type: 'directory' });
      expect(mockRename).toHaveBeenCalledWith('path', IMPORT_DIRECTORY);
      expect(mockDeleteFile).toHaveBeenCalledWith('path');
      expect(mockFromString).toHaveBeenCalledWith(
        '{"contents":"{\\"content1\\":\\"test\\",\\"content2\\":22}"}'
      );
    });

    it('Downloads a Notebook', async () => {
      mockSubmit.mockReturnValue(
        asApiResponse({ contents: 'fake Notebook content' })
      );
      const downloaded = await gcpService.downloadNotebook(
        'gs://fake-bucket/intermediate path/notebook.json'
      );

      expect(downloaded).toEqual('{"contents":"fake Notebook content"}');
      expect(mockSubmit).toHaveBeenCalledWith({
        params: { alt: 'media' },
        path:
          'https://storage.googleapis.com/storage/v1/b/fake-bucket/o/intermediate%20path%2Fnotebook.json',
      });
    });

    it('Throws an error when downloading a Notebook', async () => {
      const error = {
        error: {
          code: 404,
          status: 'RESOURCE_NOT_FOUND',
          message: 'Could not find Notebook',
        },
      };
      mockSubmit.mockRejectedValue(asApiResponse(error));

      expect.assertions(2);
      try {
        await gcpService.downloadNotebook(
          'gs://fake-bucket/intermediate path/notebook.json'
        );
      } catch (err) {
        expect(err).toEqual('RESOURCE_NOT_FOUND: Could not find Notebook');
      }
      expect(mockSubmit).toHaveBeenCalledWith({
        params: { alt: 'media' },
        path:
          'https://storage.googleapis.com/storage/v1/b/fake-bucket/o/intermediate%20path%2Fnotebook.json',
      });
    });
  });

  describe('Notebooks', () => {
    const executeNotebookRequest: ExecuteNotebookRequest = {
      name: 'test_notebook_execution',
      imageUri: 'gcr.io/deeplearning-platform-release/tf-gpu.1-14:m32',
      inputNotebookGcsPath: 'gs://test-bucket/test_nb.ipynb',
      masterType: '',
      outputNotebookFolder: 'gs://test-bucket/test_nb-out.ipynb',
      region: 'us-east1',
      scaleTier: 'STANDARD_1',
      gcsBucket: 'gcsBucket',
      acceleratorType: '',
      acceleratorCount: '',
    };

    const executeNotebookRequestBody = {
      executionTemplate: {
        acceleratorConfig: undefined,
        containerImageUri:
          'gcr.io/deeplearning-platform-release/tf-gpu.1-14:m32',
        inputNotebookFile: 'gs://test-bucket/test_nb.ipynb',
        outputNotebookFolder: 'gs://test-bucket/test_nb-out.ipynb',
        location: 'us-east1',
        masterType: undefined,
        scaleTier: 'STANDARD_1',
      },
      state: 'STATE_UNSPECIFIED',
      name: 'test_notebook_execution',
      displayName: 'test_notebook_execution',
      description: 'Execution for test_notebook_execution',
    };

    const scheduleNotebookRequestBody = {
      cronSchedule: '0 1 * * 5',
      executionTemplate: {
        acceleratorConfig: undefined,
        containerImageUri:
          'gcr.io/deeplearning-platform-release/tf-gpu.1-14:m32',
        inputNotebookFile: 'gs://test-bucket/test_nb.ipynb',
        outputNotebookFolder: 'gs://test-bucket/test_nb-out.ipynb',
        location: 'us-east1',
        masterType: undefined,
        scaleTier: 'STANDARD_1',
      },
      state: 'STATE_UNSPECIFIED',
      name: 'test_notebook_execution',
      displayName: 'test_notebook_execution',
      description: 'Schedule for test_notebook_execution',
      timeZone: 'UTC',
    };

    it('Submits Notebook Execution to AI Platform', async () => {
      const returnedJob = {
        name: 'operation-name',
        done: true,
      };
      mockSubmit.mockReturnValue(asApiResponse(returnedJob));

      const execution = await gcpService.executeNotebook(
        executeNotebookRequest
      );
      expect(execution).toEqual({});
      expect(mockSubmit).toHaveBeenCalledWith({
        method: 'POST',
        path: `${NOTEBOOKS_API_BASE}/projects/test-project/locations/us-east1/executions?execution_id=test_notebook_execution`,
        body: executeNotebookRequestBody,
      });
    });

    it('Submits Notebook Execution to AI Platform and gets an error response', async () => {
      const returnedJob = {
        name: 'operation-name',
        error: { code: 800, message: 'This is an error' },
        done: true,
      };
      mockSubmit.mockReturnValue(asApiResponse(returnedJob));

      const execution = await gcpService.executeNotebook(
        executeNotebookRequest
      );
      expect(execution).toEqual({ error: '800: This is an error' });
      expect(mockSubmit).toHaveBeenCalledWith({
        method: 'POST',
        path: `${NOTEBOOKS_API_BASE}/projects/test-project/locations/us-east1/executions?execution_id=test_notebook_execution`,
        body: executeNotebookRequestBody,
      });
    });

    it('Throws an error when submitting Notebook to AI Platform', async () => {
      const error = {
        error: {
          status: 'UNAVAILABLE',
          message: 'Could not create AI Platform Job',
        },
      };
      mockSubmit.mockRejectedValue(asApiResponse(error));

      expect.assertions(2);
      try {
        await gcpService.executeNotebook(executeNotebookRequest);
      } catch (err) {
        expect(err).toEqual('UNAVAILABLE: Could not create AI Platform Job');
      }
      expect(mockSubmit).toHaveBeenCalledWith({
        method: 'POST',
        path: `${NOTEBOOKS_API_BASE}/projects/test-project/locations/us-east1/executions?execution_id=test_notebook_execution`,
        body: executeNotebookRequestBody,
      });
    });

    it('Submits Schedule Notebook', async () => {
      const returnedJob = {
        name: 'test_scheduled_notebook_execution',
        done: true,
      };
      mockSubmit.mockReturnValue(asApiResponse(returnedJob));
      const schedule = '0 1 * * 5';

      const scheduleNotebook = await gcpService.scheduleNotebook(
        executeNotebookRequest,
        schedule
      );

      expect(scheduleNotebook).toEqual({});
      expect(mockSubmit).toHaveBeenCalledWith({
        body: scheduleNotebookRequestBody,
        method: 'POST',
        path: `${NOTEBOOKS_API_BASE}/projects/test-project/locations/us-east1/schedules?schedule_id=test_notebook_execution`,
      });
    });

    it('Submits Notebook Schedule and gets an error response', async () => {
      const returnedJob = {
        name: 'operation-name',
        error: { code: 800, message: 'This is an error' },
        done: true,
      };
      mockSubmit.mockReturnValue(asApiResponse(returnedJob));
      const schedule = '0 1 * * 5';

      const scheduleNotebook = await gcpService.scheduleNotebook(
        executeNotebookRequest,
        schedule
      );

      expect(scheduleNotebook).toEqual({ error: '800: This is an error' });
      expect(mockSubmit).toHaveBeenCalledWith({
        body: scheduleNotebookRequestBody,
        method: 'POST',
        path: `${NOTEBOOKS_API_BASE}/projects/test-project/locations/us-east1/schedules?schedule_id=test_notebook_execution`,
      });
    });

    it('Throws an error when submitting Scheduled Notebook Job', async () => {
      const error = {
        error: {
          status: 'QUOTA_EXHAUSTED',
          message: 'Could not create Cloud Scheduler Job',
        },
      };
      mockSubmit.mockRejectedValue(asApiResponse(error));
      const schedule = '0 1 * * 5';

      expect.assertions(2);
      try {
        await gcpService.scheduleNotebook(executeNotebookRequest, schedule);
      } catch (err) {
        expect(err).toEqual(
          'QUOTA_EXHAUSTED: Could not create Cloud Scheduler Job'
        );
      }

      expect(mockSubmit).toHaveBeenCalledWith({
        body: scheduleNotebookRequestBody,
        method: 'POST',
        path: `${NOTEBOOKS_API_BASE}/projects/test-project/locations/us-east1/schedules?schedule_id=test_notebook_execution`,
      });
    });

    it('Lists notebook executions', async () => {
      mockSubmit.mockReturnValue(
        asApiResponse({
          executions: [
            getNotebooksApiExecution(),
            getNotebooksApiExecution('execution2'),
          ],
          nextPageToken: 'xyz',
        })
      );

      const executions = await gcpService.listExecutions();
      expect(executions).toEqual({
        pageToken: 'xyz',
        executions: [
          getNotebooksApiExecutionConvertedIntoExecution(),
          getNotebooksApiExecutionConvertedIntoExecution('execution2'),
        ],
      });
      expect(mockSubmit).toHaveBeenCalledWith({
        path: `${NOTEBOOKS_API_BASE}/projects/test-project/locations/-/executions`,
        params: { filter: '' },
      });
    });

    it('Lists notebook executions empty executions response', async () => {
      mockSubmit.mockReturnValue(
        asApiResponse({
          executions: [],
        })
      );

      const executions = await gcpService.listExecutions();
      expect(executions).toEqual({ executions: [], pageToken: undefined });
      expect(mockSubmit).toHaveBeenCalledWith({
        path: `${NOTEBOOKS_API_BASE}/projects/test-project/locations/-/executions`,
        params: { filter: '' },
      });
    });

    it('Lists notebook executions empty response', async () => {
      mockSubmit.mockReturnValue(asApiResponse({}));

      const executions = await gcpService.listExecutions();
      expect(executions).toEqual({ executions: [], pageToken: undefined });
      expect(mockSubmit).toHaveBeenCalledWith({
        path: `${NOTEBOOKS_API_BASE}/projects/test-project/locations/-/executions`,
        params: { filter: '' },
      });
    });

    it('Lists notebook executions unreachable response', async () => {
      mockSubmit.mockReturnValue(
        asApiResponse({ unreachable: ['us-central1', 'us-west1'] })
      );

      expect.assertions(2);
      try {
        await gcpService.listExecutions('', 10, 'abc123');
      } catch (err) {
        expect(err).toEqual('UNREACHABLE: us-central1, us-west1');
      }

      expect(mockSubmit).toHaveBeenCalledWith({
        path: `${NOTEBOOKS_API_BASE}/projects/test-project/locations/-/executions`,
        params: {
          filter: '',
          pageSize: '10',
          pageToken: 'abc123',
        },
      });
    });

    it('Throws error when listing notebook executions', async () => {
      const error = {
        error: {
          status: 'BAD_REQUEST',
          message: 'Unable to retrieve notebook executions',
        },
      };
      mockSubmit.mockRejectedValue(asApiResponse(error));

      expect.assertions(2);
      try {
        await gcpService.listExecutions('', 10, 'abc123');
      } catch (err) {
        expect(err).toEqual(
          'BAD_REQUEST: Unable to retrieve notebook executions'
        );
      }
      expect(mockSubmit).toHaveBeenCalledWith({
        path: `${NOTEBOOKS_API_BASE}/projects/test-project/locations/-/executions`,
        params: {
          filter: '',
          pageSize: '10',
          pageToken: 'abc123',
        },
      });
    });

    it('Lists notebook schedules', async () => {
      mockSubmit
        .mockReturnValueOnce(
          asApiResponse({
            schedules: [
              getNotebooksApiSchedule('schedule1'),
              getNotebooksApiSchedule('schedule2'),
            ],
            nextPageToken: 'xyz',
          })
        )
        .mockReturnValueOnce(
          asApiResponse({
            executions: [getNotebooksApiExecution('execution1')],
            nextPageToken: 'abc',
          })
        )
        .mockReturnValueOnce(
          asApiResponse({
            executions: [getNotebooksApiExecution('execution2')],
            nextPageToken: 'def',
          })
        );

      const schedules = await gcpService.listSchedules();
      expect(schedules).toEqual({
        pageToken: 'xyz',
        schedules: [
          getNotebooksApiScheduleConvertedIntoSchedule('schedule1'),
          getNotebooksApiScheduleConvertedIntoSchedule('schedule2'),
        ],
      });
      expect(mockSubmit).toHaveBeenCalledWith({
        path: `${NOTEBOOKS_API_BASE}/projects/test-project/locations/-/schedules`,
        params: {},
      });
      expect(mockSubmit).toHaveBeenCalledWith({
        path: `${NOTEBOOKS_API_BASE}/projects/test-project/locations/-/executions`,
        params: {
          pageSize: '1',
          filter: 'execution_template.labels.schedule_id:schedule1',
        },
      });
      expect(mockSubmit).toHaveBeenCalledWith({
        path: `${NOTEBOOKS_API_BASE}/projects/test-project/locations/-/executions`,
        params: {
          pageSize: '1',
          filter: 'execution_template.labels.schedule_id:schedule2',
        },
      });
    });

    it('Lists notebook schedules empty schedules response', async () => {
      mockSubmit.mockReturnValue(
        asApiResponse({
          schedules: [],
        })
      );

      const schedules = await gcpService.listSchedules();
      expect(schedules).toEqual({ schedules: [], pageToken: undefined });
      expect(mockSubmit).toHaveBeenCalledWith({
        path: `${NOTEBOOKS_API_BASE}/projects/test-project/locations/-/schedules`,
        params: {},
      });
    });

    it('Lists notebook schedules empty response', async () => {
      mockSubmit.mockReturnValue(asApiResponse({}));

      const schedules = await gcpService.listSchedules();
      expect(schedules).toEqual({ schedules: [], pageToken: undefined });
      expect(mockSubmit).toHaveBeenCalledWith({
        path: `${NOTEBOOKS_API_BASE}/projects/test-project/locations/-/schedules`,
        params: {},
      });
    });

    it('Lists notebook schedules unreachable response', async () => {
      mockSubmit.mockReturnValue(
        asApiResponse({ unreachable: ['us-central1', 'us-west1'] })
      );

      expect.assertions(2);
      try {
        await gcpService.listSchedules(10, 'abc123');
      } catch (err) {
        expect(err).toEqual('UNREACHABLE: us-central1, us-west1');
      }

      expect(mockSubmit).toHaveBeenCalledWith({
        path: `${NOTEBOOKS_API_BASE}/projects/test-project/locations/-/schedules`,
        params: {
          pageSize: '10',
          pageToken: 'abc123',
        },
      });
    });

    it('Throws error when listing notebook schedules', async () => {
      const error = {
        error: {
          status: 'BAD_REQUEST',
          message: 'Unable to retrieve notebook schedules',
        },
      };
      mockSubmit.mockRejectedValue(asApiResponse(error));

      expect.assertions(2);
      try {
        await gcpService.listSchedules(10, 'abc123');
      } catch (err) {
        expect(err).toEqual(
          'BAD_REQUEST: Unable to retrieve notebook schedules'
        );
      }
      expect(mockSubmit).toHaveBeenCalledWith({
        path: `${NOTEBOOKS_API_BASE}/projects/test-project/locations/-/schedules`,
        params: {
          pageSize: '10',
          pageToken: 'abc123',
        },
      });
    });

    it('Lists cloud storage buckets', async () => {
      mockSubmit.mockReturnValue(
        asApiResponse({
          items: [
            getCloudStorageApiBucket('new-bucket-name1', false),
            getCloudStorageApiBucket('new-bucket-name2'),
          ],
        })
      );

      const listBucketsResponse = await gcpService.listBuckets();
      expect(listBucketsResponse).toEqual({
        buckets: [
          getBucket('new-bucket-name1', false),
          getBucket('new-bucket-name2'),
        ],
      });

      expect(mockSubmit).toHaveBeenCalledWith({
        path: 'https://storage.googleapis.com/storage/v1/b',
        params: {
          project: 'test-project',
          projection: 'noACL',
        },
      });
    });

    it('Lists cloud storage buckets empty items response', async () => {
      mockSubmit.mockReturnValue(
        asApiResponse({
          items: [],
        })
      );

      const listBucketsResponse = await gcpService.listBuckets();
      expect(listBucketsResponse).toEqual({
        buckets: [],
      });

      expect(mockSubmit).toHaveBeenCalledWith({
        path: 'https://storage.googleapis.com/storage/v1/b',
        params: {
          project: 'test-project',
          projection: 'noACL',
        },
      });
    });

    it('Lists cloud storage buckets empty response', async () => {
      mockSubmit.mockReturnValue(asApiResponse({}));

      const listBucketsResponse = await gcpService.listBuckets();
      expect(listBucketsResponse).toEqual({
        buckets: [],
      });

      expect(mockSubmit).toHaveBeenCalledWith({
        path: 'https://storage.googleapis.com/storage/v1/b',
        params: {
          project: 'test-project',
          projection: 'noACL',
        },
      });
    });

    it('Throws error when listing cloud storage buckets', async () => {
      const error = {
        error: {
          status: 'BAD_REQUEST',
          message: 'Unable to retrieve buckets',
        },
      };
      mockSubmit.mockRejectedValue(asApiResponse(error));

      expect.assertions(2);
      try {
        await gcpService.listBuckets();
      } catch (err) {
        expect(err).toEqual('BAD_REQUEST: Unable to retrieve buckets');
      }
      expect(mockSubmit).toHaveBeenCalledWith({
        path: 'https://storage.googleapis.com/storage/v1/b',
        params: {
          project: 'test-project',
          projection: 'noACL',
        },
      });
    });

    it('Creates cloud storage bucket', async () => {
      mockSubmit.mockReturnValue(
        asApiResponse(getCloudStorageApiBucket('new-bucket-name'))
      );

      const bucketResponse = await gcpService.createUniformAccessBucket(
        'new-bucket-name'
      );

      expect(bucketResponse).toEqual(getBucket('new-bucket-name'));

      expect(mockSubmit).toHaveBeenCalledWith({
        path: 'https://storage.googleapis.com/storage/v1/b',
        params: {
          project: 'test-project',
        },
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'new-bucket-name',
          iamConfiguration: {
            uniformBucketLevelAccess: {
              enabled: true,
            },
          },
        }),
      });
    });

    it('Creates cloud storage bucket empty response', async () => {
      mockSubmit.mockReturnValue(asApiResponse({}));

      try {
        await gcpService.createUniformAccessBucket('new-bucket-name');
      } catch (err) {
        expect(err).toEqual('Unable to create bucket');
      }

      expect(mockSubmit).toHaveBeenCalledWith({
        path: 'https://storage.googleapis.com/storage/v1/b',
        params: {
          project: 'test-project',
        },
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'new-bucket-name',
          iamConfiguration: {
            uniformBucketLevelAccess: {
              enabled: true,
            },
          },
        }),
      });
    });

    it('Throws error when creating uniform access bucket', async () => {
      const error = {
        error: {
          status: 'BAD_REQUEST',
          message: 'Unable to create bucket',
        },
      };
      mockSubmit.mockRejectedValue(asApiResponse(error));

      expect.assertions(2);
      try {
        await gcpService.createUniformAccessBucket('new-bucket-name');
      } catch (err) {
        expect(err).toEqual('BAD_REQUEST: Unable to create bucket');
      }
      expect(mockSubmit).toHaveBeenCalledWith({
        path: 'https://storage.googleapis.com/storage/v1/b',
        params: {
          project: 'test-project',
        },
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'new-bucket-name',
          iamConfiguration: {
            uniformBucketLevelAccess: {
              enabled: true,
            },
          },
        }),
      });
    });
  });

  describe('Environment Image', () => {
    it('Gets image URI from JupyterLab server', async () => {
      mockMakeRequest.mockResolvedValue({
        text: () =>
          Promise.resolve('gcr.io/deeplearning-platform-release/tf-cpu.1-14'),
      });

      const imageUri = await gcpService.getImageUri();
      const url = mockMakeRequest.mock.calls[0][0];
      expect(imageUri).toBe('gcr.io/deeplearning-platform-release/tf-cpu.1-14');
      expect(url).toMatch(new RegExp('/gcp/v1/runtime$'));
    });

    it('Returns an empty string if image URI retrieval fails', async () => {
      const error = { error: 'Unable to retrieve environment' };
      mockMakeRequest.mockRejectedValue(error);

      const imageUri = await gcpService.getImageUri();
      const url = mockMakeRequest.mock.calls[0][0];
      expect(imageUri).toBe('');
      expect(url).toMatch(new RegExp('/gcp/v1/runtime$'));
    });
  });
});
