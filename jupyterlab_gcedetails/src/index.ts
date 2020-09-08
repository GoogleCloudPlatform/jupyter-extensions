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
import { DetailsService } from './service/details_service';
import { extractLast } from './data/data';
import { NotebooksService } from './service/notebooks_service';
import { PriceService } from './service/price_service';
import { ServerWrapper } from './components/server_wrapper';

async function activateDetailsWidget(
  app: JupyterFrontEnd,
  statusbar: IStatusBar
) {
  console.debug('Activating GCP Details Extension');

  const clientTransportService = new ClientTransportService();
  const serverProxyTransportService = new ServerProxyTransportService();
  const detailsServer = new ServerWrapper();

  let notebooksService: NotebooksService;
  let detailsService: DetailsService;
  let priceService: PriceService;
  let initializationError = false;

  try {
    const details = await getMetadata();

    notebooksService = new NotebooksService(
      clientTransportService,
      details.project,
      extractLast(details.name),
      extractLast(details.zone)
    );
    detailsService = new DetailsService(
      serverProxyTransportService,
      details.project,
      extractLast(details.zone)
    );
    priceService = new PriceService();
  } catch (err) {
    initializationError = true;
  }

  const detailsWidget = new VmDetailsWidget(
    detailsServer,
    notebooksService,
    detailsService,
    priceService,
    initializationError
  );

  statusbar.registerStatusItem('gceDetails', {
    item: detailsWidget,
    align: 'left',
  });
}

// Default export for the front-end plugin providing GCE details.
const gceDetails: JupyterFrontEndPlugin<void> = {
  id: 'jupyterlab_gcedetails',
  requires: [IStatusBar],
  autoStart: true,
  activate: activateDetailsWidget,
};

export default gceDetails;
