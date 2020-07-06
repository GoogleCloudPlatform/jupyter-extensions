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
import Grid from '@material-ui/core/Grid';
import Slider from '@material-ui/core/Slider';
import { TextInput } from 'gcp_jupyterlab_shared';
import { HardwareConfiguration } from '../data';

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

  constructor(props: Props) {
    super(props);

    this.memoryValues = this.props.values.map(elem => elem.memory);
    this.cpuValues = this.props.values.map(elem => elem.cpu);

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

  /* Returns closest higher value to targetValue in possibleValues */
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

  render() {
    const {
      cpuInputDisplayValue,
      memoryInputDisplayValue,
      cpuValue,
      memoryValue,
    } = this.state;

    const handleCpuSliderChange = (event: any, newValue: number) => {
      this.onCpuChange(newValue);
    };

    const handleMemorySliderChange = (event: any, newValue: number) => {
      this.onMemoryChange(newValue);
    };

    const handleCpuInputChange = (
      event: React.ChangeEvent<HTMLInputElement>
    ) => {
      this.setState({
        cpuInputDisplayValue: event.target.value,
      });
    };

    const handleCpuInputBlur = () => {
      const newValue = this.closest(
        Number(cpuInputDisplayValue),
        this.cpuValues
      );
      this.onCpuChange(newValue);
    };

    const handleMemoryInputChange = (
      event: React.ChangeEvent<HTMLInputElement>
    ) => {
      this.setState({
        memoryInputDisplayValue: event.target.value,
      });
    };

    const handleMemoryInputBlur = () => {
      const newValue = this.closest(
        Number(memoryInputDisplayValue),
        this.memoryValues
      );
      this.onMemoryChange(newValue);
    };

    return (
      <div>
        <InputSlider
          possibleValues={this.cpuValues}
          label="Cores"
          value={cpuValue}
          inputDisplayValue={cpuInputDisplayValue}
          handleSliderChange={handleCpuSliderChange}
          handleInputChange={handleCpuInputChange}
          handleInputBlur={handleCpuInputBlur}
          helperText={`${this.cpuValues[0]}  - ${
            this.cpuValues[this.cpuValues.length - 1]
          } vCPUs`}
        />
        <InputSlider
          possibleValues={this.memoryValues}
          label="Memory"
          value={memoryValue}
          inputDisplayValue={memoryInputDisplayValue}
          handleSliderChange={handleMemorySliderChange}
          handleInputChange={handleMemoryInputChange}
          handleInputBlur={handleMemoryInputBlur}
          helperText={`${this.memoryValues[0]} - ${
            this.memoryValues[this.memoryValues.length - 1]
          } GB`}
        />
      </div>
    );
  }
}

interface InputSliderProps {
  value: number;
  possibleValues: number[];
  label?: string;
  handleSliderChange: (event: any, newValue: number) => void;

  inputDisplayValue: string;
  handleInputChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  handleInputBlur: () => void;
  helperText?: string;
}

function InputSlider(props: InputSliderProps) {
  const { label, value, handleSliderChange, possibleValues } = props;
  const {
    inputDisplayValue,
    handleInputChange,
    handleInputBlur,
    helperText,
  } = props;

  return (
    <div className={STYLES.container}>
      <label>{label}</label>
      <Grid container spacing={3} alignItems="center">
        <Grid item xs>
          <div className={STYLES.slider}>
            <Slider
              value={value}
              onChange={handleSliderChange}
              marks={possibleValues.map(value => ({ value }))}
              min={possibleValues[0]}
              max={possibleValues[possibleValues.length - 1]}
              step={null}
            />
          </div>
        </Grid>
        <Grid item>
          <TextInput
            value={inputDisplayValue}
            type="number"
            min={String(possibleValues[0])}
            max={String(possibleValues[possibleValues.length - 1])}
            step={1}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
          />
          {helperText && <label className={STYLES.label}>{helperText}</label>}
        </Grid>
      </Grid>
    </div>
  );
}
