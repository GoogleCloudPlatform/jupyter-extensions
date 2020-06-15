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
import { CLOUD_FUNCTION_REGION, IMPORT_DIRECTORY } from '../data';
import { GcpService, RunNotebookRequest } from './gcp';
import { TEST_PROJECT, asApiResponse } from '../test_helpers';
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

      expect(object).toEqual(fakeObject);
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
    const runNotebookRequest: RunNotebookRequest = {
      jobId: 'test_notebook_job',
      imageUri: 'gcr.io/deeplearning-platform-release/tf-gpu.1-14:m32',
      inputNotebookGcsPath: 'gs://test-bucket/test_nb.ipynb',
      masterType: '',
      outputNotebookGcsPath: 'gs://test-bucket/test_nb-out.ipynb',
      region: 'us-east1',
      scaleTier: 'STANDARD_1',
      acceleratorType: '',
      acceleratorCount: '',
    };

    const aiPlatformJobBody: gapi.client.ml.GoogleCloudMlV1__Job = {
      jobId: 'test_notebook_job',
      labels: { job_type: 'jupyterlab_immediate_notebook' },
      trainingInput: {
        args: [
          'nbexecutor',
          '--input-notebook',
          'gs://test-bucket/test_nb.ipynb',
          '--output-notebook',
          'gs://test-bucket/test_nb-out.ipynb',
        ],
        masterConfig: {
          imageUri: 'gcr.io/deeplearning-platform-release/tf-gpu.1-14:m32',
          acceleratorConfig: {},
        },
        region: 'us-east1',
        scaleTier: 'STANDARD_1',
      },
    } as gapi.client.ml.GoogleCloudMlV1__Job;
    const scheduledJobBody = {
      ...aiPlatformJobBody,
      labels: { job_type: 'jupyterlab_scheduled_notebook' },
    } as gapi.client.ml.GoogleCloudMlV1__Job;

    it('Submits Notebook Job to AI Platform', async () => {
      const now = new Date().toLocaleString();
      const returnedJob = {
        jobId: 'test_notebook_job',
        createTime: now,
      };
      mockSubmit.mockReturnValue(asApiResponse(returnedJob));

      const job = await gcpService.runNotebook(runNotebookRequest);
      expect(job).toEqual(returnedJob);
      expect(mockSubmit).toHaveBeenCalledWith({
        method: 'POST',
        path: 'https://ml.googleapis.com/v1/projects/test-project/jobs',
        body: aiPlatformJobBody,
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
        await gcpService.runNotebook(runNotebookRequest);
      } catch (err) {
        expect(err).toEqual('UNAVAILABLE: Could not create AI Platform Job');
      }
      expect(mockSubmit).toHaveBeenCalledWith({
        method: 'POST',
        path: 'https://ml.googleapis.com/v1/projects/test-project/jobs',
        body: aiPlatformJobBody,
      });
    });

    it('Submits Schedule Notebook Job to Cloud Scheduler', async () => {
      const returnedJob = {
        name: 'test_scheduled_notebook_job',
      };
      mockSubmit.mockReturnValue(asApiResponse(returnedJob));

      const expectedCloudFunctionUrl =
        'https://us-central1-test-project.cloudfunctions.net/submitScheduledNotebook';
      const serviceAccountEmail = 'test-project@appspot.gserviceaccount.com';
      const schedule = '0 1 * * 5';

      const job = await gcpService.scheduleNotebook(
        runNotebookRequest,
        CLOUD_FUNCTION_REGION,
        schedule
      );

      expect(job).toEqual(returnedJob);
      expect(mockSubmit).toHaveBeenCalledWith({
        body: {
          description: 'jupyterlab_scheduled_notebook',
          httpTarget: {
            body: btoa(JSON.stringify(scheduledJobBody)),
            headers: { 'Content-Type': 'application/json' },
            httpMethod: 'POST',
            oidcToken: { serviceAccountEmail },
            uri: expectedCloudFunctionUrl,
          },
          name: `projects/test-project/locations/us-central1/jobs/${runNotebookRequest.jobId}`,
          schedule,
          timeZone: expect.any(String),
        },
        method: 'POST',
        path:
          'https://cloudscheduler.googleapis.com/v1/projects/test-project/locations/us-central1/jobs',
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

      const expectedCloudFunctionUrl =
        'https://us-central1-test-project.cloudfunctions.net/submitScheduledNotebook';
      const serviceAccountEmail = 'test-project@appspot.gserviceaccount.com';
      const schedule = '0 1 * * 5';

      expect.assertions(2);
      try {
        await gcpService.scheduleNotebook(
          runNotebookRequest,
          'us-east1',
          schedule
        );
      } catch (err) {
        expect(err).toEqual(
          'QUOTA_EXHAUSTED: Could not create Cloud Scheduler Job'
        );
      }

      expect(mockSubmit).toHaveBeenCalledWith({
        body: {
          description: 'jupyterlab_scheduled_notebook',
          httpTarget: {
            body: btoa(JSON.stringify(scheduledJobBody)),
            headers: { 'Content-Type': 'application/json' },
            httpMethod: 'POST',
            oidcToken: { serviceAccountEmail },
            uri: expectedCloudFunctionUrl,
          },
          name: `projects/test-project/locations/us-east1/jobs/${runNotebookRequest.jobId}`,
          schedule,
          timeZone: expect.any(String),
        },
        method: 'POST',
        path:
          'https://cloudscheduler.googleapis.com/v1/projects/test-project/locations/us-east1/jobs',
      });
    });

    it('Lists notebook jobs', async () => {
      mockSubmit.mockReturnValue(asApiResponse({}));

      await gcpService.listNotebookJobs();
      expect(mockSubmit).toHaveBeenCalledWith({
        path: 'https://ml.googleapis.com/v1/projects/test-project/jobs',
        params: {
          filter:
            'labels.job_type=jupyterlab_scheduled_notebook OR labels.job_type=jupyterlab_immediate_notebook',
        },
      });
    });

    it('Throws error when listing notebook jobs', async () => {
      const error = {
        error: {
          status: 'BAD_REQUEST',
          message: 'Unable to retrieve notebook jobs',
        },
      };
      mockSubmit.mockRejectedValue(asApiResponse(error));

      expect.assertions(2);
      try {
        await gcpService.listNotebookJobs('abc123');
      } catch (err) {
        expect(err).toEqual('BAD_REQUEST: Unable to retrieve notebook jobs');
      }
      expect(mockSubmit).toHaveBeenCalledWith({
        path: 'https://ml.googleapis.com/v1/projects/test-project/jobs',
        params: {
          filter:
            'labels.job_type=jupyterlab_scheduled_notebook OR labels.job_type=jupyterlab_immediate_notebook',
          pageToken: 'abc123',
        },
      });
    });
  });

  describe('Container Image', () => {
    it('Gets image URI from JupyterLab server', async () => {
      mockMakeRequest.mockResolvedValue({
        text: () => Promise.resolve('tf-cpu.1-14.m34'),
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
