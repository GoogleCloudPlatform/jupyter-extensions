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

import { PriceService } from './price_service';
import { HardwareConfiguration } from '../data/data';

const TEST_CATALOG = new Map([
  [
    'us-west1',
    new Map([
      ['n1-standard-4', 1],
      ['NVIDIA_TESLA_K80', 1],
      ['standard-persistent-disk', 1],
    ]),
  ],
]);

const TEST_ZONE = 'us-west1-b';

const TEST_CONFIGURATION: HardwareConfiguration = {
  machineType: { name: 'n1-standard-4', description: '4 CPUs, 16 GB Memory' },
  attachGpu: true,
  gpuType: 'NVIDIA_TESLA_K80',
  gpuCount: '2',
  diskType: 'standard-persistent-disk',
  diskSizeGb: '100',
};

describe('PriceService', () => {
  let priceService: PriceService;

  beforeEach(() => {
    priceService = new PriceService();
    priceService._catalog = TEST_CATALOG;
  });

  describe('Get Price', () => {
    it('Gets price of configuration with machine type, GPU, disk and discount', async () => {
      const totalPrice = await priceService.getPrice(
        TEST_ZONE,
        TEST_CONFIGURATION
      );
      expect(totalPrice).toEqual(72.1);
    });

    it('Region doesnt exist', async () => {
      const totalPrice = await priceService.getPrice(
        'region-doesnt-exist',
        TEST_CONFIGURATION
      );
      expect(totalPrice).toBeUndefined();
    });

    it('Machine type doesnt exist', async () => {
      const configuration: HardwareConfiguration = {
        ...TEST_CONFIGURATION,
        machineType: {
          name: 'machine-type-doesnt-exist',
          description: '4 CPUs, 16 GB Memory',
        },
      };
      const totalPrice = await priceService.getPrice(TEST_ZONE, configuration);
      expect(totalPrice).toBeUndefined();
    });

    it('GPU type doesnt exist', async () => {
      const configuration: HardwareConfiguration = {
        ...TEST_CONFIGURATION,
        gpuType: 'GPU_DOESNT_EXIST',
      };
      const totalPrice = await priceService.getPrice(TEST_ZONE, configuration);
      expect(totalPrice).toBeUndefined();
    });

    it('Disk type doesnt exist', async () => {
      const configuration: HardwareConfiguration = {
        ...TEST_CONFIGURATION,
        diskType: 'disk-type-doesnt-exist',
      };
      const totalPrice = await priceService.getPrice(TEST_ZONE, configuration);
      expect(totalPrice).toBeUndefined();
    });

    it('Invalid GPU count value', async () => {
      const configuration: HardwareConfiguration = {
        ...TEST_CONFIGURATION,
        gpuCount: 'invalid-gpu-count',
      };
      const totalPrice = await priceService.getPrice(TEST_ZONE, configuration);
      expect(totalPrice).toBeUndefined();
    });

    it('Invalid disk size', async () => {
      const configuration: HardwareConfiguration = {
        ...TEST_CONFIGURATION,
        diskSizeGb: 'invalid-disk-size',
      };
      const totalPrice = await priceService.getPrice(TEST_ZONE, configuration);
      expect(totalPrice).toBeUndefined();
    });
  });
});
