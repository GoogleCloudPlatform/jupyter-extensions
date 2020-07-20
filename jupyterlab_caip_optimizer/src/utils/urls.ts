import {
  fakeProjectId,
  fakeRegion,
  cleanFakeStudyName,
  cleanFakeTrialName,
  fakeCleanOperationName,
} from '../service/test-constants';

// TODO: refactor optimizer to use common set of url functions
export function getTrialsUrl(
  {
    projectId,
    region,
    cleanStudyName,
  }: {
    projectId: string;
    region: string;
    cleanStudyName: string;
  } = {
    projectId: fakeProjectId,
    region: fakeRegion,
    cleanStudyName: cleanFakeStudyName,
  }
): string {
  return `https://${region}-ml.googleapis.com/v1/projects/${projectId}/locations/${region}/studies/${cleanStudyName}/trials`;
}

export function completeTrialUrl(
  {
    projectId,
    region,
    cleanStudyName,
    cleanTrialName,
  }: {
    projectId: string;
    region: string;
    cleanStudyName: string;
    cleanTrialName: string;
  } = {
    projectId: fakeProjectId,
    region: fakeRegion,
    cleanStudyName: cleanFakeStudyName,
    cleanTrialName: cleanFakeTrialName,
  }
): string {
  return `https://${region}-ml.googleapis.com/v1/projects/${projectId}/locations/${region}/studies/${cleanStudyName}/trials/${cleanTrialName}:complete`;
}

export function suggestTrialUrl(
  {
    projectId,
    region,
    cleanStudyName,
  }: {
    projectId: string;
    region: string;
    cleanStudyName: string;
  } = {
    projectId: fakeProjectId,
    region: fakeRegion,
    cleanStudyName: cleanFakeStudyName,
  }
): string {
  return `https://${region}-ml.googleapis.com/v1/projects/${projectId}/locations/${region}/studies/${cleanStudyName}/trials:suggest`;
}

export function operationGetUrl(
  {
    projectId,
    region,
    cleanOperationName,
  }: {
    projectId: string;
    region: string;
    cleanOperationName: string;
  } = {
    projectId: fakeProjectId,
    region: fakeRegion,
    cleanOperationName: fakeCleanOperationName,
  }
): string {
  return `https://${region}-ml.googleapis.com/v1/projects/${projectId}/locations/${region}/operations/${cleanOperationName}`;
}

export function deleteTrialUrl(
  {
    projectId,
    region,
    cleanStudyName,
    cleanTrialName,
  }: {
    projectId: string;
    region: string;
    cleanStudyName: string;
    cleanTrialName: string;
  } = {
    projectId: fakeProjectId,
    region: fakeRegion,
    cleanStudyName: cleanFakeStudyName,
    cleanTrialName: cleanFakeTrialName,
  }
): string {
  return `https://${region}-ml.googleapis.com/v1/projects/${projectId}/locations/${region}/studies/${cleanStudyName}/trials/${cleanTrialName}`;
}

export function proxyUrl(googleApiUrl: string): string {
  return `/gcp/v1/proxy/${btoa(googleApiUrl)}`;
}
