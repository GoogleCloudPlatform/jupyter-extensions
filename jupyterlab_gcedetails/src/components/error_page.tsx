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

import * as csstips from 'csstips';
import * as React from 'react';

import { BASE_FONT, Message } from 'gcp_jupyterlab_shared';
import { stylesheet, classes } from 'typestyle';
import { ConfigurationError, ErrorType } from './hardware_configuration_dialog';
import { Instance } from '../service/notebooks_service';
import { ActionBar } from './action_bar';
import { getGpuTypeText, getMachineTypeText } from '../data';

interface Props {
  error: ConfigurationError;
  onDialogClose: () => void;
}

export const STYLES = stylesheet({
  title: {
    ...BASE_FONT,
    fontWeight: 500,
    fontSize: '15px',
    marginBottom: '5px',
    ...csstips.horizontal,
    ...csstips.flex,
  },
  text: {
    display: 'block',
  },
  textContainer: {
    padding: '26px 16px 0px 16px',
  },
  container: {
    width: '500px',
  },
  topPadding: {
    paddingTop: '15px',
  },
  infoMessage: {
    margin: '20px 16px 16px 16px',
  },
});

const ERROR_MESSAGE = `You must manually start your instance from the Google Cloud Console to continue using this Notebook. `;
const LINK = `https://console.cloud.google.com/ai-platform/notebooks/`;
const LINK_TEXT = `View Cloud Console`;

function displayInstance(instance: Instance) {
  const { machineType, acceleratorConfig } = instance;
  const machineTypeText = getMachineTypeText(machineType.split('/').pop());

  return (
    <div>
      <span className={classes(STYLES.title, STYLES.topPadding)}>
        Your current configuration:
      </span>
      {machineTypeText && (
        <div className={STYLES.text}>Machine type: {machineTypeText}</div>
      )}
      {acceleratorConfig && (
        <div className={STYLES.text}>
          {`GPUs: ${acceleratorConfig.coreCount} ${getGpuTypeText(
            acceleratorConfig.type
          )}`}
        </div>
      )}
    </div>
  );
}

export function ErrorPage(props: Props) {
  const { onDialogClose, error } = props;
  const { errorType, errorValue, instanceDetails } = error;

  return (
    <div className={STYLES.container}>
      <div className={STYLES.textContainer}>
        <span
          className={STYLES.title}
        >{`Failed to ${errorType} Your Machine`}</span>
        {errorValue}
        {instanceDetails && displayInstance(instanceDetails)}
      </div>
      {errorType === ErrorType.START && (
        <div className={STYLES.infoMessage}>
          <Message
            asError={true}
            asActivity={false}
            text={ERROR_MESSAGE}
            link={LINK}
            linkText={LINK_TEXT}
          />
        </div>
      )}
      {errorType !== ErrorType.START && (
        <ActionBar primaryLabel="Close" onPrimaryClick={onDialogClose} />
      )}
    </div>
  );
}
