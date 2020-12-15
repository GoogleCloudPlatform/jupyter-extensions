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
import { FormikBag, FormikProps, withFormik } from 'formik';
import {
  css,
  FieldError,
  Message,
  SelectInput,
  SubmitButton,
  TextInput,
  ToggleSwitch,
} from 'gcp_jupyterlab_shared';
import { stylesheet } from 'typestyle';
import { getNextExecutionDate } from '../cron';
import * as React from 'react';
import { CloudBucketSelector } from './cloud_bucket';
import { GcpService } from '../service/gcp';
import { ExecuteNotebookRequest } from '../interfaces';
import { GetPermissionsResponse } from '../service/project_state';
import {
  GcpSettings,
  OnDialogClose,
  OnScheduleTypeChange,
  OnShowFormChange,
} from './dialog';
import { ScheduleBuilder } from './schedule_builder/schedule_builder';
import { ActionBar } from './action_bar';
import { SchedulerDescription } from './scheduler_description';
import { SubmittedJob } from './submitted_job';

import {
  ENVIRONMENT_IMAGES,
  CUSTOM,
  MASTER_TYPES,
  REGIONS,
  SCALE_TIERS,
  SCHEDULE_TYPES,
  SINGLE,
  RECURRING,
  getAcceleratorTypes,
  ACCELERATOR_COUNTS_1_2_4_8,
  Option,
  CUSTOM_CONTAINER,
} from '../data';

type Error = { [key: string]: string };

// Top-level form status object used for passing information from a submission
interface Status {
  asError?: boolean;
  message: string;
  lastSubmitted?: {
    request: ExecuteNotebookRequest;
    schedule?: string;
  };
}

interface Props {
  gcpService: GcpService;
  gcpSettings: GcpSettings;
  notebookName: string;
  notebook: INotebookModel;
  permissions: GetPermissionsResponse;
  onDialogClose: OnDialogClose;
  settings: ISettingRegistry.ISettings;
  onScheduleTypeChange: OnScheduleTypeChange;
  onShowFormChange: OnShowFormChange;
}

interface SchedulerFormValues {
  name: string;
  region: string;
  scaleTier: string;
  masterType?: string;
  imageUri: string;
  customContainerImageUri?: string;
  scheduleType: string;
  gcsBucket: string;
  schedule?: string;
  acceleratorType?: string;
  acceleratorCount?: string;
}

interface ScheduleBuilderState {
  useUnixCronFormat?: boolean;
}

type SchedulerFormProps = Props & FormikProps<SchedulerFormValues>;

const SCALE_TIER_LINK =
  'https://cloud.google.com/ai-platform/training/docs/machine-types#scale_tiers';
const IAM_MESSAGE = 'The following IAM permissions are missing';

// Build a unique name from the opened Notebook and current timestamp
function getName(notebookName: string) {
  const sliceStart =
    notebookName.lastIndexOf('/') === -1
      ? 0
      : notebookName.lastIndexOf('/') + 1;
  let name = notebookName
    .slice(sliceStart, notebookName.lastIndexOf('.'))
    .toLowerCase()
    .replace(/[^a-zA-Z0-9_]/g, '_');
  const firstCharCode = name.charCodeAt(0);
  // Add letter if first character is not a letter
  if (firstCharCode < 97 || firstCharCode > 122) {
    name = `a${name}`;
  }
  return `${name}__${Date.now()}`;
}

const localStyles = stylesheet({
  scroll: {
    maxHeight: '52vh',
    overflowY: 'scroll',
    overflowX: 'hidden',
    borderTop: '0px solid #777',
    borderBottom: '0px solid #777',
  },
});

/**
 * Inner form used for Scheduling wrapped by Formik
 */
export class InnerSchedulerForm extends React.Component<
  SchedulerFormProps,
  ScheduleBuilderState
