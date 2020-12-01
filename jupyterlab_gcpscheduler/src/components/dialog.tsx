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
import {
  BASE_FONT,
  COLORS,
  css,
  IconButtonMenu,
  MenuCloseHandler,
  SmallMenuItem,
  Message,
  Badge,
} from 'gcp_jupyterlab_shared';
import * as React from 'react';
import { stylesheet } from 'typestyle';

import { SCHEDULER_LINK } from '../data';
import { GcpService } from '../service/gcp';
import {
  GetPermissionsResponse,
  ProjectStateService,
} from '../service/project_state';
import { SchedulerForm } from './scheduler_form';
import { ActionBar } from './action_bar';

import {
  ClientTransportService,
  ServerProxyTransportService,
} from 'gcp_jupyterlab_shared';

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

/** Extension settings. */
export interface GcpSettings {
  projectId: string;
  gcsBucket: string;
  schedulerRegion: string;
  jobRegion?: string;
  scaleTier?: string;
  masterType?: string;
  acceleratorType?: string;
  acceleratorCount?: string;
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
    };
    this._settingsChanged = this._settingsChanged.bind(this);
    this._onDialogClose = this._onDialogClose.bind(this);
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
    const projectId = this.getProjectId();
    return (
      <Dialog open={this._isOpen()} scroll="body">
        <header className={localStyles.header}>
          <span className={localStyles.title}>
            Create a notebook job <Badge value="alpha" />
          </span>
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

  private getProjectId() {
    const { gcpSettings } = this.state;
    return gcpSettings ? gcpSettings.projectId : '';
  }

  private _getDialogContent(): JSX.Element {
    const { gcpSettings, permissions, jobSubmittedMessage } = this.state;
    const { gcpService, request } = this.props;
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
    } else {
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
  private async _settingsChanged(newSettings: ISettingRegistry.ISettings) {
    const settings = (newSettings.composite as unknown) as GcpSettings;
    if (settings.projectId) {
      console.info(`Using ${settings.projectId} for GCP API calls`);
      this.props.projectStateService.projectId = settings.projectId;
    } else {
      const projectId = await this.props.gcpService.projectId;
      this.props.projectStateService.projectId = projectId;
      settings.projectId = projectId;
      newSettings.set('projectId', projectId);
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
    this.setState({ gcpSettings: settings });
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
