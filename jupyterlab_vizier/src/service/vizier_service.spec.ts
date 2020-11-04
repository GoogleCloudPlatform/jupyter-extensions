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

import {
  VizierService,
  prettifyStudyName,
  prettifyOperationId,
  prettifyTrial,
} from './vizier_service';
import {
  fakeStudy,
  fakeStudyResponseActive,
  fakeStudyListResponse,
  fakeTrial,
  fakeMeasurement,
  cleanFakeTrialName,
  cleanFakeStudyName,
} from './test_constants';
import { asApiResponse } from 'gcp_jupyterlab_shared';

describe('VizierService', () => {
  let mockSubmit: jest.Mock;
  let vizierService: VizierService;

  const TEST_PROJECT = 'test-project';
  const TEST_REGION = 'us-central1';

  beforeEach(() => {
    jest.resetAllMocks();
    jest.useFakeTimers();

    mockGetMetadata.mockResolvedValue({
      project: TEST_PROJECT,
    });
    mockSubmit = jest.fn();
    vizierService = new VizierService({
      submit: mockSubmit,
    });
  });

  it('Creates a study', async () => {
    mockSubmit.mockReturnValue(asApiResponse(fakeStudyResponseActive));
    const pendingStudy = { ...fakeStudy, name: cleanFakeStudyName };
    const object = await vizierService.createStudy(pendingStudy);
    expect(object).toEqual(fakeStudyResponseActive);
    expect(mockSubmit).toHaveBeenCalledWith({
      path: `https://${TEST_REGION}-ml.googleapis.com/v1/projects/${TEST_PROJECT}/locations/${TEST_REGION}/studies?study_id=study-default`,
      method: 'POST',
      body: JSON.stringify(pendingStudy),
    });
  });

  it('Retrieves the list of created studies', async () => {
    mockSubmit.mockReturnValue(
      asApiResponse({ studies: fakeStudyListResponse })
    );
    const object = await vizierService.listStudy();
    expect(object).toEqual(fakeStudyListResponse);
    expect(mockSubmit).toHaveBeenCalledWith({
      path: `https://${TEST_REGION}-ml.googleapis.com/v1/projects/${TEST_PROJECT}/locations/${TEST_REGION}/studies`,
      method: 'GET',
    });
  });

  it('deletes a study', async () => {
    mockSubmit.mockReturnValue(asApiResponse(undefined));
    const studyName =
      'projects/222309772370/locations/${TEST_REGION}/studies/study-default';
    await vizierService.deleteStudy(studyName);
    expect(mockSubmit).toHaveBeenCalledWith({
      path: `https://${TEST_REGION}-ml.googleapis.com/v1/projects/${TEST_PROJECT}/locations/${TEST_REGION}/studies/study-default`,
      method: 'DELETE',
    });
  });

  it('gets a specific study', async () => {
    mockSubmit.mockReturnValue(asApiResponse(fakeStudy));
    const studyName =
      'projects/222309772370/locations/${TEST_REGION}/studies/study-default';
    await vizierService.getStudy(studyName);
    expect(mockSubmit).toHaveBeenCalledWith({
      path: `https://${TEST_REGION}-ml.googleapis.com/v1/projects/${TEST_PROJECT}/locations/${TEST_REGION}/studies/study-default`,
      method: 'GET',
    });
  });

  it('gets a list of trials', async () => {
    const trials = [fakeTrial, fakeTrial, fakeTrial];
    mockSubmit.mockReturnValue(asApiResponse({ trials }));
    const studyName =
      'projects/222309772370/locations/${TEST_REGION}/studies/study-default';
    const response = await vizierService.listTrials(studyName);
    expect(response).toBe(trials);
    expect(mockSubmit).toHaveBeenCalledWith({
      path: `https://${TEST_REGION}-ml.googleapis.com/v1/projects/${TEST_PROJECT}/locations/${TEST_REGION}/studies/study-default/trials`,
      method: 'GET',
    });
  });

  it('completes a trial', async () => {
    mockSubmit.mockReturnValue(asApiResponse(fakeTrial));
    const trialName = fakeTrial.name;
    const studyName =
      'projects/222309772370/locations/${TEST_REGION}/studies/study-default';
    const response = await vizierService.completeTrial(trialName, studyName, {
      finalMeasurement: fakeMeasurement,
    });
    expect(response).toBe(fakeTrial);
    expect(mockSubmit).toHaveBeenCalledWith({
      path: `https://${TEST_REGION}-ml.googleapis.com/v1/projects/${TEST_PROJECT}/locations/${TEST_REGION}/studies/study-default/trials/${cleanFakeTrialName}:complete`,
      method: 'POST',
      body: {
        finalMeasurement: fakeMeasurement,
      },
    });
  });

  it('deletes a trial', async () => {
    mockSubmit.mockReturnValue(asApiResponse({}));
    const trialName = fakeTrial.name;
    const studyName =
      'projects/222309772370/locations/${TEST_REGION}/studies/study-default';
    await vizierService.deleteTrial(trialName, studyName);
    expect(mockSubmit).toHaveBeenCalledWith({
      path: `https://${TEST_REGION}-ml.googleapis.com/v1/projects/${TEST_PROJECT}/locations/${TEST_REGION}/studies/study-default/trials/${cleanFakeTrialName}`,
      method: 'DELETE',
    });
  });

  it('gets an operation', async () => {
    mockSubmit.mockReturnValue(asApiResponse(fakeStudy));
    const operationName =
      'projects/222309772370/locations/${TEST_REGION}/operations/operation-name';
    await vizierService.getOperation(operationName);
    expect(mockSubmit).toHaveBeenCalledWith({
      path: `https://${TEST_REGION}-ml.googleapis.com/v1/projects/${TEST_PROJECT}/locations/${TEST_REGION}/operations/operation-name`,
      method: 'GET',
    });
  });
});

describe('prettifyOperationId', () => {
  it('makes a study name readable', () => {
    expect(
      prettifyOperationId(
        'projects/project-name/locations/${TEST_REGION}/operations/operation / id'
      )
    ).toEqual('operation / id');
  });
});

describe('prettifyStudyName', () => {
  it('makes an operation id readable', () => {
    expect(
      prettifyStudyName(
        'projects/project-name/locations/${TEST_REGION}/studies/study / name'
      )
    ).toEqual('study / name');
  });
});

describe('prettifyTrial', () => {
  it('makes a trial name readable', () => {
    expect(
      prettifyTrial(
        'projects/project-name/locations/${TEST_REGION}/studies/study / name/trials/trial / name'
      )
    ).toEqual('trial / name');
  });
});
