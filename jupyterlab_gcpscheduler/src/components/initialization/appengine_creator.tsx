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
import { css, LearnMoreLink } from 'gcp-jupyterlab-shared';
import { stylesheet } from 'typestyle';

interface Props {
  projectId: string;
}

const SUPPORTED_REGIONS_LINK =
  'https://cloud.google.com/scheduler/docs/#supported_regions';
const APPENGINE_CREATE_LINK =
  'https://console.cloud.google.com/appengine/start';
const CLOUD_SHELL_LINK = 'https://ssh.cloud.google.com/cloudshell/editor';

const localStyles = stylesheet({
  code: {
    backgroundColor: '#f7f7f7',
    display: 'block',
    fontFamily: '"Roboto Mono", monospace',
    margin: '16px 0',
    padding: '8px',
  },
  li: {
    margin: '8px',
  },
});

/** Responsible for creating an AppEngine Project. */
export function AppEngineCreator(props: Props) {
  return (
    <div className={css.column}>
      <p className={css.paragraph}>
        In order to use Cloud Scheduler, your project must contain an App Engine
        app that is located in one of the supported regions
        <LearnMoreLink href={SUPPORTED_REGIONS_LINK} />. This is a one-time
        setup that must be completed by a Project Owner. There are two ways to
        create the App Engine app:
      </p>
      <ol>
        <li className={localStyles.li}>
          Use the
          <LearnMoreLink
            href={`${APPENGINE_CREATE_LINK}?project=${props.projectId}`}
            text="Google Cloud Platform Console UI"
          />
        </li>
        <li className={localStyles.li}>
          Run the following command in a terminal or in
          <LearnMoreLink href={CLOUD_SHELL_LINK} text="Google Cloud Shell" />:
          <code className={localStyles.code}>
            gcloud --project {props.projectId} app create
          </code>
        </li>
      </ol>
    </div>
  );
}
