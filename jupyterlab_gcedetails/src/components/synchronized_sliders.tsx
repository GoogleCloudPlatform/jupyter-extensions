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
import { stylesheet } from 'typestyle';
import { HardwareConfiguration } from '../data';
import { InputSlider } from './input_slider';

interface Props {
  /* Assumes sorted list with memory and cpu set to 0 for first value */
  values: HardwareConfiguration[];
  onCpuChange: (value: number) => void;
  onMemoryChange: (value: number) => void;
}

interface State {
  memoryValue: number;
  cpuValue: number;
  memoryInputDisplayValue: string;
  cpuInputDisplayValue: string;
}

export const STYLES = stylesheet({
  container: {
    minWidth: '450px',

    /**
     * Using overflow to deal with quirks of material-ui grid.
     * See: https://material-ui.com/components/grid/#negative-margin
     */
    overflowX: 'hidden',
    overflowY: 'hidden',
  },
  slider: {
    marginLeft: '10px',
  },
  label: {
    display: 'block',
    minWidth: '100px',
  },
});

export class SynchronizedSliders extends React.Component<Props, State> {
  private memoryValues: number[];
  private cpuValues: number[];
  private typingTimeout: any;

  constructor(props: Props) {
    super(props);

    this.memoryValues = this.props.values.map(elem => elem.memory);
    this.cpuValues = this.props.values.map(elem => elem.cpu);
    this.typingTimeout = null;

    this.state = {
      memoryValue: this.memoryValues[0],
      memoryInputDisplayValue: String(this.memoryValues[0]),
      cpuValue: this.cpuValues[0],
      cpuInputDisplayValue: String(this.cpuValues[0]),
    };
  }

  private memoryFromCpu(cpu: number) {
    const obj = this.props.values.find(elem => elem.cpu === cpu);
    return obj.memory;
  }

  private cpuFromMemory(memory: number) {
    const obj = this.props.values.find(elem => elem.memory === memory);
    return obj.cpu;
  }

  /* Returns closest value to targetValue in possibleValues, using the higher value for ties */
  private closest(targetValue: number, possibleValues: number[]) {
    return possibleValues.reduce((a, b) => {
      return Math.abs(a - targetValue) < Math.abs(b - targetValue) ? a : b;
    });
  }

  private onCpuChange(newCpu: number) {
    this.setState({
      cpuValue: newCpu,
      cpuInputDisplayValue: String(newCpu),
      memoryValue: this.memoryFromCpu(newCpu),
      memoryInputDisplayValue: String(this.memoryFromCpu(newCpu)),
    });

    this.props.onCpuChange(newCpu);
  }

  private onMemoryChange(newMemory: number) {
    this.setState({
      cpuValue: this.cpuFromMemory(newMemory),
      cpuInputDisplayValue: String(this.cpuFromMemory(newMemory)),
      memoryValue: newMemory,
      memoryInputDisplayValue: String(newMemory),
    });

    this.props.onMemoryChange(newMemory);
  }

  private onCpuInputBlur(cpuInputDisplayValue: string) {
    const newValue = this.closest(Number(cpuInputDisplayValue), this.cpuValues);

    this.onCpuChange(newValue);
  }

  private onMemoryInputBlur(memoryInputDisplayValue: string) {
    const newValue = this.closest(
      Number(memoryInputDisplayValue),
      this.memoryValues
    );

    this.onMemoryChange(newValue);
  }

  private onCpuInputChange(cpuInputDisplayValue: string) {
    this.setState({ cpuInputDisplayValue });
    clearTimeout(this.typingTimeout);

    this.typingTimeout = setTimeout(
      () => this.onCpuInputBlur(cpuInputDisplayValue),
      3000
    );
  }

  private onMemoryInputChange(memoryInputDisplayValue: string) {
    this.setState({ memoryInputDisplayValue });
    clearTimeout(this.typingTimeout);

    this.typingTimeout = setTimeout(
      () => this.onMemoryInputBlur(memoryInputDisplayValue),
      3000
    );
  }

  render() {
    const {
      cpuInputDisplayValue,
      memoryInputDisplayValue,
      cpuValue,
      memoryValue,
    } = this.state;

    return (
      <div>
        <InputSlider
          possibleValues={this.cpuValues}
          label="Cores"
          value={cpuValue}
          inputDisplayValue={cpuInputDisplayValue}
          handleSliderChange={(event, newValue) => this.onCpuChange(newValue)}
          handleInputChange={e => this.onCpuInputChange(e.target.value)}
          handleInputBlur={() => this.onCpuInputBlur(cpuInputDisplayValue)}
          helperText={`${this.cpuValues[0]}  - ${
            this.cpuValues[this.cpuValues.length - 1]
          } vCPUs`}
        />
        <InputSlider
          possibleValues={this.memoryValues}
          label="Memory"
          value={memoryValue}
          inputDisplayValue={memoryInputDisplayValue}
          handleSliderChange={(event, newValue) =>
            this.onMemoryChange(newValue)
          }
          handleInputChange={e => this.onMemoryInputChange(e.target.value)}
          handleInputBlur={() =>
            this.onMemoryInputBlur(memoryInputDisplayValue)
          }
          helperText={`${this.memoryValues[0]} - ${
            this.memoryValues[this.memoryValues.length - 1]
          } GB`}
        />
      </div>
    );
  }
}
