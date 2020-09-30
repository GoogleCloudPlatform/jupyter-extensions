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
import { Badge, Message } from 'gcp_jupyterlab_shared';
import * as React from 'react';
import { getGpuTypeText, NO_ACCELERATOR_TYPE } from '../data/accelerator_types';
import { HardwareConfiguration } from '../data/data';
import { STYLES } from '../data/styles';
import { ActionBar } from './action_bar';

import {
  HardwareConfigurationDescription,
  TITLE,
} from './hardware_configuration_description';

interface Props {
  formData: HardwareConfiguration;
  currentConfiguration: HardwareConfiguration;
  onDialogClose: () => void;
  onSubmit: () => void;
}

const INFO_MESSAGE = `Updating your configuration will take 5-10 minutes. During this
time you will not be able to access your notebook instance.`;

function displayConfiguration(
  configuration: HardwareConfiguration,
  title: string
) {
  const { machineType, attachGpu, gpuType, gpuCount } = configuration;

  return (
    <div>
      <span className={STYLES.subheading}>{title}</span>
      <div className={STYLES.paragraph}>
        Machine type: {machineType.description}
      </div>
      {attachGpu && gpuType !== NO_ACCELERATOR_TYPE && (
        <div className={STYLES.paragraph}>
          {`GPUs: ${gpuCount} ${getGpuTypeText(gpuType)}`}
        </div>
      )}
    </div>
  );
}

export function ConfirmationPage(props: Props) {
  const { formData, currentConfiguration, onDialogClose, onSubmit } = props;

  return (
    <div>
      <header className={STYLES.dialogHeader}>
        {TITLE} <Badge value="Alpha" />
      </header>
      <div className={STYLES.containerPadding}>
        <div className={STYLES.containerSize}>
          <HardwareConfigurationDescription />
          {displayConfiguration(currentConfiguration, 'Old Configuration')}
          {displayConfiguration(formData, 'New Configuration')}
          <div className={STYLES.infoMessage}>
            <Message asError={false} asActivity={false} text={INFO_MESSAGE} />
          </div>
        </div>
        <ActionBar
          primaryLabel="Submit"
          onPrimaryClick={() => onSubmit()}
          secondaryLabel="Cancel"
          onSecondaryClick={onDialogClose}
        />
      </div>
    </div>
  );
}
