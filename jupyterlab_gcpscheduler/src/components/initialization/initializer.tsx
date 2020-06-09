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

import {
  css,
  Message,
  SubmitButton,
  CheckboxInput,
  GreenCheck,
  RedClose,
} from 'gcp-jupyterlab-shared';
import * as React from 'react';

import { CLOUD_FUNCTION_REGION } from '../../data';
import { ProjectState, ProjectStateService } from '../../service/project_state';
import { OnDialogClose, OnInitialized } from '../dialog';
import { ActionBar } from '../action_bar';
import { AppEngineCreator } from './appengine_creator';
import { ResourceStatuses } from './resource_statuses';
import { ServiceStatuses } from './service_statuses';

/** Function to return a status icon */
export function getIconForState(enabled: boolean): JSX.Element {
  return enabled ? <GreenCheck /> : <RedClose />;
}

interface Props {
  projectStateService: ProjectStateService;
  onDialogClose: OnDialogClose;
  onInitialized: OnInitialized;
}

interface State {
  isRetrievingState: boolean;
  stateRetrievalError?: string;
  projectState?: ProjectState;
  isActivatingServices: boolean;
  serviceActivationError?: string;
  isCreatingBucket: boolean;
  bucketCreationError?: string;
  isDeployingFunction: boolean;
  functionDeploymentError?: string;
  enableRecurring: boolean;
}

/**
 * Manages the project initialization process which populates all necessary
 * settings.
 */
