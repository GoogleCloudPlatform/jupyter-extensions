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
  MenuCloseHandler,
  MenuIcon,
  IconButtonMenu,
  Message,
  Badge,
  ClientTransportService,
  ServerProxyTransportService,
} from 'gcp_jupyterlab_shared';
import MenuItem from '@material-ui/core/MenuItem';
import * as React from 'react';
import { stylesheet } from 'typestyle';
import { GcpService } from '../service/gcp';
import {
  GetPermissionsResponse,
  ProjectStateService,
} from '../service/project_state';
import { SchedulerForm } from './scheduler_form';
import { ActionBar } from './action_bar';

/** Information provided to the GcpSchedulerWidget */
export interface LaunchSchedulerRequest {
  timestamp: number;
  notebookName: string;
  notebook: INotebookModel;
}

export interface SubmittedMessage {
  message: string;
  link: string;
}

/** Definition for a function that closes the SchedulerDialog. */
export type OnDialogClose = () => void;
/** Definition for a function that changes the schedule type. */
export type OnScheduleTypeChange = (creatingExecution: boolean) => void;
/** Definition for a function that changes the displayed element. */
export type OnShowFormChange = (showCreateForm: boolean) => void;

/** Extension settings. */
export interface GcpSettings {
  projectId: string;
  gcsBucket: string;
  schedulerRegion: string;
  region?: string;
  scaleTier?: string;
  masterType?: string;
  acceleratorType?: string;
  acceleratorCount?: string;
  environmentImage?: string;
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
  submittedMessage?: SubmittedMessage;
  creatingExecution: boolean;
  showCreateForm: boolean;
}

const localStyles = stylesheet({
  header: {
    ...BASE_FONT,
    fontWeight: 500,
    fontSize: '18px',
    margin: '24px 24px -8px 24px',
    ...csstips.horizontal,
    ...csstips.center,
  },
  title: {
    ...csstips.flex,
  },
  main: {
    backgroundColor: COLORS.white,
    color: COLORS.base,
    padding: '24px',
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
      creatingExecution: true,
      showCreateForm: true,
    };
    this._settingsChanged = this._settingsChanged.bind(this);
    this._onDialogClose = this._onDialogClose.bind(this);
    this._onScheduleTypeChange = this._onScheduleTypeChange.bind(this);
    this._onShowFormChange = this._onShowFormChange.bind(this);
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
    return (
      <Dialog open={this._isOpen()} scroll="body">
        {this.state.showCreateForm && (
          <header className={localStyles.header}>
            <span className={localStyles.title}>
              Submit notebook to Executor
              <Badge value="alpha" />
            </span>
            <IconButtonMenu
              icon={<MenuIcon />}
              menuItems={menuCloseHandler => [
                <MenuItem
                  key="reset"
                  dense={true}
                  onClick={() => this._onResetSettings(menuCloseHandler)}
                >
                  Reset configuration
                </MenuItem>,
              ]}
            ></IconButtonMenu>
          </header>
        )}
        <main className={localStyles.main}>{this._getDialogContent()}</main>
      </Dialog>
    );
  }

  private _getDialogContent(): JSX.Element {
    const { gcpSettings, permissions, submittedMessage } = this.state;
    const { gcpService, request } = this.props;
    const hasNotebook = !!(request && request.notebook);
    if (submittedMessage) {
      return (
        <div className={css.column}>
          <Message text={submittedMessage.message} />
          <ActionBar onDialogClose={this._onDialogClose}>
            <a
              href={submittedMessage.link}
              target="_blank"
              className={css.button}
            >
              View Execution
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
          onScheduleTypeChange={this._onScheduleTypeChange}
          onShowFormChange={this._onShowFormChange}
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

  private _onResetSettings(closeHandler: MenuCloseHandler) {
    this.props.settings.save('{}');
    closeHandler();
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

  private _onScheduleTypeChange(creatingExecution: boolean) {
    this.setState({ creatingExecution });
  }

  private _onShowFormChange(showCreateForm: boolean) {
    this.setState({ showCreateForm });
  }

  private _onDialogClose() {
    this.setState({
      dialogClosedByUser: true,
      showCreateForm: true,
      creatingExecution: true,
    });
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
