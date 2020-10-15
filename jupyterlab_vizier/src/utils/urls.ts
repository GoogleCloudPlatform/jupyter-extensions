import {
  fakeProjectId,
  cleanFakeStudyName,
  cleanFakeTrialName,
  fakeCleanOperationName,
} from '../service/test_constants';

const REGION = 'us-central1';

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
  return `https://${REGION}-ml.googleapis.com/v1/projects/${projectId}/locations/${REGION}/studies?study_id=${cleanStudyName}`;
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
  return `https://${REGION}-ml.googleapis.com/v1/projects/${projectId}/locations/${REGION}/studies/${cleanStudyName}/trials`;
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
  return `https://${REGION}-ml.googleapis.com/v1/projects/${projectId}/locations/${REGION}/studies/${cleanStudyName}/trials/${cleanTrialName}:addMeasurement`;
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
  return `https://${REGION}-ml.googleapis.com/v1/projects/${projectId}/locations/${REGION}/studies/${cleanStudyName}/trials/${cleanTrialName}:complete`;
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
  return `https://${REGION}-ml.googleapis.com/v1/projects/${projectId}/locations/${REGION}/studies/${cleanStudyName}/trials:suggest`;
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
  return `https://${REGION}-ml.googleapis.com/v1/projects/${projectId}/locations/${REGION}/operations/${cleanOperationName}`;
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
  return `https://${REGION}-ml.googleapis.com/v1/projects/${projectId}/locations/${REGION}/studies/${cleanStudyName}/trials/${cleanTrialName}`;
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
  return `https://${REGION}-ml.googleapis.com/v1/projects/${projectId}/locations/${REGION}/studies/${encodeURI(
    cleanStudyName
  )}/trials`;
}

export function proxyUrl(googleApiUrl: string): string {
  return `/gcp/v1/proxy/${btoa(googleApiUrl)}`;
}
