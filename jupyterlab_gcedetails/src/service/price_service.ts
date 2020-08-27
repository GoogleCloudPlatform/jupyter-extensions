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
import {
  HardwareConfiguration,
  REGIONS,
  HOURS_PER_MONTH,
  NO_SUSTAINED_DISCOUNT_PREFIXES,
} from '../data/data';

/** The monthly price catalog for region and sku */
type Catalog = Map<string, Map<string, number>>;

export class PriceService {
  private catalog: Catalog;

  private async buildCatalog(): Promise<void> {
    // Only attempt to build the catalog once
    if (this.catalog) {
      return;
    }
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
      const pricelist = fullCatalog.gcp_price_list;
      Object.keys(pricelist).forEach(sku => {
        if (sku.endsWith('PREEMPTIBLE')) return;
        if (
          sku.startsWith('CP-COMPUTEENGINE-VMIMAGE-N1') ||
          sku.startsWith('CP-COMPUTEENGINE-VMIMAGE-E2')
        ) {
          this.populateCatalog(
            sku.substring(25).toLowerCase(),
            pricelist[sku],
            true
          );
        } else if (sku.startsWith('GPU_')) {
          this.populateCatalog(sku.substring(4), pricelist[sku], true);
        } else if (sku === 'CP-COMPUTEENGINE-STORAGE-PD-CAPACITY') {
          this.populateCatalog('pd-standard', pricelist[sku], false);
        } else if (sku === 'CP-COMPUTEENGINE-STORAGE-PD-SSD') {
          this.populateCatalog('pd-ssd', pricelist[sku], false);
        }
      });
    } catch (err) {
      console.error(`Unable to retrieve pricelist.`);
    }
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
   * certain region. If catalog doesn't contain relevant resource information
   * returns undefined.
   */
  async getPrice(
    zone: string,
    config: HardwareConfiguration
  ): Promise<number | undefined> {
    await this.buildCatalog();

    const regionCatalog = this.getRegionCatalog(this.getRegionFromZone(zone!));
    if (!regionCatalog) return undefined;

    let total = 0;
    let hasSustainedUseDiscount = true;

    if (config.machineType) {
      const machineTypeValue = config.machineType.name;
      total += regionCatalog.get(machineTypeValue);

      hasSustainedUseDiscount = !NO_SUSTAINED_DISCOUNT_PREFIXES.some(prefix =>
        machineTypeValue.startsWith(prefix)
      );
    }

    if (config.attachGpu && config.gpuType && config.gpuCount) {
      total += regionCatalog.get(config.gpuType) * parseInt(config.gpuCount);
    }

    if (config.diskType && config.diskSizeGb) {
      total += regionCatalog.get(config.diskType) * parseInt(config.diskSizeGb);
    }

    if (hasSustainedUseDiscount) {
      total *= 0.7;
    }

    return isNaN(total) ? undefined : total;
  }
}