> {
  private missingPermissions: string[];
  private acceleratorTypeOptions: Option[];

  constructor(props: SchedulerFormProps) {
    super(props);

    this.missingPermissions = this.props.permissions.toExecute;
    this.acceleratorTypeOptions = getAcceleratorTypes(
      this.props.values.masterType
    );
    this.state = { useUnixCronFormat: false };
    this._onScaleTierChanged = this._onScaleTierChanged.bind(this);
    this._onScheduleTypeChange = this._onScheduleTypeChange.bind(this);
    this._onMasterTypeChanged = this._onMasterTypeChanged.bind(this);
    this._onAcceleratorTypeChange = this._onAcceleratorTypeChange.bind(this);
    this._onFormReset = this._onFormReset.bind(this);
    this.updateCronSchedule = this.updateCronSchedule.bind(this);
    this.updateGcsBucket = this.updateGcsBucket.bind(this);
  }

  updateCronSchedule(newSchedule: string) {
    this.props.setFieldValue('schedule', newSchedule, false);
  }

  updateGcsBucket(gcsBucketName: string) {
    this.props.setFieldValue('gcsBucket', gcsBucketName, false);
  }

  componentDidMount() {
    this.prepopulateImageUri();
  }

  private updateImageUri(imageUri: string) {
    this.props.setFieldValue('imageUri', imageUri, false);
  }

  private prepopulateImageUri() {
    this.props.gcpService.getImageUri().then((retrievedImageUri: string) => {
      if (retrievedImageUri || this.props.values.imageUri) {
        const imageUri = retrievedImageUri
          ? retrievedImageUri
          : this.props.values.imageUri;
        const lastColonIndex = imageUri.lastIndexOf(':');
        const matchImageUri =
          lastColonIndex !== -1 ? imageUri.substr(0, lastColonIndex) : imageUri;
        const matched = ENVIRONMENT_IMAGES.find(i => {
          return String(i.value).startsWith(matchImageUri);
        });
        if (matched) {
          this.updateImageUri(String(matched.value));
        } else {
          this.updateImageUri(String(CUSTOM_CONTAINER.value));
          this.props.setFieldValue('customContainerImageUri', imageUri, false);
        }
      } else {
        this.updateImageUri(String(ENVIRONMENT_IMAGES[1].value));
      }
    });
  }

  render() {
    const {
      values,
      submitForm,
      handleChange,
      isSubmitting,
      errors,
    } = this.props;
    const status: Status = this.props.status;
    if (status && !!status.lastSubmitted) {
      return this.getSubmittedJobElement(status);
    }

    return (
      <form>
        <SchedulerDescription />
        <p className={css.heading}>Notebook: {this.props.notebookName}</p>
        <div className={localStyles.scroll}>
          <TextInput
            label={
              values.scheduleType === RECURRING
                ? 'Schedule name'
                : 'Execution name'
            }
            name="name"
            value={values.name}
            hasError={!!errors.name}
            onChange={handleChange}
          />
          <FieldError message={errors.name} />
          <SelectInput
            label="Region"
            name="region"
            value={values.region}
            options={REGIONS}
            onChange={handleChange}
          />
          <CloudBucketSelector
            gcsBucket={
              values.gcsBucket ? values.gcsBucket.slice(5) : values.gcsBucket
            }
            onGcsBucketChange={this.updateGcsBucket}
            gcpService={this.props.gcpService}
          />
          <SelectInput
            label="Scale tier"
            name="scaleTier"
            value={values.scaleTier}
            options={SCALE_TIERS}
            formHelperText="A scale tier is a predefined set of machines allocated to your notebook execution."
            formHelperLink={SCALE_TIER_LINK}
            formHelperLinkText="Learn more about scale tiers"
            onChange={this._onScaleTierChanged}
          />
          {values.scaleTier === CUSTOM && (
            <SelectInput
              label="Machine type"
              name="masterType"
              value={values.masterType}
              options={MASTER_TYPES}
              onChange={this._onMasterTypeChanged}
            />
          )}
          {values.scaleTier === CUSTOM && (
            <div className={css.scheduleBuilderRow}>
              <div className={css.flex1}>
                <SelectInput
                  label="Accelerator type"
                  name="acceleratorType"
                  value={values.acceleratorType}
                  options={this.acceleratorTypeOptions}
                  onChange={this._onAcceleratorTypeChange}
                />
              </div>
              <div className={css.flex1}>
                {values.acceleratorType && (
                  <SelectInput
                    label="Accelerator count"
                    name="acceleratorCount"
                    value={values.acceleratorCount}
                    options={ACCELERATOR_COUNTS_1_2_4_8}
                    onChange={handleChange}
                  />
                )}
              </div>
            </div>
          )}
          <SelectInput
            label="Environment"
            name="imageUri"
            value={values.imageUri}
            options={ENVIRONMENT_IMAGES}
            onChange={handleChange}
          />
          {values.imageUri === CUSTOM_CONTAINER.value && (
            <span>
              <TextInput
                label="Docker container image"
                name="customContainerImageUri"
                value={values.customContainerImageUri}
                placeholder="Docker container image uri"
                hasError={!!errors.customContainerImageUri}
                onChange={handleChange}
              />
              <FieldError message={errors.customContainerImageUri} />
            </span>
          )}
          <SelectInput
            label="Type"
            name="scheduleType"
            value={values.scheduleType}
            options={SCHEDULE_TYPES}
            onChange={this._onScheduleTypeChange}
          />

          {values.scheduleType === RECURRING && (
            <ScheduleBuilder
              schedule={values.schedule}
              onScheduleChange={this.updateCronSchedule}
              useUnixCronFormat={this.state.useUnixCronFormat}
            />
          )}
          {values.scheduleType === RECURRING && (
            <ToggleSwitch
              name="useUnixCronFormat"
              checked={this.state.useUnixCronFormat}
              label={
                this.state.useUnixCronFormat
                  ? 'Use user-friendly scheduler'
                  : 'Use unix-cron format'
              }
              onChange={e =>
                this.setState({ useUnixCronFormat: e.target.checked })
              }
            />
          )}
        </div>
        <ActionBar
          onDialogClose={this.props.onDialogClose}
          closeLabel="Cancel"
          displayMessage={
            values.scheduleType === RECURRING
              ? getNextExecutionDate(values.schedule)
              : 'Execution will start immediately after being submitted'
          }
          error={
            <span>
              {status && !status.lastSubmitted && (
                <Message
                  asActivity={isSubmitting}
                  asError={status.asError}
                  text={status.message}
                />
              )}
              {errors && errors.gcsBucket && (
                <Message
                  asActivity={false}
                  asError={true}
                  text={errors.gcsBucket}
                />
              )}
              {this.missingPermissions.length > 0 && (
                <Message
                  asError={true}
                  text={`${IAM_MESSAGE}: ${this.missingPermissions.join(', ')}`}
                />
              )}
            </span>
          }
        >
          {this.missingPermissions.length === 0 && (
            <SubmitButton
              actionPending={isSubmitting}
              onClick={submitForm}
              text="Submit"
            />
          )}
        </ActionBar>
      </form>
    );
  }

  private _onMasterTypeChanged(e: React.ChangeEvent<HTMLInputElement>) {
    this.acceleratorTypeOptions = getAcceleratorTypes(e.target.value);
    const { handleChange, setFieldValue } = this.props;
    setFieldValue(
      'acceleratorType',
      e.target.value === '' ? '' : this.acceleratorTypeOptions[0].value,
      false
    );
    setFieldValue('acceleratorCount', '', false);
    handleChange(e);
  }

  private _onScaleTierChanged(e: React.ChangeEvent<HTMLInputElement>) {
    const { handleChange, setFieldValue } = this.props;
    const isCustom = e.target.value === CUSTOM;
    if (isCustom) {
      this.acceleratorTypeOptions = getAcceleratorTypes(
        MASTER_TYPES[0].value as string
      );
    }

    setFieldValue('masterType', isCustom ? MASTER_TYPES[0].value : '', false);
    setFieldValue(
      'acceleratorType',
      isCustom ? this.acceleratorTypeOptions[0].value : '',
      false
    );
    setFieldValue('acceleratorCount', '', false);

    handleChange(e);
  }

  private _onScheduleTypeChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { handleChange, setFieldValue, onScheduleTypeChange } = this.props;
    const value = e.target.value;
    this.missingPermissions =
      value === RECURRING
        ? this.props.permissions.toSchedule
        : this.props.permissions.toExecute;
    setFieldValue('scheduleType', value);
    handleChange(e);
    onScheduleTypeChange(value !== RECURRING);
  }

  private _onAcceleratorTypeChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { handleChange, setFieldValue } = this.props;
    const value = e.target.value;
    const count = value ? ACCELERATOR_COUNTS_1_2_4_8[0].value : '';
    setFieldValue('acceleratorCount', count);
    handleChange(e);
  }

  private _onFormReset() {
    this.props.setStatus(undefined);
    this.props.setFieldValue('name', getName(this.props.notebookName));
    this.props.setFieldValue(
      'gcsBucket',
      this.props.gcpSettings.gcsBucket || ''
    );
    this.props.onShowFormChange(true);
  }

  private getSubmittedJobElement(status: Status) {
    const { gcpSettings, onDialogClose } = this.props;
    return (
      <SubmittedJob
        request={status.lastSubmitted!.request}
        projectId={gcpSettings.projectId}
        schedule={status.lastSubmitted!.schedule}
        onDialogClose={onDialogClose}
        onFormReset={this._onFormReset}
      />
    );
  }
} // end InnerSchedulerForm

