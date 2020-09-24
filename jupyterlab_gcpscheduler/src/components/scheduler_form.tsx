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
  LearnMoreLink,
  Message,
  SelectInput,
  SubmitButton,
  TextInput,
  ToggleSwitch,
} from 'gcp_jupyterlab_shared';
import * as React from 'react';

import { GcpService, RunNotebookRequest } from '../service/gcp';
import { GetPermissionsResponse } from '../service/project_state';
import { GcpSettings, OnDialogClose } from './dialog';
import { ScheduleBuilder } from './schedule_builder/schedule_builder';
import { ActionBar } from './action_bar';
import { SchedulerDescription } from './scheduler_description';
import { SubmittedJob } from './submitted_job';

import {
  CONTAINER_IMAGES,
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
} from '../data';

type Error = { [key: string]: string };

// Top-level form status object used for passing information from a submission
interface Status {
  asError?: boolean;
  message: string;
  lastSubmitted?: {
    request: RunNotebookRequest;
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
}

interface SchedulerFormValues {
  jobId: string;
  region: string;
  scaleTier: string;
  masterType?: string;
  imageUri: string;
  scheduleType: string;
  schedule?: string;
  acceleratorType?: string;
  acceleratorCount?: string;
}

interface ScheduleBuilderState {
  useAdvancedScheduler?: boolean;
}

type SchedulerFormProps = Props & FormikProps<SchedulerFormValues>;

const SCALE_TIER_LINK =
  'https://cloud.google.com/ai-platform/training/docs/machine-types#scale_tiers';
const IAM_MESSAGE = 'The following IAM permissions are missing';

// Build a unique jobId from the opened Notebook and current timestamp
function getJobId(notebookName: string) {
  const sliceStart =
    notebookName.lastIndexOf('/') === -1
      ? 0
      : notebookName.lastIndexOf('/') + 1;
  let jobId = notebookName
    .slice(sliceStart, notebookName.lastIndexOf('.'))
    .toLowerCase()
    .replace(/[^a-zA-Z0-9_]/g, '_');
  const firstCharCode = jobId.charCodeAt(0);
  // Add letter if first character is not a letter
  if (firstCharCode < 97 || firstCharCode > 122) {
    jobId = `a${jobId}`;
  }
  return `${jobId}__${Date.now()}`;
}

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
    this.state = { useAdvancedScheduler: false };
    this._onScaleTierChanged = this._onScaleTierChanged.bind(this);
    this._onScheduleTypeChange = this._onScheduleTypeChange.bind(this);
    this._onMasterTypeChanged = this._onMasterTypeChanged.bind(this);
    this._onAcceleratorTypeChange = this._onAcceleratorTypeChange.bind(this);
    this._onFormReset = this._onFormReset.bind(this);
    this.updateCronSchedule = this.updateCronSchedule.bind(this);
  }

  updateCronSchedule(newSchedule: string) {
    this.props.setFieldValue('schedule', newSchedule, false);
  }

  componentDidMount() {
    this.prepopulateImageUri();
  }

  private prepopulateImageUri() {
    this.props.gcpService.getImageUri().then((imageUri: string) => {
      if (imageUri) {
        const matched = CONTAINER_IMAGES.find(i => {
          return String(i.value).indexOf(imageUri) === 0;
        });
        this.props.setFieldValue(
          'imageUri',
          matched ? matched.value : String(CONTAINER_IMAGES[0].value),
          false
        );
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
    const scheduleTypes = SCHEDULE_TYPES.filter(
      t => !!this.props.gcpSettings.schedulerRegion || t.value === SINGLE
    );

    return (
      <form>
        <SchedulerDescription />
        <p className={css.bold}>Notebook: {this.props.notebookName}</p>
        <TextInput
          label="Run name"
          name="jobId"
          value={values.jobId}
          hasError={!!errors.jobId}
          onChange={handleChange}
        />
        <FieldError message={errors.jobId} />
        <SelectInput
          label="Region"
          name="region"
          value={values.region}
          options={REGIONS}
          onChange={handleChange}
        />
        <SelectInput
          label="Scale tier"
          name="scaleTier"
          value={values.scaleTier}
          options={SCALE_TIERS}
          onChange={this._onScaleTierChanged}
        />
        <p className={css.noTopMargin}>
          A scale tier is a predefined cluster specification.
          <LearnMoreLink href={SCALE_TIER_LINK} />
        </p>
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
          label="Container"
          name="imageUri"
          value={values.imageUri}
          options={CONTAINER_IMAGES}
          onChange={handleChange}
        />
        <SelectInput
          label="Type"
          name="scheduleType"
          value={values.scheduleType}
          options={scheduleTypes}
          onChange={this._onScheduleTypeChange}
        />

        {values.scheduleType === RECURRING && (
          <ScheduleBuilder
            schedule={values.schedule}
            onScheduleChange={this.updateCronSchedule}
            useAdvancedSchedule={this.state.useAdvancedScheduler}
          />
        )}
        {status && !status.lastSubmitted && (
          <Message
            asActivity={isSubmitting}
            asError={status.asError}
            text={status.message}
          />
        )}
        {this.missingPermissions.length > 0 && (
          <Message
            asError={true}
            text={`${IAM_MESSAGE}: ${this.missingPermissions.join(', ')}`}
          />
        )}
        <div className={css.row}>
          <div className={css.flex1}>
            {values.scheduleType === RECURRING && (
              <ToggleSwitch
                name="useAdvancedScheduler"
                checked={this.state.useAdvancedScheduler}
                label={
                  this.state.useAdvancedScheduler
                    ? 'Use user-friendly scheduler'
                    : 'Use advanced scheduler'
                }
                onChange={e =>
                  this.setState({ useAdvancedScheduler: e.target.checked })
                }
              />
            )}
          </div>
          <div>
            <ActionBar
              onDialogClose={this.props.onDialogClose}
              closeLabel="Cancel"
            >
              {this.missingPermissions.length === 0 && (
                <SubmitButton
                  actionPending={isSubmitting}
                  onClick={submitForm}
                  text="Submit"
                />
              )}
            </ActionBar>
          </div>
        </div>
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
    const { handleChange, setFieldValue } = this.props;
    const value = e.target.value;
    this.missingPermissions =
      value === RECURRING
        ? this.props.permissions.toSchedule
        : this.props.permissions.toExecute;
    setFieldValue('scheduleType', value);
    handleChange(e);
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
    this.props.setFieldValue('jobId', getJobId(this.props.notebookName));
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
  request: RunNotebookRequest,
  settings: ISettingRegistry.ISettings
) {
  const promises: Promise<void>[] = [];
  if (settings.get('jobRegion').composite !== request.region) {
    promises.push(settings.set('jobRegion', request.region));
  }
  if (settings.get('scaleTier').composite !== request.scaleTier) {
    promises.push(settings.set('scaleTier', request.scaleTier));
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
  if (settings.get('containerImage').composite !== request.imageUri) {
    promises.push(settings.set('containerImage', request.imageUri));
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
    jobId,
    imageUri,
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
    gcpSettings,
    notebook,
    notebookName,
    settings,
  } = formikBag.props;
  const { setStatus, setSubmitting } = formikBag;

  const gcsFolder = `${gcpSettings.gcsBucket}/${jobId}`;
  const inputNotebookGcsPath = `${gcsFolder}/${notebookName}`;
  const outputNotebookGcsPath = `${gcsFolder}/${jobId}.ipynb`;
  const request: RunNotebookRequest = {
    jobId,
    imageUri,
    inputNotebookGcsPath,
    masterType,
    outputNotebookGcsPath,
    scaleTier,
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
      status.message = 'Submitting Job to Cloud Scheduler';
      setStatus(status);
      await gcpService.scheduleNotebook(
        request,
        gcpSettings.schedulerRegion,
        schedule
      );
      status.lastSubmitted = { request, schedule };
    } else {
      status.message = 'Submitting Job to AI Platform';
      setStatus(status);
      await gcpService.runNotebook(request);
      status.lastSubmitted = { request };
    }
    updateSettingsFromRequest(request, settings);
  } catch (err) {
    status.asError = true;
    status.message = `${err}: Unable to submit job`;
  }
  setStatus(status);
  setSubmitting(false);
}

function mapPropsToValues(props: Props) {
  return {
    jobId: getJobId(props.notebookName),
    imageUri:
      props.gcpSettings.containerImage || String(CONTAINER_IMAGES[0].value),
    region: props.gcpSettings.jobRegion || String(REGIONS[0].value),
    scaleTier: props.gcpSettings.scaleTier || String(SCALE_TIERS[0].value),
    masterType: props.gcpSettings.masterType || '',
    acceleratorType: props.gcpSettings.acceleratorType || '',
    acceleratorCount: props.gcpSettings.acceleratorCount || '',
    scheduleType: SINGLE,
    schedule: '',
  };
}

function validate(values: SchedulerFormValues) {
  const { jobId, scheduleType, schedule } = values;
  const error: Error = {};

  if (!jobId) {
    error.jobId = 'Run name is required';
  } else if (!jobId.match(/^[a-zA-Z0-9_]*$/g)) {
    error.jobId = 'Run name can only contain letters, numbers, or underscores.';
  }

  if (scheduleType === RECURRING && !schedule) {
    error.schedule = 'Frequency is required';
  }

  return error;
}

/** Form Component to submit Scheduled Notebooks */
export const SchedulerForm = withFormik<Props, SchedulerFormValues>({
  mapPropsToValues,
  handleSubmit: submit,
  validate,
})(InnerSchedulerForm);
