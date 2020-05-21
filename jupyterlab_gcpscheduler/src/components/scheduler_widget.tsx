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

import { VDomModel, VDomRenderer } from '@jupyterlab/apputils';
import { ISettingRegistry } from '@jupyterlab/coreutils';
import * as React from 'react';

import { GcpService } from '../service/gcp';
import { ProjectStateService } from '../service/project_state';
import { LaunchSchedulerRequest, SchedulerDialog } from './dialog';

/**
 * Wraps a LaunchSchedulerRequest in a Signal to be able to update the
 * GcpSchedulerWidget when the value changes upon user action.
 */
export class GcpSchedulerContext extends VDomModel {
  private request: LaunchSchedulerRequest;

  get value(): LaunchSchedulerRequest {
    return this.request;
  }

  set value(action: LaunchSchedulerRequest) {
    this.request = action;
    this.stateChanged.emit();
  }
}

/** Phosphor Widget responsive to changes in the NotebookContext */
export class GcpSchedulerWidget extends VDomRenderer<GcpSchedulerContext> {
  constructor(
    private projectStateService: ProjectStateService,
    private gcpService: GcpService,
    private settings: ISettingRegistry.ISettings,
    readonly model: GcpSchedulerContext
  ) {
    super();
  }

  protected render() {
    return (
      <SchedulerDialog
        projectStateService={this.projectStateService}
        gcpService={this.gcpService}
        request={this.model.value}
        settings={this.settings}
      />
    );
  }
}
