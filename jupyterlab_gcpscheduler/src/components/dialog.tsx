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

import { ISettingRegistry } from '@jupyterlab/coreutils';
import { INotebookModel } from '@jupyterlab/notebook';
import { Dialog } from '@material-ui/core';
import * as csstips from 'csstips';
import * as React from 'react';
import { stylesheet } from 'typestyle';

import { SCHEDULER_LINK, BUCKET_NAME_SUFFIX } from '../data';
import { GcpService } from '../service/gcp';
import {
  GetPermissionsResponse,
  ProjectStateService,
  ProjectState,
} from '../service/project_state';
import { BASE_FONT, COLORS, css } from '../styles';
import { Initializer } from './initialization/initializer';
import { SchedulerForm } from './scheduler_form';
import { ActionBar } from './shared/action_bar';
import {
  IconButtonMenu,
  MenuCloseHandler,
  SmallMenuItem,
} from './shared/icon_button_menu';
import { Message } from './shared/message';

import {
  ClientTransportService,
  ServerProxyTransportService,
} from '../service/transport';

/** Information provided to the GcpSchedulerWidget */
export interface LaunchSchedulerRequest {
  timestamp: number;
  notebookName: string;
  notebook: INotebookModel;
}

export interface JobSubmittedMessage {
  message: string;
  link: string;
}

/** Definition for a function that closes the SchedulerDialog. */
export type OnDialogClose = () => void;

/** Callback function that accepts an initialized ProjectState */
export type OnInitialized = (projectState: ProjectState) => void;

/** Extension settings. */
export interface GcpSettings {
  projectId: string;
  gcsBucket: string;
  schedulerRegion: string;
  jobRegion?: string;
  scaleTier?: string;
  containerImage?: string;
  oAuthClientId?: string;
}

interface Props {
  projectStateService: ProjectStateService;
  gcpService: GcpService;
  request: LaunchSchedulerRequest;
  settings: ISettingRegistry.ISettings;
}

interface State {
  canSchedule: boolean;
  dialogClosedByUser: boolean;
  gcpSettings?: GcpSettings;
  permissions?: GetPermissionsResponse;
  jobSubmittedMessage?: JobSubmittedMessage;
}

const localStyles = stylesheet({
  header: {
    ...BASE_FONT,
    fontWeight: 500,
    fontSize: '15px',
    margin: '16px 16px 0 16px',
    ...csstips.horizontal,
    ...csstips.center,
  },
  title: {
    ...csstips.flex,
  },
  main: {
    backgroundColor: COLORS.white,
    color: COLORS.base,
    padding: '16px',
    width: '480px',
    ...BASE_FONT,
    ...csstips.vertical,
  },
});

const PYTHON2 = 'python2';
const PYTHON2_WARNING =
  'Python 2 Notebooks are not supported. Please upgrade your Notebook to use Python 3';

/**
 * Dialog wrapping the GCP scheduler UI.
 */
export class SchedulerDialog extends React.Component<Props, State> {
  private getPermissionsPromise?: Promise<void>;

  constructor(props: Props) {
    super(props);

    this.state = {
      dialogClosedByUser: false,
      canSchedule: false,
    };
    this._settingsChanged = this._settingsChanged.bind(this);
    this._onDialogClose = this._onDialogClose.bind(this);
    this._onInitialized = this._onInitialized.bind(this);
  }

  /** Establishes the binding for Settings Signal and invokes the handler. */
  componentDidMount() {
    this.props.settings.changed.connect(this._settingsChanged);
    this._settingsChanged(this.props.settings);
  }

  componentWillUnmount() {
    this.props.settings.changed.disconnect(this._settingsChanged);
  }

  /**
   * Set the dialog to be open since for any new request with a valid Notebook.
   */
  componentDidUpdate(prevProps: Props) {
    if (
      prevProps.request !== this.props.request &&
      !!this.props.request.notebook
    ) {
      this.setState({ dialogClosedByUser: false });
    }
    if (
      this._isOpen() &&
      !this.state.permissions &&
      !this.getPermissionsPromise
    ) {
      this.getPermissionsPromise = this._checkPermissions();
    }
  }

