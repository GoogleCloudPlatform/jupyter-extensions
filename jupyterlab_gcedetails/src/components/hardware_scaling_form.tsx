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
  css,
  SelectInput,
  CheckboxInput,
  LearnMoreLink,
  BASE_FONT,
  ActionBar,
  SubmitButton,
} from 'gcp_jupyterlab_shared';
import { stylesheet, classes } from 'typestyle';
import { SynchronizedSliders } from './synchronized_sliders';
import {
  ACCELERATOR_COUNTS_1_2_4_8,
  machineTypes,
  ACCELERATOR_TYPES,
} from '../data';

interface Props {
  // Assumes sorted list with memory and cpu set to 0 for first value
  onDialogClose?: () => void;
}

interface State {
  cpuValue: number;
  memoryValue: number;
  attachGpu: boolean;
  gpuType?: string;
  gpuCount?: string;
}

export const STYLES = stylesheet({
  checkbox: {
    marginRight: '10px',
  },
  checkboxContainer: {
    paddingTop: '8px',
    paddingBottom: '10px',
  },
  title: {
    ...BASE_FONT,
    fontWeight: 500,
    fontSize: '15px',
    marginBottom: '5px',
    ...csstips.horizontal,
    ...csstips.flex,
  },
  formContainer: {
    padding: '26px 16px 0px 16px',
  },
  container: {
    width: '550px',
  },
  description: {
    paddingBottom: '20px',
  },
  topPadding: {
    paddingTop: '10px',
  },
});

export class HardwareScalingForm extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);

    this.state = {
      cpuValue: null,
      memoryValue: null,
      attachGpu: null,
      gpuType: null,
      gpuCount: null,
    };
  }

  render() {
    const { onDialogClose } = this.props;
    const { gpuType, gpuCount, attachGpu } = this.state;

    const onCpuChange = (newValue: number) => {
      this.setState({
        cpuValue: newValue,
      });
    };

    const onMemoryChange = (newValue: number) => {
      this.setState({
        memoryValue: newValue,
      });
    };

    const onGpuTypeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
      this.setState({
        gpuType: event.target.value,
        gpuCount: event.target.value
          ? String(ACCELERATOR_COUNTS_1_2_4_8[0].value)
          : '',
      });
    };

    const onGpuCountChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
      this.setState({
        gpuCount: event.target.value,
      });
    };

    const onAttachGpuChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      this.setState({
        attachGpu: event.target.checked,
      });
    };

    // TODO: Implement submit functionality
    //eslint-disable-next-line @typescript-eslint/no-empty-function
    const submitForm = () => {};

    return (
      <div className={STYLES.container}>
        <div className={STYLES.formContainer}>
          <span className={STYLES.title}>Hardware Scaling Limits</span>
          <form>
            <HardwareConfigurationDescription />
            <SynchronizedSliders
              values={machineTypes}
              onMemoryChange={onMemoryChange}
              onCpuChange={onCpuChange}
            />
            <div className={STYLES.checkboxContainer}>
              <CheckboxInput
                label="Attach GPUs"
                className={STYLES.checkbox}
                name="attachGpu"
                checked={attachGpu}
                onChange={onAttachGpuChange}
              />
            </div>
            {attachGpu && (
              <div
                className={classes(css.scheduleBuilderRow, STYLES.topPadding)}
              >
                <div className={css.flex1}>
                  <SelectInput
                    label="GPU type"
                    name="gpuType"
                    value={gpuType}
                    options={ACCELERATOR_TYPES}
                    onChange={onGpuTypeChange}
                  />
                </div>
                <div className={css.flex1}>
                  <SelectInput
                    label="Number of GPUs"
                    name="gpuCount"
                    value={gpuCount}
                    options={ACCELERATOR_COUNTS_1_2_4_8}
                    onChange={onGpuCountChange}
                  />
                </div>
              </div>
            )}
          </form>
        </div>
        <ActionBar closeLabel="Cancel" onClick={onDialogClose}>
          <SubmitButton
            actionPending={false}
            onClick={submitForm}
            text="Save"
          />
        </ActionBar>
      </div>
    );
  }
}

const DESCRIPTION = `The hardware scaling limits you configured will be the
max capacity allowed for this notebook. You'll only pay for the hardware 
resources you use. `;
const LINK = 'https://cloud.google.com/ai-platform/training/pricing';

// tslint:disable-next-line:enforce-name-casing
export function HardwareConfigurationDescription() {
  return (
    <p className={classes(css.noTopMargin, STYLES.description)}>
      {DESCRIPTION}
      <LearnMoreLink href={LINK} />
    </p>
  );
}
