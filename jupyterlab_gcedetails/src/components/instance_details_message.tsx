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
import { Instance } from '../service/notebooks_service';
import {
  MachineTypeConfiguration,
  getMachineTypeText,
} from '../data/machine_types';
import { STYLES } from '../data/styles';
import { getGpuTypeText } from '../data/accelerator_types';
import { extractLast } from '../data/data';

export function displayInstance(
  instance: Instance,
  machineTypes: MachineTypeConfiguration[],
  title: string
) {
  const { machineType, acceleratorConfig } = instance;
  const machineTypeText = getMachineTypeText(
    extractLast(machineType),
    machineTypes
  );

  return (
    <div>
      <span className={STYLES.subheading}>{title}</span>
      {machineTypeText && (
        <div className={STYLES.paragraph}>Machine type: {machineTypeText}</div>
      )}
      {acceleratorConfig && (
        <div className={STYLES.paragraph}>
          {`GPUs: ${acceleratorConfig.coreCount} ${getGpuTypeText(
            acceleratorConfig.type
          )}`}
        </div>
      )}
    </div>
  );
}
