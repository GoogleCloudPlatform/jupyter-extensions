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

import {
  getGpuTypeText,
  nvidiaNameToEnum,
  acceleratorNameToEnum,
  getGpuTypeOptionsList,
  getGpuCountOptionsList,
  ACCELERATOR_COUNTS_1_2_4_8,
  NO_ACCELERATOR_TYPE,
} from './accelerator_types';

describe('Accelerator type conversion methods', () => {
  const acceleratorTypes = [
    {
      creationTimestamp: '1969-12-31T16:00:00.000-08:00',
      description: 'NVIDIA Tesla K80',
      id: '10002',
      kind: 'compute#acceleratorType',
      maximumCardsPerInstance: 8,
      name: 'nvidia-tesla-k80',
      selfLink:
        'https://www.googleapis.com/compute/v1/projects/jupyterlab-interns-sandbox/zones/us-central1-a/acceleratorTypes/nvidia-tesla-k80',
      zone:
        'https://www.googleapis.com/compute/v1/projects/jupyterlab-interns-sandbox/zones/us-central1-a',
    },
    {
      creationTimestamp: '1969-12-31T16:00:00.000-08:00',
      description: 'NVIDIA Tesla P4',
      id: '10010',
      kind: 'compute#acceleratorType',
      maximumCardsPerInstance: 4,
      name: 'nvidia-tesla-p4',
      selfLink:
        'https://www.googleapis.com/compute/v1/projects/jupyterlab-interns-sandbox/zones/us-central1-a/acceleratorTypes/nvidia-tesla-p4',
      zone:
        'https://www.googleapis.com/compute/v1/projects/jupyterlab-interns-sandbox/zones/us-central1-a',
    },
    {
      creationTimestamp: '1969-12-31T16:00:00.000-08:00',
      description: 'NVIDIA Tesla T4',
      id: '10019',
      kind: 'compute#acceleratorType',
      maximumCardsPerInstance: 4,
      name: 'nvidia-tesla-t4',
      selfLink:
        'https://www.googleapis.com/compute/v1/projects/jupyterlab-interns-sandbox/zones/us-central1-a/acceleratorTypes/nvidia-tesla-t4',
      zone:
        'https://www.googleapis.com/compute/v1/projects/jupyterlab-interns-sandbox/zones/us-central1-a',
    },
    {
      creationTimestamp: '1969-12-31T16:00:00.000-08:00',
      description: 'NVIDIA Tesla T4 Virtual Workstation',
      id: '10020',
      kind: 'compute#acceleratorType',
      maximumCardsPerInstance: 4,
      name: 'nvidia-tesla-t4-vws',
      selfLink:
        'https://www.googleapis.com/compute/v1/projects/jupyterlab-interns-sandbox/zones/us-central1-a/acceleratorTypes/nvidia-tesla-t4-vws',
      zone:
        'https://www.googleapis.com/compute/v1/projects/jupyterlab-interns-sandbox/zones/us-central1-a',
    },
    {
      creationTimestamp: '1969-12-31T16:00:00.000-08:00',
      description: 'NVIDIA Tesla V100',
      id: '10008',
      kind: 'compute#acceleratorType',
      maximumCardsPerInstance: 8,
      name: 'nvidia-tesla-v100',
      selfLink:
        'https://www.googleapis.com/compute/v1/projects/jupyterlab-interns-sandbox/zones/us-central1-a/acceleratorTypes/nvidia-tesla-v100',
      zone:
        'https://www.googleapis.com/compute/v1/projects/jupyterlab-interns-sandbox/zones/us-central1-a',
    },
    {
      creationTimestamp: '1969-12-31T16:00:00.000-08:00',
      description: 'NVIDIA Tesla P100',
      id: '10004',
      kind: 'compute#acceleratorType',
      maximumCardsPerInstance: 4,
      name: 'nvidia-tesla-p100',
      selfLink:
        'https://www.googleapis.com/compute/v1/projects/jupyterlab-interns-sandbox/zones/us-central1-a/acceleratorTypes/nvidia-tesla-p100',
      zone:
        'https://www.googleapis.com/compute/v1/projects/jupyterlab-interns-sandbox/zones/us-central1-a',
    },
  ];

  describe('Gets GPU description from value', () => {
    it('Gets NVIDIA Tesla K80', () => {
      const text = getGpuTypeText('NVIDIA_TESLA_K80');
      const expectedText = 'NVIDIA Tesla K80';
      expect(text).toEqual(expectedText);
    });

    it('Gets NVIDIA Tesla P4', () => {
      const text = getGpuTypeText('NVIDIA_TESLA_P4');
      const expectedText = 'NVIDIA Tesla P4';
      expect(text).toEqual(expectedText);
    });

    it('Gets NVIDIA Tesla P100', () => {
      const text = getGpuTypeText('NVIDIA_TESLA_P100');
      const expectedText = 'NVIDIA Tesla P100';
      expect(text).toEqual(expectedText);
    });

    it('Gets NVIDIA Tesla T4', () => {
      const text = getGpuTypeText('NVIDIA_TESLA_T4');
      const expectedText = 'NVIDIA Tesla T4';
      expect(text).toEqual(expectedText);
    });

    it('Gets NVIDIA Tesla V100', () => {
      const text = getGpuTypeText('NVIDIA_TESLA_V100');
      const expectedText = 'NVIDIA Tesla V100';
      expect(text).toEqual(expectedText);
    });

    it('Gets empty string', () => {
      const text = getGpuTypeText('NONEXISTANT_ACCELERATOR');
      const expectedText = '';
      expect(text).toEqual(expectedText);
    });
  });

  describe('Gets AcceleratorType enum from NVIDIA value', () => {
    it('Gets ACCELERATOR_TYPE_UNSPECIFIED', () => {
      const enumValue = nvidiaNameToEnum('');
      expect(enumValue).toEqual(NO_ACCELERATOR_TYPE);
    });

    it('Gets NVIDIA_TESLA_K80', () => {
      const enumValue = nvidiaNameToEnum('Tesla K80');
      const expectedEnumValue = 'NVIDIA_TESLA_K80';
      expect(enumValue).toEqual(expectedEnumValue);
    });

    it('Gets NVIDIA_TESLA_P4', () => {
      const enumValue = nvidiaNameToEnum('Tesla P4');
      const expectedEnumValue = 'NVIDIA_TESLA_P4';
      expect(enumValue).toEqual(expectedEnumValue);
    });

    it('Gets NVIDIA_TESLA_P100', () => {
      const enumValue = nvidiaNameToEnum('Tesla P100-PCIE-16GB');
      const expectedEnumValue = 'NVIDIA_TESLA_P100';
      expect(enumValue).toEqual(expectedEnumValue);
    });

    it('Gets NVIDIA_TESLA_T4', () => {
      const enumValue = nvidiaNameToEnum('Tesla T4');
      const expectedEnumValue = 'NVIDIA_TESLA_T4';
      expect(enumValue).toEqual(expectedEnumValue);
    });

    it('Gets NVIDIA_TESLA_V100', () => {
      const enumValue = nvidiaNameToEnum('Tesla V100-SXM2-16GB');
      const expectedEnumValue = 'NVIDIA_TESLA_V100';
      expect(enumValue).toEqual(expectedEnumValue);
    });
  });

  describe('Gets AcceleratorType enum from gcloud compute acceleratorType value', () => {
    it('Gets NVIDIA_TESLA_K80', () => {
      const enumValue = acceleratorNameToEnum('nvidia-tesla-k80');
      const expectedEnumValue = 'NVIDIA_TESLA_K80';
      expect(enumValue).toEqual(expectedEnumValue);
    });

    it('Gets NVIDIA_TESLA_P4', () => {
      const enumValue = acceleratorNameToEnum('nvidia-tesla-p4');
      const expectedEnumValue = 'NVIDIA_TESLA_P4';
      expect(enumValue).toEqual(expectedEnumValue);
    });

    it('Gets NVIDIA_TESLA_P100', () => {
      const enumValue = acceleratorNameToEnum('nvidia-tesla-p100');
      const expectedEnumValue = 'NVIDIA_TESLA_P100';
      expect(enumValue).toEqual(expectedEnumValue);
    });

    it('Gets NVIDIA_TESLA_T4', () => {
      const enumValue = acceleratorNameToEnum('nvidia-tesla-t4');
      const expectedEnumValue = 'NVIDIA_TESLA_T4';
      expect(enumValue).toEqual(expectedEnumValue);
    });

    it('Gets NVIDIA_TESLA_V100', () => {
      const enumValue = acceleratorNameToEnum('nvidia-tesla-v100');
      const expectedEnumValue = 'NVIDIA_TESLA_V100';
      expect(enumValue).toEqual(expectedEnumValue);
    });

    it('Gets ACCELERATOR_TYPE_UNSPECIFIED', () => {
      const enumValue = acceleratorNameToEnum('nonexistant-accelerator');
      expect(enumValue).toEqual(NO_ACCELERATOR_TYPE);
    });
  });

  describe('Gets GPU type options list', () => {
    const expectedOptionsList = [
      { value: 'NVIDIA_TESLA_K80', text: 'NVIDIA Tesla K80' },
      { value: 'NVIDIA_TESLA_P4', text: 'NVIDIA Tesla P4' },
      { value: 'NVIDIA_TESLA_T4', text: 'NVIDIA Tesla T4' },
      { value: 'NVIDIA_TESLA_V100', text: 'NVIDIA Tesla V100' },
      { value: 'NVIDIA_TESLA_P100', text: 'NVIDIA Tesla P100' },
    ];

    it('Gets complete list', () => {
      const optionsList = getGpuTypeOptionsList(
        acceleratorTypes,
        'Intel Haswell'
      );
      expect(optionsList).toEqual(expectedOptionsList);
    });

    it('Skips NVIDIA Tesla K80', () => {
      const optionsList = getGpuTypeOptionsList(
        acceleratorTypes,
        'Intel Skylake'
      );
      expect(optionsList).toEqual(expectedOptionsList.slice(1));
    });
  });

  describe('Gets GPU count options list', () => {
    it('Gets list with up to 8 cards', () => {
      const optionsList = getGpuCountOptionsList(
        acceleratorTypes,
        'NVIDIA_TESLA_K80'
      );
      expect(optionsList).toEqual(ACCELERATOR_COUNTS_1_2_4_8.slice(0, 4));
    });

    it('Gets list with up to 4 cards', () => {
      const optionsList = getGpuCountOptionsList(
        acceleratorTypes,
        'NVIDIA_TESLA_P4'
      );
      expect(optionsList).toEqual(ACCELERATOR_COUNTS_1_2_4_8.slice(0, 3));
    });

    it('Gets default list', () => {
      const optionsList = getGpuCountOptionsList(acceleratorTypes, '');
      expect(optionsList).toEqual(ACCELERATOR_COUNTS_1_2_4_8);
    });

    it('Receives ACCELERATOR_TYPE_UNSPECIFIED', () => {
      const optionsList = getGpuCountOptionsList(
        acceleratorTypes,
        NO_ACCELERATOR_TYPE
      );
      expect(optionsList).toEqual(ACCELERATOR_COUNTS_1_2_4_8);
    });
  });
});
