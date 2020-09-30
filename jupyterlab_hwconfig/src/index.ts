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

// Ensure styles are loaded by webpack
import '../style/index.css';

import { IStatusBar } from '@jupyterlab/statusbar';
import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin,
} from '@jupyterlab/application';
import {
  getMetadata,
  ClientTransportService,
  ServerProxyTransportService,
} from 'gcp_jupyterlab_shared';
import { VmDetailsWidget } from './details_widget';
import { HardwareService } from './service/hardware_service';
import { extractLast, DetailsResponse } from './data/data';
import { NotebooksService } from './service/notebooks_service';
import { PriceService } from './service/price_service';
import { HardwareConfigurationDialog } from './components/hardware_configuration_dialog';
import { ResourceChartPopper } from './components/resource_chart_popper';

async function activateDetailsWidget(
  _app: JupyterFrontEnd,
  statusbar: IStatusBar
) {
  console.debug('Activating Hardware Configuration extension');

  const clientTransportService = new ClientTransportService();
  const serverProxyTransportService = new ServerProxyTransportService();

  let notebooksService: NotebooksService;
  let hardwareService: HardwareService;
  let priceService: PriceService;
  let initializationError = false;

  try {
    const metadata = await getMetadata();
    notebooksService = new NotebooksService(
      clientTransportService,
      metadata.project,
      extractLast(metadata.name),
      extractLast(metadata.zone)
    );
    hardwareService = new HardwareService(
      serverProxyTransportService,
      metadata.project,
      extractLast(metadata.zone)
    );
    priceService = new PriceService();
  } catch (err) {
    initializationError = true;
  }

  const detailsWidget = new VmDetailsWidget(
    notebooksService,
    hardwareService,
    priceService,
    initializationError
  );

  statusbar.registerStatusItem('hwConfig', {
    item: detailsWidget,
    align: 'left',
  });
}

// Default export for the front-end plugin providing GCE details.
const hwConfig: JupyterFrontEndPlugin<void> = {
  id: 'jupyterlab_hwconfig',
  requires: [IStatusBar],
  autoStart: true,
  activate: activateDetailsWidget,
};

export default hwConfig;

// Export classes that may need to be assembled in a seperate extension
export {
  DetailsResponse,
  HardwareConfigurationDialog,
  HardwareService,
  NotebooksService,
  PriceService,
  ResourceChartPopper,
};