function updateSettingsFromRequest(
  request: ExecuteNotebookRequest,
  settings: ISettingRegistry.ISettings
) {
  const promises: Promise<void>[] = [];
  if (settings.get('region').composite !== request.region) {
    promises.push(settings.set('region', request.region));
  }
  if (settings.get('scaleTier').composite !== request.scaleTier) {
    promises.push(settings.set('scaleTier', request.scaleTier));
  }
  if (settings.get('gcsBucket').composite !== request.gcsBucket) {
    promises.push(settings.set('gcsBucket', request.gcsBucket));
  }
  if (settings.get('masterType').composite !== request.masterType) {
    promises.push(settings.set('masterType', request.masterType));
  }
  if (settings.get('acceleratorType').composite !== request.acceleratorType) {
    promises.push(settings.set('acceleratorType', request.acceleratorType));
  }
  if (settings.get('acceleratorCount').composite !== request.acceleratorCount) {
    promises.push(settings.set('acceleratorCount', request.acceleratorCount));
  }
  if (settings.get('environmentImage').composite !== request.imageUri) {
    promises.push(settings.set('environmentImage', request.imageUri));
  }
  Promise.all(promises).catch(err => {
    console.warn(`Unable to save ${promises.length} settings`, err);
  });
}

/** Handles the form Submission to AI Platform */
async function submit(
  values: SchedulerFormValues,
  formikBag: FormikBag<Props, SchedulerFormValues>
) {
  const {
    name,
    imageUri,
    customContainerImageUri,
    masterType,
    scaleTier,
    scheduleType,
    region,
    schedule,
    acceleratorType,
    acceleratorCount,
  } = values;
  const {
    gcpService,
    notebook,
    notebookName,
    settings,
    onShowFormChange,
  } = formikBag.props;
  const { setStatus, setSubmitting } = formikBag;

  const gcsBucket = values.gcsBucket.includes('gs://')
    ? values.gcsBucket
    : 'gs://' + values.gcsBucket;
  const gcsFolder = `${gcsBucket}/${name}`;
  const inputNotebookGcsPath = `${gcsFolder}/${notebookName}`;
  const outputNotebookFolder = gcsFolder;
  const request: ExecuteNotebookRequest = {
    name,
    imageUri:
      imageUri === String(CUSTOM_CONTAINER.value)
        ? customContainerImageUri
        : imageUri,
    inputNotebookGcsPath,
    masterType,
    outputNotebookFolder,
    scaleTier,
    gcsBucket,
    region,
    acceleratorType,
    acceleratorCount,
  };
  const status: Status = {
    asError: false,
    message: `Uploading ${notebookName} to ${request.inputNotebookGcsPath}`,
  };

  setStatus(status);
  try {
    await gcpService.uploadNotebook(
      notebook.toString(),
      request.inputNotebookGcsPath
    );
  } catch (err) {
    status.asError = true;
    status.message = `${err}: Unable to upload ${notebookName} to ${request.inputNotebookGcsPath}`;
    setStatus(status);
    setSubmitting(false);
    return;
  }

  try {
    if (scheduleType === RECURRING && schedule) {
      status.message = 'Submitting schedule';
      setStatus(status);
      const response = await gcpService.scheduleNotebook(request, schedule);
      if (!response.error) {
        status.lastSubmitted = { request, schedule };
      } else {
        status.asError = true;
        status.message = `${response.error}: Unable to submit schedule`;
      }
    } else {
      status.message = 'Submitting execution';
      setStatus(status);
      const response = await gcpService.executeNotebook(request);
      if (!response.error) {
        status.lastSubmitted = { request };
      } else {
        status.asError = true;
        status.message = `${response.error}: Unable to submit execution`;
      }
    }
    updateSettingsFromRequest(request, settings);
  } catch (err) {
    status.asError = true;
    status.message = `${err}: Unable to submit ${
      scheduleType === RECURRING && schedule ? 'schedule' : 'execution'
    }`;
  }
  setStatus(status);
  setSubmitting(false);
  onShowFormChange(!(status && !!status.lastSubmitted));
}