  render() {
    const { gcpSettings } = this.state;
    const projectId = gcpSettings ? gcpSettings.projectId : '';
    return (
      <Dialog open={this._isOpen()}>
        <header className={localStyles.header}>
          <span className={localStyles.title}>Schedule a notebook run</span>
          <IconButtonMenu
            menuItems={menuCloseHandler => [
              <SmallMenuItem key="viewAllJobs">
                <a
                  href={`${SCHEDULER_LINK}?project=${projectId}`}
                  target="_blank"
                  onClick={menuCloseHandler}
                >
                  View all scheduled jobs
                </a>
              </SmallMenuItem>,
              <SmallMenuItem
                key="reset"
                onClick={() => this._onResetSettings(menuCloseHandler)}
              >
                Reset configuration
              </SmallMenuItem>,
            ]}
          ></IconButtonMenu>
        </header>
        <main className={localStyles.main}>{this._getDialogContent()}</main>
      </Dialog>
    );
  }

  private _getDialogContent(): JSX.Element {
    const {
      canSchedule,
      gcpSettings,
      permissions,
      jobSubmittedMessage,
    } = this.state;
    const { gcpService, projectStateService, request } = this.props;
    const hasNotebook = !!(request && request.notebook);
    if (jobSubmittedMessage) {
      return (
        <div className={css.column}>
          <Message text={jobSubmittedMessage.message} />
          <ActionBar onDialogClose={this._onDialogClose}>
            <a
              href={jobSubmittedMessage.link}
              target="_blank"
              className={css.button}
            >
              View Job
            </a>
          </ActionBar>
        </div>
      );
    } else if (
      hasNotebook &&
      request.notebook.defaultKernelName.toLowerCase().replace(' ', '') ===
        PYTHON2
    ) {
      // For now, only exclude Python 2 kernels
      return (
        <div className={css.column}>
          <Message asError={true} text={PYTHON2_WARNING} />
          <ActionBar onDialogClose={this._onDialogClose} />
        </div>
      );
    } else if (!canSchedule) {
      return (
        <Initializer
          projectStateService={projectStateService}
          onDialogClose={this._onDialogClose}
          onInitialized={this._onInitialized}
        />
      );
    } else if (canSchedule && hasNotebook) {
      return permissions ? (
        <SchedulerForm
          gcpService={gcpService}
          gcpSettings={gcpSettings}
          notebookName={request.notebookName}
          notebook={request.notebook}
          permissions={permissions}
          onDialogClose={this._onDialogClose}
          settings={this.props.settings}
        />
      ) : (
        <div className={css.column}>
          <Message asActivity={true} text="Checking IAM Permissions" />
          <ActionBar onDialogClose={this._onDialogClose} />
        </div>
      );
    }
    return null;
  }

  // Casts to GcpSettings shape from JSONObject
  private _settingsChanged(newSettings: ISettingRegistry.ISettings) {
    const settings = (newSettings.composite as unknown) as GcpSettings;
    const canSchedule = !!(settings.projectId && settings.gcsBucket);
    if (settings.projectId) {
      console.info(`Using ${settings.projectId} for GCP API calls`);
      this.props.projectStateService.projectId = settings.projectId;
    }
    if (settings.oAuthClientId) {
      console.info('Using end-user authentication for GCP API calls');
      this.props.gcpService.transportService = new ClientTransportService(
        settings.oAuthClientId
      );
    } else if (this.state.gcpSettings && this.state.gcpSettings.oAuthClientId) {
      console.info('Using machine authentication for GCP API calls');
      this.props.gcpService.transportService = new ServerProxyTransportService();
    }

    this.setState({ gcpSettings: settings, canSchedule });
  }

  // Callback when Initializer has a valid project state
  private _onInitialized(projectState: ProjectState) {
    const { settings } = this.props;
    const gcpSettings = (settings.composite as unknown) as GcpSettings;
    if (gcpSettings.projectId !== projectState.projectId) {
      settings.set('projectId', projectState.projectId);
    }
    if (!gcpSettings.gcsBucket && projectState.hasGcsBucket) {
      settings.set(
        'gcsBucket',
        `gs://${projectState.projectId}${BUCKET_NAME_SUFFIX}`
      );
    }
    if (!gcpSettings.schedulerRegion && projectState.canSubmitScheduledJobs) {
      settings.set('schedulerRegion', projectState.schedulerRegion);
    }
  }

  private _onDialogClose() {
    this.setState({ dialogClosedByUser: true });
  }

  private _onResetSettings(closeHandler: MenuCloseHandler) {
    this.props.settings.save('{}');
    closeHandler();
  }

  private _isOpen() {
    const hasNotebook = !!(this.props.request && this.props.request.notebook);
    return hasNotebook && !this.state.dialogClosedByUser;
  }

  private async _checkPermissions() {
    const permissions = await this.props.projectStateService.getPermissions();
    this.setState({ permissions });
  }
}
