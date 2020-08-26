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

import { ServerConnection } from '@jupyterlab/services';
import { Option, HardwareConfiguration } from '../data/data';

/** The monthly price catalog for region and sku */
type Catalog = Map<string, Map<string, number>>;

/** The average number of hours in a month, i.e., 365 / 12 * 24 */
const HOURS_PER_MONTH = 730;
const NO_SUSTAINED_DISCOUNT_PREFIXES = ['e2-'];
const REGIONS: Option[] = [
  {
    value: 'us-central1',
    text: 'us-central1 (Iowa)',
  },
  {
    value: 'us-east1',
    text: 'us-east1 (South Carolina)',
  },
  {
    value: 'us-east4',
    text: 'us-east4 (Northern Virginia)',
  },
  {
    value: 'us-west1',
    text: 'us-west1 (Oregon)',
  },
  {
    value: 'us-west2',
    text: 'us-west2 (Los Angeles)',
  },
  {
    value: 'us-west3',
    text: 'us-west3 (Salt Lake City)',
  },
  {
    value: 'asia-east1',
    text: 'asia-east1 (Taiwan)',
  },
  {
    value: 'europe-north1',
    text: 'europe-north1 (Finland)',
  },
  {
    value: 'europe-west1',
    text: 'europe-west1 (Belgium)',
  },
  {
    value: 'europe-west2',
    text: 'europe-west2 (London)',
  },
  {
    value: 'europe-west3',
    text: 'europe-west3 (Frankfurt)',
  },
  {
    value: 'europe-west4',
    text: 'europe-west4 (Netherlands)',
  },
  {
    value: 'europe-west6',
    text: 'europe-west6 (Zurich)',
  },
  {
    value: 'asia-east1',
    text: 'asia-east1 (Taiwan)',
  },
  {
    value: 'asia-east2',
    text: 'asia-east2 (Hong Kong)',
  },
  {
    value: 'asia-south1',
    text: 'asia-south1 (Mumbai)',
  },
  {
    value: 'asia-northeast1',
    text: 'asia-northeast1 (Tokyo)',
  },
  {
    value: 'asia-northeast2',
    text: 'asia-northeast2 (Osaka)',
  },
  {
    value: 'asia-northeast3',
    text: 'asia-northeast3 (Seoul)',
  },
  {
    value: 'asia-southeast1',
    text: 'asia-southeast1 (Singapore)',
  },
];

export class PriceService {
  private catalog: Catalog;
  private _receivedError: boolean;

  async getPriceList(): Promise<void> {
    // Only rebuild ctalog if it hasn't been built or was built unsuccessfully
    if (!this.catalog || this._receivedError) {
      try {
        this.catalog = new Map();
        const response = await ServerConnection.makeRequest(
          `${ServerConnection.defaultSettings.baseUrl}gcp/v1/pricelist`,
          {},
          ServerConnection.defaultSettings
        );
        if (!response.ok) {
          throw { result: await response.text() };
        }
        const fullCatalog = await response.json();
        Object.keys(fullCatalog).forEach(sku => {
          if (sku.endsWith('PREEMPTIBLE')) return;
          if (
            sku.startsWith('CP-COMPUTEENGINE-VMIMAGE-N1') ||
            sku.startsWith('CP-COMPUTEENGINE-VMIMAGE-E2')
          ) {
            this.populateCatalog(
              sku.substring(25).toLowerCase(),
              fullCatalog[sku],
              true
            );
          } else if (sku.startsWith('GPU_')) {
            this.populateCatalog(sku.substring(4), fullCatalog[sku], true);
          } else if (sku === 'CP-COMPUTEENGINE-STORAGE-PD-CAPACITY') {
            this.populateCatalog('pd-standard', fullCatalog[sku], false);
          } else if (sku === 'CP-COMPUTEENGINE-STORAGE-PD-SSD') {
            this.populateCatalog('pd-ssd', fullCatalog[sku], false);
          }
        });
        this._receivedError = false;
      } catch (err) {
        console.error(`Unable to retrieve pricelist.`);
        this._receivedError = true;
      }
    }
  }

  get receivedError() {
    return this._receivedError;
  }

  // tslint:disable-next-line:no-any The json object returned is not typed.
  private populateCatalog(sku: string, prices: any, timeBased: boolean) {
    Object.keys(prices).forEach(region => {
      const regionCatalog = this.getRegionCatalog(region);
      if (regionCatalog) {
        regionCatalog.set(
          sku,
          prices[region] * (timeBased ? HOURS_PER_MONTH : 1.0)
        );
      }
    });
  }

  private getRegionCatalog(region: string): Map<string, number> | undefined {
    if (REGIONS.find(r => r.value === region)) {
      if (!this.catalog.has(region)) {
        this.catalog.set(region, new Map<string, number>());
      }
      return this.catalog.get(region);
    }
    return undefined;
  }

  private getRegionFromZone(zone: string): string {
    return zone.split('-', 2).join('-');
  }

  /**
   * Returns estimated total monthly price for a given instance to be created in a
   * certain region.
   *
   * Logics adapted from
   * //depot/google3/java/com/google/developers/console/web/common/compute/pricing/pricing_service.ts
   */
  getPrice(zone: string, config: HardwareConfiguration): number {
    const regionCatalog = this.getRegionCatalog(this.getRegionFromZone(zone!));
    if (!regionCatalog) return undefined;

    let total = 0;
    let hasSustainedUseDiscount = true;

    if (config.machineType) {
      const machineTypeValue = config.machineType.name;
      total += regionCatalog.get(machineTypeValue)!;

      hasSustainedUseDiscount = !NO_SUSTAINED_DISCOUNT_PREFIXES.some(prefix =>
        machineTypeValue.startsWith(prefix)
      );
    }

    if (config.attachGpu && config.gpuType && config.gpuCount) {
      total += regionCatalog.get(config.gpuType)! * parseInt(config.gpuCount);
    }

    if (config.diskType && config.diskSizeGb) {
      total +=
        regionCatalog.get(config.diskType)! * parseInt(config.diskSizeGb);
    }

    return hasSustainedUseDiscount ? total * 0.7 : total;
  }
}