function mapPropsToValues(props: Props) {
  return {
    name: getName(props.notebookName),
    imageUri:
      props.gcpSettings.environmentImage || String(ENVIRONMENT_IMAGES[1].value),
    region: props.gcpSettings.region || String(REGIONS[0].value),
    scaleTier: props.gcpSettings.scaleTier || String(SCALE_TIERS[0].value),
    masterType: props.gcpSettings.masterType || '',
    acceleratorType: props.gcpSettings.acceleratorType || '',
    acceleratorCount: props.gcpSettings.acceleratorCount || '',
    scheduleType: SINGLE,
    schedule: '',
    gcsBucket: props.gcpSettings.gcsBucket || '',
  };
}

function validate(values: SchedulerFormValues) {
  const {
    name,
    scheduleType,
    schedule,
    gcsBucket,
    imageUri,
    customContainerImageUri,
  } = values;
  const error: Error = {};

  if (!name) {
    error.name = 'Execution name is required';
  } else if (!name.match(/^[a-zA-Z0-9_]*$/g)) {
    error.name =
      'Execution name can only contain letters, numbers, or underscores.';
  }

  if (scheduleType === RECURRING && !schedule) {
    error.schedule = 'Frequency is required';
  }

  if (!gcsBucket) {
    error.gcsBucket = 'A cloud storage bucket is required to store results';
  }

  if (imageUri === String(CUSTOM_CONTAINER.value)) {
    if (!customContainerImageUri) {
      error.customContainerImageUri =
        'A docker container image must be provided for a custom container';
    }
  }
  return error;
}

/** Form Component to submit Scheduled Notebooks */
export const SchedulerForm = withFormik<Props, SchedulerFormValues>({
  mapPropsToValues,
  handleSubmit: submit,
  validate,
})(InnerSchedulerForm);
