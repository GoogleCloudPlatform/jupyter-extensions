import {
  fakeProjectId,
  cleanFakeStudyName,
  cleanFakeTrialName,
  fakeCleanOperationName,
} from '../service/test_constants';

// TODO: refactor vizier to use common set of url functions
export function createStudyUrl(
  {
    projectId,
    cleanStudyName,
  }: {
    projectId: string;
    cleanStudyName: string;
  } = {
    projectId: fakeProjectId,
    cleanStudyName: cleanFakeStudyName,
  }
) {
  return `https://us-central1-ml.googleapis.com/v1/projects/${projectId}/locations/us-central1/studies?study_id=${cleanStudyName}`;
}

export function getTrialsUrl(
  {
    projectId,
    cleanStudyName,
  }: {
    projectId: string;
    cleanStudyName: string;
  } = {
    projectId: fakeProjectId,
    cleanStudyName: cleanFakeStudyName,
  }
): string {
  return `https://us-central1-ml.googleapis.com/v1/projects/${projectId}/locations/us-central1/studies/${cleanStudyName}/trials`;
}

export function addMeasurementTrialUrl(
  {
    projectId,
    cleanStudyName,
    cleanTrialName,
  }: {
    projectId: string;
    cleanStudyName: string;
    cleanTrialName: string;
  } = {
    projectId: fakeProjectId,
    cleanStudyName: cleanFakeStudyName,
    cleanTrialName: cleanFakeTrialName,
  }
): string {
  return `https://us-central1-ml.googleapis.com/v1/projects/${projectId}/locations/us-central1/studies/${cleanStudyName}/trials/${cleanTrialName}:addMeasurement`;
}

export function completeTrialUrl(
  {
    projectId,
    cleanStudyName,
    cleanTrialName,
  }: {
    projectId: string;
    cleanStudyName: string;
    cleanTrialName: string;
  } = {
    projectId: fakeProjectId,
    cleanStudyName: cleanFakeStudyName,
    cleanTrialName: cleanFakeTrialName,
  }
): string {
  return `https://us-central1-ml.googleapis.com/v1/projects/${projectId}/locations/us-central1/studies/${cleanStudyName}/trials/${cleanTrialName}:complete`;
}

export function suggestTrialUrl(
  {
    projectId,
    cleanStudyName,
  }: {
    projectId: string;
    cleanStudyName: string;
  } = {
    projectId: fakeProjectId,
    cleanStudyName: cleanFakeStudyName,
  }
): string {
  return `https://us-central1-ml.googleapis.com/v1/projects/${projectId}/locations/us-central1/studies/${cleanStudyName}/trials:suggest`;
}

export function operationGetUrl(
  {
    projectId,
    cleanOperationName,
  }: {
    projectId: string;
    cleanOperationName: string;
  } = {
    projectId: fakeProjectId,
    cleanOperationName: fakeCleanOperationName,
  }
): string {
  return `https://us-central1-ml.googleapis.com/v1/projects/${projectId}/locations/us-central1/operations/${cleanOperationName}`;
}

export function deleteTrialUrl(
  {
    projectId,
    cleanStudyName,
    cleanTrialName,
  }: {
    projectId: string;
    cleanStudyName: string;
    cleanTrialName: string;
  } = {
    projectId: fakeProjectId,
    cleanStudyName: cleanFakeStudyName,
    cleanTrialName: cleanFakeTrialName,
  }
): string {
  return `https://us-central1-ml.googleapis.com/v1/projects/${projectId}/locations/us-central1/studies/${cleanStudyName}/trials/${cleanTrialName}`;
}

export function createTrialUrl(
  {
    projectId,
    cleanStudyName,
  }: {
    projectId: string;
    cleanStudyName: string;
  } = {
    projectId: fakeProjectId,
    cleanStudyName: cleanFakeStudyName,
  }
): string {
  return `https://us-central1-ml.googleapis.com/v1/projects/${projectId}/locations/us-central1/studies/${encodeURI(
    cleanStudyName
  )}/trials`;
}

export function proxyUrl(googleApiUrl: string): string {
  return `/gcp/v1/proxy/${btoa(googleApiUrl)}`;
}
