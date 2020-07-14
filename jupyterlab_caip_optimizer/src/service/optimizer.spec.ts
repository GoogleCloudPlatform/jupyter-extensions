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
import { OptimizerService, prettifyStudyName } from './optimizer';
import { ServerConnection } from '@jupyterlab/services';
import { MetadataRequired } from '../types';
import {
  fakeStudy,
  fakeStudyResponseActive,
  fakeStudyListResponse,
} from './test-constants';
import { asApiResponse } from 'gcp_jupyterlab_shared';

describe('OptimizerService', () => {
  const mockSubmit = jest.fn();
  const mockMakeRequest = jest.fn();
  const optimizerService = new OptimizerService({
    submit: mockSubmit,
  });

  const fakeMetadataRequired = {
    projectId: '1',
    region: 'us-central1',
  } as MetadataRequired;

  beforeEach(() => {
    ServerConnection.makeRequest = mockMakeRequest;
  });

  it('Creates a study', async () => {
    mockSubmit.mockReturnValue(asApiResponse(fakeStudyResponseActive));
    const object = await optimizerService.createStudy(
      fakeStudy,
      fakeMetadataRequired
    );
    expect(object).toEqual(fakeStudyResponseActive);
    expect(mockSubmit).toHaveBeenCalledWith({
      path: `https://us-central1-ml.googleapis.com/v1/projects/1/locations/us-central1/studies?study_id=study-default`,
      method: 'POST',
      body: JSON.stringify(fakeStudy),
    });
  });

  it('Retrieves the list of created studies', async () => {
    mockSubmit.mockReturnValue(
      asApiResponse({ studies: fakeStudyListResponse })
    );
    const object = await optimizerService.listStudy(fakeMetadataRequired);
    expect(object).toEqual(fakeStudyListResponse);
    expect(mockSubmit).toHaveBeenCalledWith({
      path: `https://us-central1-ml.googleapis.com/v1/projects/1/locations/us-central1/studies`,
      method: 'GET',
    });
  });

  it('deletes a study', async () => {
    mockSubmit.mockReturnValue(asApiResponse(undefined));
    const studyName =
      'projects/222309772370/locations/us-central1/studies/study-default';
    await optimizerService.deleteStudy(studyName, fakeMetadataRequired);
    expect(mockSubmit).toHaveBeenCalledWith({
      path: `https://us-central1-ml.googleapis.com/v1/projects/${fakeMetadataRequired.projectId}/locations/${fakeMetadataRequired.region}/studies/study-default`,
      method: 'DELETE',
    });
  });

  it('gets a specific study', async () => {
    mockSubmit.mockReturnValue(asApiResponse(fakeStudy));
    const studyName =
      'projects/222309772370/locations/us-central1/studies/study-default';
    await optimizerService.getStudy(studyName, fakeMetadataRequired);
    expect(mockSubmit).toHaveBeenCalledWith({
      path: `https://us-central1-ml.googleapis.com/v1/projects/${fakeMetadataRequired.projectId}/locations/${fakeMetadataRequired.region}/studies/study-default`,
      method: 'GET',
    });
  });
});

describe('prettifyOperationId', () => {
  it('makes a study name readable', () => {
    expect(
      prettifyOperationId(
        'projects/project-name/locations/us-central1/operations/operation / id'
      )
    ).toEqual('operation / id');
  });
});

describe('prettifyStudyName', () => {
  it('makes an operation id readable', () => {
    expect(
      prettifyStudyName(
        'projects/project-name/locations/us-central1/studies/study / name'
      )
    ).toEqual('study / name');
  });
});

describe('prettifyTrial', () => {
  it('makes a trial name readable', () => {
    expect(
      prettifyTrial(
        'projects/project-name/locations/us-central1/studies/study / name/trials/trial / name'
      )
    ).toEqual('trial / name');
  });
});
