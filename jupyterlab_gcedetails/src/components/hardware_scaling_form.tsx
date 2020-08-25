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
  Option,
  Message,
} from 'gcp_jupyterlab_shared';
import { stylesheet, classes } from 'typestyle';
import { NestedSelect } from './machine_type_select';
import { SelectInput } from './select_input';
import { STYLES } from '../data/styles';
import {
  HardwareConfiguration,
  Details,
  detailsToHardwareConfiguration,
  isEqualHardwareConfiguration,
} from '../data/data';
import {
  ACCELERATOR_COUNTS_1_2_4_8,
  ACCELERATOR_TYPES,
  getGpuTypeOptionsList,
  getGpuCountOptionsList,
  NO_ACCELERATOR_TYPE,
  NO_ACCELERATOR_COUNT,
} from '../data/accelerator_types';
import {
  MACHINE_TYPES,
  optionToMachineType,
  machineTypeToOption,
  MachineTypeConfiguration,
} from '../data/machine_types';
import { ActionBar } from './action_bar';

interface Props {
  onSubmit: (configuration: HardwareConfiguration) => void;
  onDialogClose: () => void;
  details?: Details;
}

interface State {
  configuration: HardwareConfiguration;
  gpuCountOptions: Option[];
}

export const FORM_STYLES = stylesheet({
  checkbox: {
    marginRight: '10px',
  },
  checkboxContainer: {
    padding: '18px 0px 8px 0px',
  },
  title: {
    ...BASE_FONT,
    fontWeight: 500,
    fontSize: '15px',
    marginBottom: '5px',
    ...csstips.horizontal,
    ...csstips.flex,
  },
  subtitle: {
    ...BASE_FONT,
    fontWeight: 500,
    fontSize: '15px',
    marginTop: '10px',
    marginBottom: '5px',
    ...csstips.horizontal,
    ...csstips.flex,
  },
  formContainer: {
    width: '468px',
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

const N1_MACHINE_PREFIX = 'n1-';
const DEFAULT_MACHINE_TYPE = optionToMachineType(
  MACHINE_TYPES[0].configurations[0]
);
const GPU_RESTRICTION_MESSAGE = `Based on the zone, framework, and machine type of the instance, 
the available GPU types and the minimum number of GPUs that can be selected may vary. `;
const GPU_RESTRICTION_LINK = 'https://cloud.google.com/compute/docs/gpus';
const INFO_MESSAGE = `If you have chosen to attach GPUs to your instance, 
the NVIDIA GPU driver will be installed automatically on the next startup.`;

export class HardwareScalingForm extends React.Component<Props, State> {
  private gpuTypeOptions: Option[];
  private oldConfiguration: HardwareConfiguration;
  private machineTypesOptions: MachineTypeConfiguration[];

  constructor(props: Props) {
    super(props);

    this.oldConfiguration = props.details
      ? detailsToHardwareConfiguration(props.details)
      : null;

    this.state = {
      configuration: this.oldConfiguration
        ? this.oldConfiguration
        : {
            machineType: DEFAULT_MACHINE_TYPE,
            attachGpu: false,
            gpuType: NO_ACCELERATOR_TYPE,
            gpuCount: NO_ACCELERATOR_COUNT,
          },
      // update the gpu count options based on the selected gpu type
      gpuCountOptions: props.details
        ? getGpuCountOptionsList(
            props.details.acceleratorTypes,
            props.details.gpu.name
          )
        : ACCELERATOR_COUNTS_1_2_4_8,
    };

    this.gpuTypeOptions = props.details
      ? getGpuTypeOptionsList(
          props.details.acceleratorTypes,
          props.details.instance.cpuPlatform
        )
      : ACCELERATOR_TYPES;

    this.machineTypesOptions = props.details
      ? props.details.machineTypes
      : MACHINE_TYPES;
  }

  /*
   * If this returns false, the GPU fields in the form will be disabled and
   * the user will not be able to attach a GPU to their configuration.
   * Currently only N1 general-purpose machines support GPUs: https://cloud.google.com/compute/docs/gpus#restrictions
   */
  private canAttachGpu(machineTypeName: string): boolean {
    return machineTypeName.startsWith(N1_MACHINE_PREFIX);
  }

  private gpuRestrictionMessage() {
    return (
      <p className={STYLES.paragraph}>
        {GPU_RESTRICTION_MESSAGE}
        <LearnMoreLink href={GPU_RESTRICTION_LINK} />
      </p>
    );
  }

  private onAttachGpuChange(event: React.ChangeEvent<HTMLInputElement>) {
    this.setState({
      configuration: {
        ...this.state.configuration,
        attachGpu: event.target.checked,
        gpuType: event.target.checked
          ? (this.gpuTypeOptions[0].value as string)
          : NO_ACCELERATOR_TYPE,
        gpuCount: event.target.checked
          ? (this.state.gpuCountOptions[0].value as string)
          : NO_ACCELERATOR_COUNT,
      },
    });
  }

  private onGpuTypeChange(event: React.ChangeEvent<HTMLInputElement>) {
    const newGpuCountOptions = getGpuCountOptionsList(
      this.props.details.acceleratorTypes,
      event.target.value
    );
    this.setState({
      configuration: {
        ...this.state.configuration,
        gpuType: event.target.value,
        gpuCount: newGpuCountOptions[0].value as string,
      },
      gpuCountOptions: newGpuCountOptions,
    });
  }

  private onMachineTypeChange(newMachineType: Option) {
    const canAttachGpu = this.canAttachGpu(newMachineType.value as string);
    this.setState({
      configuration: {
        ...this.state.configuration,
        machineType: optionToMachineType(newMachineType),
        attachGpu: this.state.configuration.attachGpu && canAttachGpu,
      },
    });
  }

  private submitForm() {
    const configuration = { ...this.state.configuration };
    if (!configuration.attachGpu) {
      /*
       * If machine originally had a GPU we want to explicilty attach an
       * accelerator of type NO_ACCELERATOR_TYPE through the Notebooks API to remove it
       */
      configuration.attachGpu = this.oldConfiguration
        ? this.oldConfiguration.attachGpu
        : configuration.attachGpu;
    }
    this.props.onSubmit(configuration);
  }

  render() {
    const { onDialogClose } = this.props;
    const { configuration, gpuCountOptions } = this.state;
    const { gpuType, gpuCount, attachGpu, machineType } = configuration;

    return (
      <div className={STYLES.containerPadding}>
        <div className={FORM_STYLES.formContainer}>
          <span className={STYLES.heading}>Hardware Scaling Limits</span>
          <HardwareConfigurationDescription />
          <span className={STYLES.subheading}>Machine Configuration</span>
          <NestedSelect
            label="Machine type"
            nestedOptionsList={this.machineTypesOptions.map(machineType => ({
              header: machineType.base,
              options: machineType.configurations,
            }))}
            onChange={machineType => this.onMachineTypeChange(machineType)}
            value={machineTypeToOption(machineType)}
          />
          <span className={STYLES.subheading}>GPU Configuration</span>
          {this.gpuRestrictionMessage()}
          <div className={FORM_STYLES.checkboxContainer}>
            <CheckboxInput
              label="Attach GPUs"
              className={FORM_STYLES.checkbox}
              name="attachGpu"
              checked={attachGpu && this.canAttachGpu(machineType.name)}
              onChange={e => this.onAttachGpuChange(e)}
              disabled={!this.canAttachGpu(machineType.name)}
            />
          </div>
          {attachGpu && this.canAttachGpu(machineType.name) && (
            <div
              className={classes(
                css.scheduleBuilderRow,
                FORM_STYLES.topPadding
              )}
            >
              <div className={css.flex1}>
                <SelectInput
                  label="GPU type"
                  name="gpuType"
                  value={gpuType}
                  options={this.gpuTypeOptions}
                  onChange={e => this.onGpuTypeChange(e)}
                />
              </div>
              <div className={css.flex1}>
                <SelectInput
                  label="Number of GPUs"
                  name="gpuCount"
                  value={gpuCount}
                  options={gpuCountOptions}
                  onChange={e =>
                    this.setState({
                      configuration: {
                        ...this.state.configuration,
                        gpuCount: e.target.value,
                      },
                    })
                  }
                />
              </div>
            </div>
          )}
          {attachGpu && (
            <div className={STYLES.infoMessage}>
              <Message asError={false} asActivity={false} text={INFO_MESSAGE} />
            </div>
          )}
        </div>
        <ActionBar
          primaryLabel="Next"
          onPrimaryClick={() => this.submitForm()}
          primaryDisabled={isEqualHardwareConfiguration(
            this.oldConfiguration,
            configuration
          )}
          secondaryLabel="Cancel"
          onSecondaryClick={onDialogClose}
        />
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
    <p className={STYLES.paragraph}>
      {DESCRIPTION}
      <LearnMoreLink href={LINK} />
    </p>
  );
}
