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

import { MACHINE_TYPES_RESPONSE } from '../test_helpers';
import {
  optionToMachineType,
  machineTypeToOption,
  MACHINE_TYPES,
  getMachineTypeText,
  machineTypeToBaseName,
  getMachineTypeConfigurations,
} from './machine_types';

describe('Machine type conversion methods', () => {
  const OPTION = { value: 'n1-standard-96', text: '96 vCPUs, 360 GB RAM' };
  const MACHINE_TYPE = {
    name: 'n1-standard-96',
    description: '96 vCPUs, 360 GB RAM',
  };

  it('Converts Option to MachineType', () => {
    const machineType = optionToMachineType(OPTION);
    expect(machineType).toEqual(MACHINE_TYPE);
  });

  it('Converts MachineType to Option', () => {
    const option = machineTypeToOption(MACHINE_TYPE);
    expect(option).toEqual(OPTION);
  });

  describe('Gets description text from MachineType name', () => {
    it('Gets text without passing a machineTypes list', () => {
      const text = getMachineTypeText('m1-ultramem-160');
      expect(text).toEqual('160 vCPUs, 3844 GB RAM');
    });

    it('Gets text with empty machineTypes list', () => {
      const text = getMachineTypeText('m1-ultramem-160', []);
      expect(text).toEqual('160 vCPUs, 3844 GB RAM');
    });

    it('Gets text from passed machineTypes list', () => {
      const machineTypes = [
        {
          base: {
            value: 'test-',
            text: 'Test',
          },
          configurations: [
            { value: 'test-configuration', text: 'Test Configuration' },
          ],
        },
      ];
      const text = getMachineTypeText('test-configuration', machineTypes);
      expect(text).toEqual('Test Configuration');
    });

    it('Returns the value when value base isnt found in machineTypes list', () => {
      const text = getMachineTypeText('doesnt-exist');
      expect(text).toEqual('doesnt-exist');
    });

    it('Returns the value when value isnt found in machineTypes list', () => {
      const machineTypes = [
        {
          base: {
            value: 'test-',
            text: 'Test',
          },
          configurations: [
            { value: 'test-configuration', text: 'Test Configuration' },
          ],
        },
      ];
      const text = getMachineTypeText('test-doesnt-exist', machineTypes);
      expect(text).toEqual('test-doesnt-exist');
    });
  });

  describe('Gets base name from machine type name', () => {
    it('Gets memory-optimized machine type base name', () => {
      const baseName = machineTypeToBaseName('m1-ultramem-40');
      expect(baseName).toEqual('m1-');
    });

    it('Gets compute-optimized machine type base name', () => {
      const baseName = machineTypeToBaseName('c2-standard-4');
      expect(baseName).toEqual('c2-');
    });

    it('Gets machine type base name', () => {
      const baseName = machineTypeToBaseName('n2-highmem-48');
      expect(baseName).toEqual('n2-highmem-');
    });

    it('Returns passed machine type name if in invalid fromat', () => {
      const baseName = machineTypeToBaseName('machinetypename');
      expect(baseName).toEqual('machinetypename');
    });
  });

  describe('Parse machine types retreived from compute API', () => {
    it('Succesfully parses gapi machine types list in correct order', () => {
      const expectedMachineTypeConfigurations = [
        {
          base: {
            value: 'n1-standard-',
            text: 'N1 standard',
          },
          configurations: [
            { value: 'n1-standard-96', text: '96 vCPUs, 360 GB RAM' },
          ],
        },
        {
          base: {
            value: 'n1-ultramem-',
            text: 'N1 ultramem',
          },
          configurations: [
            { value: 'n1-ultramem-40', text: '40 vCPUs, 961 GB RAM' },
            { value: 'n1-ultramem-160', text: '160 vCPUs, 3844 GB RAM' },
          ],
        },
        {
          base: {
            value: 'c2-',
            text: 'Compute-optimized',
          },
          configurations: [
            {
              value: 'c2-standard-16',
              text: 'Compute Optimized: 16 vCPUs, 64 GB RAM',
            },
          ],
        },
      ];
      const machineTypeConfigurations = getMachineTypeConfigurations(
        MACHINE_TYPES_RESPONSE
      );
      expect(machineTypeConfigurations).toEqual(
        expectedMachineTypeConfigurations
      );
    });

    it('Returns master list when passed machineTypes is empty', () => {
      const machineTypeConfigurations = getMachineTypeConfigurations([]);
      expect(machineTypeConfigurations).toEqual(MACHINE_TYPES);
    });
  });
});