export class Initializer extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      isRetrievingState: false,
      isActivatingServices: false,
      isCreatingBucket: false,
      isDeployingFunction: false,
      enableRecurring: true,
    };

    this._setProjectState = this._setProjectState.bind(this);
    this._onInitialize = this._onInitialize.bind(this);
  }

  componentDidMount() {
    this._setProjectState();
  }

  render() {
    const {
      isRetrievingState,
      stateRetrievalError,
      projectState,
      enableRecurring,
    } = this.state;
    const needsAppEngine =
      enableRecurring &&
      projectState &&
      projectState.allServicesEnabled &&
      projectState.hasGcsBucket &&
      projectState.hasCloudFunction &&
      !projectState.schedulerRegion;

    let content: JSX.Element;
    if (isRetrievingState || !projectState) {
      content = (
        <Message
          asActivity={isRetrievingState}
          text={stateRetrievalError || 'Validating project configuration...'}
          asError={!!stateRetrievalError}
        />
      );
    } else if (needsAppEngine) {
      content = this._getContentIfNeedsAppEngine();
    } else if (
      projectState.canSubmitImmediateJobs &&
      (!enableRecurring || projectState.canSubmitScheduledJobs)
    ) {
      content = (
        <div>
          <Message
            asActivity={false}
            text={`Project ${projectState.projectId} is ready`}
            asError={false}
          />
          <ActionBar onDialogClose={this.props.onDialogClose}>
            <SubmitButton
              actionPending={false}
              onClick={this._setProjectState}
              text="OK"
            />
          </ActionBar>
        </div>
      );
    } else {
      content = this._getContentForInitialization();
    }

    return (
      <div className={css.column}>
        <p>
          Run a notebook from start to finish immediately or on a recurring
          schedule. The executed notebook output will be saved in a Cloud
          Storage bucket and viewable from a dashboard. Using this feature will
          incur additional charges. By clicking Initialize, you are agreeing to
          the terms of service for the APIs and services listed below.
        </p>
        {content}
      </div>
    );
  }

  private _getContentForInitialization(): JSX.Element {
    const {
      projectState,
      isActivatingServices,
      isCreatingBucket,
      isDeployingFunction,
      serviceActivationError,
      bucketCreationError,
      functionDeploymentError,
      enableRecurring,
    } = this.state;
    const isInitializing =
      isActivatingServices || isCreatingBucket || isDeployingFunction;
    const hasError = !!(
      serviceActivationError ||
      bucketCreationError ||
      functionDeploymentError
    );

    return (
      <div>
        <CheckboxInput
          label="Enable Recurring Scheduled Runs?"
          name="enableRecurring"
          title="If checked, jobs can be created to run on a recurring schedule"
          disabled={isInitializing}
          checked={enableRecurring}
          onChange={e => this.setState({ enableRecurring: e.target.checked })}
        />
        <ServiceStatuses
          serviceStatuses={this._getServicesToActivate(projectState)}
          isActivating={isActivatingServices}
          activationError={serviceActivationError}
        />
        <ResourceStatuses
          projectState={projectState}
          isCreatingBucket={isCreatingBucket}
          bucketCreationError={bucketCreationError}
          showCloudFunction={enableRecurring}
          isDeployingFunction={isDeployingFunction}
          functionDeploymentError={functionDeploymentError}
        />
        <p>
          Click the Initialize button to finish configuring
          {` ${projectState.projectId}`}.
        </p>
        <ActionBar onDialogClose={this.props.onDialogClose}>
          {hasError ? (
            <SubmitButton
              actionPending={false}
              onClick={this._setProjectState}
              text="Check Again"
            />
          ) : (
            <SubmitButton
              actionPending={isInitializing}
              onClick={this._onInitialize}
              text="Initialize"
            />
          )}
        </ActionBar>
      </div>
    );
  }

  private _getContentIfNeedsAppEngine(): JSX.Element {
    const { projectState } = this.state;
    return (
      <div>
        <AppEngineCreator projectId={projectState.projectId} />
        <p>
          Click the Check Again button after you have completed the steps listed
          above.
        </p>
        <ActionBar onDialogClose={this.props.onDialogClose}>
          <SubmitButton
            actionPending={false}
            onClick={this._setProjectState}
            text="Check Again"
          />
        </ActionBar>
      </div>
    );
  }

  private async _setProjectState() {
    this.setState({
      isRetrievingState: true,
      stateRetrievalError: undefined,
      serviceActivationError: undefined,
      bucketCreationError: undefined,
      functionDeploymentError: undefined,
    });
    try {
      const projectState = await this.props.projectStateService.getProjectState();
      if (
        projectState.canSubmitImmediateJobs &&
        (!this.state.enableRecurring || projectState.canSubmitScheduledJobs)
      ) {
        this.props.onInitialized(projectState);
      }
      this.setState({
        projectState,
        isRetrievingState: false,
      });
    } catch (err) {
      this.setState({
        isRetrievingState: false,
        stateRetrievalError: `${err}: Unable to determine project status`,
      });
    }
  }

  // Enables the list of APIs. Returns true if successful.
  private async _enableServices(services: string[]): Promise<boolean> {
    this.setState({
      isActivatingServices: true,
      serviceActivationError: undefined,
    });
    try {
      await this.props.projectStateService.enableServices(services);
      const newProjectState: ProjectState = { ...this.state.projectState };
      newProjectState.serviceStatuses.forEach(s => {
        s.enabled = s.enabled || services.indexOf(s.service.endpoint) > -1;
      });
      newProjectState.allServicesEnabled = newProjectState.serviceStatuses.every(
        s => s.enabled
      );
      this.setState({
        isActivatingServices: false,
        projectState: newProjectState,
      });
      return true;
    } catch (err) {
      this.setState({
        isActivatingServices: false,
        serviceActivationError: `${err}: Unable to enable necessary GCP APIs`,
      });
    }
    return false;
  }

  private async _createGcsBucket(): Promise<boolean> {
    this.setState({
      isCreatingBucket: true,
      bucketCreationError: undefined,
    });
    try {
      await this.props.projectStateService.createBucket();
      const newProjectState: ProjectState = { ...this.state.projectState };
      newProjectState.hasGcsBucket = true;
      this.setState({
        isCreatingBucket: false,
        projectState: newProjectState,
      });
      return true;
    } catch (err) {
      this.setState({
        isCreatingBucket: false,
        bucketCreationError: `${err}: Unable to create Cloud Storage bucket`,
      });
    }
    return false;
  }

  private async _deployCloudFunction() {
    this.setState({
      isDeployingFunction: true,
      functionDeploymentError: undefined,
    });
    try {
      await this.props.projectStateService.createCloudFunction(
        CLOUD_FUNCTION_REGION
      );
      const newProjectState: ProjectState = { ...this.state.projectState };
      newProjectState.hasCloudFunction = true;
      this.setState({
        isDeployingFunction: false,
        projectState: newProjectState,
      });
      return true;
    } catch (err) {
      this.setState({
        isDeployingFunction: false,
        functionDeploymentError: `${err}: Unable to create Cloud Function`,
      });
    }
    return false;
  }

  private async _onInitialize() {
    const { projectState, enableRecurring } = this.state;
    const createResourcePromises: Promise<boolean>[] = [];

    const toEnable = this._getServicesToActivate(projectState)
      .filter(s => !s.enabled)
      .map(s => s.service.endpoint);
    let areServicesEnabled = toEnable.length === 0;
    if (toEnable.length) {
      areServicesEnabled = await this._enableServices(toEnable);
    }

    if (areServicesEnabled) {
      if (!projectState.hasGcsBucket) {
        createResourcePromises.push(this._createGcsBucket());
      } else {
        createResourcePromises.push(Promise.resolve(true));
      }

      if (enableRecurring && !projectState.hasCloudFunction) {
        createResourcePromises.push(this._deployCloudFunction());
      }

      const results = await Promise.all(createResourcePromises);
      if (results.every(r => r)) {
        // Set the state to force a re-render, then refetch from the server
        const newProjectState: ProjectState = { ...this.state.projectState };
        newProjectState.canSubmitImmediateJobs = true;
        this.setState({ projectState: newProjectState });
        this._setProjectState();
      }
    }
  }

  private _getServicesToActivate(projectState: ProjectState) {
    return projectState.serviceStatuses.filter(
      s => this.state.enableRecurring || !s.service.isOptional
    );
  }
}
