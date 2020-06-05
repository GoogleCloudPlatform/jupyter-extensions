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

import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin,
} from '@jupyterlab/application';
import { ToolbarButton } from '@jupyterlab/apputils';
import { ISettingRegistry } from '@jupyterlab/coreutils';
import { DocumentRegistry } from '@jupyterlab/docregistry';
import { INotebookModel, NotebookPanel } from '@jupyterlab/notebook';
import { toArray } from '@phosphor/algorithm';
import { DisposableDelegate, IDisposable } from '@phosphor/disposable';

import { GcpScheduledJobsWidget } from './components/jobs_panel_widget';
import {
  GcpSchedulerContext,
  GcpSchedulerWidget,
} from './components/scheduler_widget';
import { GcpService } from './service/gcp';
import { ServerProxyTransportService } from './service/transport';
import { ProjectStateService } from './service/project_state';

/** Adds a Scheduler button to the Notebook toolbar. */
class SchedulerButtonExtension
  implements DocumentRegistry.IWidgetExtension<NotebookPanel, INotebookModel> {
  constructor(private schedulerContext: GcpSchedulerContext) {}

  createNew(
    panel: NotebookPanel,
    context: DocumentRegistry.IContext<INotebookModel>
  ): IDisposable {
    const button = new ToolbarButton({
      className: 'scheduleOnGcp',
      iconClassName:
        'jp-Icon jp-Icon-16 jp-ToolbarButtonComponent-icon jp-SchedulerIcon',
      tooltip: 'Schedule on GCP',
      onClick: () => {
        // Update the context to the active Notebook
        this.schedulerContext.value = {
          notebookName: context.path,
          notebook: context.model,
          timestamp: Date.now(),
        };
      },
    });

    // Find the index of spacer and insert after it
    const index = toArray(panel.toolbar.names()).findIndex(n => n === 'spacer');
    panel.toolbar.insertItem(index, 'scheduleOnGcp', button);
    return new DisposableDelegate(() => button.dispose());
  }
}

async function activateScheduler(
  app: JupyterFrontEnd,
  settingRegistry: ISettingRegistry
) {
  console.debug('Activating GCP Notebook Scheduler Extension');
  const schedulerContext = new GcpSchedulerContext();
  const settings = await settingRegistry.load(
    'jupyterlab_gcpscheduler:gcpsettings  '
  );
  const projectId = settings.get('projectId').composite;
  const transportService = new ServerProxyTransportService();
  const projectStateService = new ProjectStateService(
    transportService,
    projectId ? projectId.toString() : null
  );
  const gcpService = new GcpService(transportService, projectStateService);
  const schedulerWidget = new GcpSchedulerWidget(
    projectStateService,
    gcpService,
    settings,
    schedulerContext
  );
  schedulerWidget.id = 'gcpscheduler';
  const jobsWidget = new GcpScheduledJobsWidget(gcpService);

  app.shell.add(schedulerWidget, 'bottom');
  app.shell.add(jobsWidget, 'left');

  app.docRegistry.addWidgetExtension(
    'Notebook',
    new SchedulerButtonExtension(schedulerContext)
  );
}

/**
 * The plugin registration information.
 */
const schedulerPlugin: JupyterFrontEndPlugin<void> = {
  activate: activateScheduler,
  autoStart: true,
  id: 'gcpscheduler:button',
  requires: [ISettingRegistry],
};

/**
 * Export the plugin as default.
 */
export default [schedulerPlugin];
