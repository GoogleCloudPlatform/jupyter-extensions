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
  CheckboxInput,
  LearnMoreLink,
  BASE_FONT,
  ActionBar,
  SubmitButton,
} from 'gcp_jupyterlab_shared';
import { stylesheet, classes } from 'typestyle';
import { NestedSelect } from './machine_type_select';
import { SelectInput } from './select_input';
import {
  ACCELERATOR_COUNTS_1_2_4_8,
  ACCELERATOR_TYPES,
  Option,
  MACHINE_TYPES,
  HardwareConfiguration,
} from '../data';

interface Props {
  onDialogClose?: () => void;
  onSubmit: (config: HardwareConfiguration) => void;
}

interface State {
  machineType: Option;
  attachGpu: boolean;
  gpuType: string;
  gpuCount: string;
}

export const STYLES = stylesheet({
  checkbox: {
    marginRight: '10px',
  },
  checkboxContainer: {
    paddingTop: '10px',
    paddingBottom: '8px',
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
    width: '500px',
  },
  description: {
    paddingBottom: '10px',
  },
  topPadding: {
    paddingTop: '10px',
  },
  bottomPadding: {
    paddingBottom: '10px',
  },
});

const NO_ACCELERATOR = ACCELERATOR_TYPES[0].value as string;
const DEFAULT_MACHINE_TYPE = MACHINE_TYPES[0].configurations[0];

export class HardwareScalingForm extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);

    this.state = {
      machineType: DEFAULT_MACHINE_TYPE,
      attachGpu: false,
      gpuType: NO_ACCELERATOR,
      gpuCount: '',
    };
  }

  private onAttachGpuChange(event: React.ChangeEvent<HTMLInputElement>) {
    this.setState({
      attachGpu: event.target.checked,
      gpuType: event.target.checked
        ? (ACCELERATOR_TYPES[1].value as string)
        : NO_ACCELERATOR,
      gpuCount: event.target.checked
        ? (ACCELERATOR_COUNTS_1_2_4_8[0].value as string)
        : '',
    });
  }

  private onGpuTypeChange(event: React.ChangeEvent<HTMLInputElement>) {
    this.setState({
      gpuType: event.target.value,
      gpuCount: event.target.value
        ? (ACCELERATOR_COUNTS_1_2_4_8[0].value as string)
        : '',
    });
  }

  render() {
    const { onDialogClose, onSubmit } = this.props;
    const { gpuType, gpuCount, attachGpu } = this.state;
    const config = this.state as HardwareConfiguration;

    return (
      <div className={STYLES.container}>
        <div className={STYLES.formContainer}>
          <span className={STYLES.title}>Hardware Scaling Limits</span>
          <form>
            <HardwareConfigurationDescription />
            <NestedSelect
              label="Machine type"
              nestedOptionsList={MACHINE_TYPES.map(machineType => ({
                header: machineType.base,
                options: machineType.configurations,
              }))}
              onChange={machineType => this.setState({ machineType })}
            />
            <div className={STYLES.checkboxContainer}>
              <CheckboxInput
                label="Attach GPUs"
                className={STYLES.checkbox}
                name="attachGpu"
                checked={attachGpu}
                onChange={e => this.onAttachGpuChange(e)}
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
                    options={ACCELERATOR_TYPES.slice(1)}
                    onChange={e => this.onGpuTypeChange(e)}
                  />
                </div>
                <div className={css.flex1}>
                  <SelectInput
                    label="Number of GPUs"
                    name="gpuCount"
                    value={gpuCount}
                    options={ACCELERATOR_COUNTS_1_2_4_8}
                    onChange={e => this.setState({ gpuCount: e.target.value })}
                  />
                </div>
              </div>
            )}
          </form>
        </div>
        <ActionBar closeLabel="Cancel" onClick={onDialogClose}>
          <SubmitButton
            actionPending={false}
            onClick={() => {
              onSubmit(config);
            }}
            text="Submit"
          />
        </ActionBar>
      </div>
    );
  }
}

const DESCRIPTION = `The hardware scaling limits you configured will be the
max capacity allowed for this notebook. You'll only pay for the time the 
hardware resources are on. `;
const LINK = 'https://cloud.google.com/compute/all-pricing';

// tslint:disable-next-line:enforce-name-casing
export function HardwareConfigurationDescription() {
  return (
    <p className={classes(css.noTopMargin, STYLES.description)}>
      {DESCRIPTION}
      <LearnMoreLink href={LINK} />
    </p>
  );
}
