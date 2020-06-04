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

import * as React from 'react';

import { BUCKET_NAME_SUFFIX } from '../../data';
import { ProjectState } from '../../service/project_state';
import { css } from 'jupyter-extensions-shared';
import { LearnMoreLink } from '../shared/learn_more_link';
import { Message } from '../shared/message';
import { getIconForState } from './initializer';

interface Props {
  projectState: ProjectState;
  isCreatingBucket: boolean;
  bucketCreationError?: string;
  showCloudFunction: boolean;
  isDeployingFunction: boolean;
  functionDeploymentError?: string;
}

const CLOUD_FUNCTION_LINK =
  'https://cloud.google.com/functions/docs/calling/http';
const CLOUD_STORAGE_LINK = 'https://cloud.google.com/storage/';

/** Prepares project by creating necessary GCS Bucket and Cloud Function. */
export function ResourceStatuses(props: Props) {
  const {
    projectState,
    isCreatingBucket,
    bucketCreationError,
    showCloudFunction,
    isDeployingFunction,
    functionDeploymentError,
  } = props;
  const bucketName = `${projectState.projectId}${BUCKET_NAME_SUFFIX}`;
  let bucketMessage = '';
  let functionMessage = '';
  if (isCreatingBucket) {
    bucketMessage = `Creating Cloud Storage bucket gs://${bucketName}...`;
  } else if (bucketCreationError) {
    bucketMessage = bucketCreationError;
  }

  if (isDeployingFunction) {
    functionMessage =
      'Deploying Cloud Function. This may take a few minutes...';
  } else if (functionDeploymentError) {
    functionMessage = functionDeploymentError;
  }

  return (
    <div className={css.column}>
      <p className={css.paragraph}>The following resources must exist:</p>
      <div className={css.serviceStatuses}>
        <div className={css.serviceStatusItem}>
          {getIconForState(projectState.hasGcsBucket)}
          A
          <LearnMoreLink
            href={CLOUD_STORAGE_LINK}
            text="Cloud Storage Bucket"
          />
        </div>
        {bucketMessage && (
          <Message
            asActivity={isCreatingBucket}
            asError={!!bucketCreationError}
            text={bucketMessage}
          />
        )}
        {showCloudFunction && (
          <div className={css.serviceStatusItem}>
            {getIconForState(projectState.hasCloudFunction)}
            An&nbsp;
            <LearnMoreLink
              href={CLOUD_FUNCTION_LINK}
              text="HTTP-triggered Cloud Function"
            />
          </div>
        )}
        {showCloudFunction && functionMessage && (
          <Message
            asActivity={isDeployingFunction}
            asError={!!functionDeploymentError}
            text={functionMessage}
          />
        )}
      </div>
    </div>
  );
}
