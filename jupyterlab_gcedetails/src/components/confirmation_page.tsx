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

import {
  BASE_FONT,
  ActionBar,
  SubmitButton,
  Message,
} from 'gcp_jupyterlab_shared';
import { stylesheet, classes } from 'typestyle';
import { HardwareConfiguration, ACCELERATOR_TYPES } from '../data';
import { HardwareConfigurationDescription } from './hardware_scaling_form';

interface Props {
  formData?: HardwareConfiguration;
  onDialogClose: () => void;
  currentConfiguration?: HardwareConfiguration;
  onSubmit: () => void;
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
    margin: '20px 16px 0px 16px',
  },
});

const INFO_MESSAGE = `Updating your configuration will take 5-10 minutes. During this time you will not be able to access your notebook instance.
  If you have chosen to attach GPUs to your instance, the NVIDIA GPU driver will be installed automatically on the next startup.`;

function getGpuTypeText(value: string) {
  return ACCELERATOR_TYPES.find(option => option.value === value).text;
}

function displayConfiguration(
  configuration: HardwareConfiguration,
  title: string
) {
  const { machineType, attachGpu, gpuType, gpuCount } = configuration;

  return (
    <div>
      <span className={classes(STYLES.title, STYLES.topPadding)}>{title}</span>
      <div className={STYLES.text}>Machine type: {machineType.description}</div>
      {attachGpu && (
        <div className={STYLES.text}>
          {`GPUs: ${gpuCount} ${getGpuTypeText(gpuType)}`}
        </div>
      )}
    </div>
  );
}

export function ConfirmationPage(props: Props) {
  const { onDialogClose, formData, currentConfiguration, onSubmit } = props;

  return (
    <div className={STYLES.container}>
      <div className={STYLES.textContainer}>
        <span className={STYLES.title}>Hardware Scaling Limits</span>
        <HardwareConfigurationDescription />
        {currentConfiguration &&
          displayConfiguration(currentConfiguration, 'Old Configuration')}
        {displayConfiguration(formData, 'New Configuration')}
      </div>
      <div className={STYLES.infoMessage}>
        <Message asError={false} asActivity={false} text={INFO_MESSAGE} />
      </div>
      <ActionBar closeLabel="Cancel" onClick={onDialogClose}>
        <SubmitButton
          actionPending={false}
          onClick={() => onSubmit()}
          text="Submit"
        />
      </ActionBar>
    </div>
  );
}
