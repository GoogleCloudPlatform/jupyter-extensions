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

import { Message, LearnMoreLink } from 'gcp_jupyterlab_shared';
import { ConfigurationError, ErrorType } from './hardware_scaling_status';
import { Instance } from '../service/notebooks_service';
import { ActionBar } from './action_bar';
import { STYLES } from '../data/styles';
import { MachineTypeConfiguration } from '../data/machine_types';
import { displayInstance } from './instance_details_message';

interface Props {
  instanceDetails?: Instance;
  machineTypes?: MachineTypeConfiguration[];
  error: ConfigurationError;
  onDialogClose: () => void;
}

const ERROR_MESSAGE = `You must manually start your instance from the Google 
Cloud Console to continue using this Notebook. `;
const LINK = `https://console.cloud.google.com/ai-platform/notebooks/`;
const LINK_TEXT = `View Cloud Console`;

export function ErrorPage(props: Props) {
  const { onDialogClose, error, instanceDetails, machineTypes } = props;
  const { errorType, errorValue } = error;

  return (
    <div className={STYLES.containerPadding}>
      <div className={STYLES.containerSize}>
        <span
          className={STYLES.heading}
        >{`Failed to ${errorType} Your Machine`}</span>
        <div className={STYLES.paragraph}>{errorValue}</div>
        {instanceDetails &&
          displayInstance(
            instanceDetails,
            machineTypes,
            'Your current configuration:'
          )}
        {errorType === ErrorType.START && (
          <div className={STYLES.infoMessage}>
            <Message asError={true} asActivity={false} text={ERROR_MESSAGE}>
              {ERROR_MESSAGE}
              <LearnMoreLink href={LINK} text={LINK_TEXT} />
            </Message>
          </div>
        )}
      </div>
      {errorType !== ErrorType.START && (
        <ActionBar primaryLabel="Close" onPrimaryClick={onDialogClose} />
      )}
    </div>
  );
}
