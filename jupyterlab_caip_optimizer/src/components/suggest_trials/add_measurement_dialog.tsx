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

import * as React from 'react';
import {
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@material-ui/core';
import { MetricSpec, StudyConfig } from '../../types';
import { Loading } from './loading';
import { prettifyTrial } from '../../service/optimizer';
import { MetricsInputs } from './index';
import { useDispatch } from 'react-redux';
import { completeTrial } from '../../store/studies';
import { metricSpecsToMetrics, metricsToMeasurement } from './utils';

const MetricInputs: React.FC<{
  value: MetricsInputs;
  metricSpecs: MetricSpec[];
  onChange: (metrics: MetricsInputs) => void;
}> = ({ metricSpecs, onChange, value: metrics }) => {
  const handleMetricChange = name => event =>
    onChange({ ...metrics, [name]: event.target.value });

  return (
    <>
      {metricSpecs.map(({ metric }) => (
        <TextField
          key={metric}
          margin="dense"
          variant="outlined"
          label={`"${metric}" Metric`}
          type="text"
          fullWidth
          value={metrics[metric]}
          onChange={handleMetricChange(metric)}
          inputProps={{
            'data-testid': 'metricInput',
          }}
        />
      ))}
    </>
  );
};

function clearMetrics(metrics: MetricsInputs): MetricsInputs {
  return Object.keys(metrics).reduce(
    (prev, metricName) => ({ ...prev, [metricName]: '' }),
    {}
  );
}

interface Props {
  studyName: string;
  studyConfig: StudyConfig;
  trialName: string | null;
  close: () => void;
}

export const AddMeasurementDialog: React.FC<Props> = ({
  studyName,
  studyConfig,
  trialName,
  close,
}) => {
  const dispatch = useDispatch();
  const [metrics, setMetrics] = React.useState<MetricsInputs>(() =>
    metricSpecsToMetrics(studyConfig.metrics)
  );

  const [loading, setLoading] = React.useState(false);

  const handleClose = () => {
    if (!loading) {
      setMetrics(clearMetrics(metrics));
      close();
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    await dispatch(
      completeTrial({
        studyName,
        trialName,
        finalMeasurement: metricsToMeasurement(metrics),
      })
    );
    setLoading(false);
    setMetrics(clearMetrics(metrics));
    close();
  };

  return (
    <Dialog
      open={!!trialName}
      onClose={handleClose}
      style={{ display: 'relative' }}
      data-testid="measurementDialog"
    >
      {!!trialName && (
        <DialogTitle>
          Add Measurement to "{prettifyTrial(trialName)}"
        </DialogTitle>
      )}
      <DialogContent>
        <DialogContentText>Add evaluated trial data.</DialogContentText>
        <MetricInputs
          metricSpecs={studyConfig.metrics}
          value={metrics}
          onChange={setMetrics}
        />
      </DialogContent>
      <DialogActions>
        <Button
          onClick={handleClose}
          color="primary"
          data-testid="measureDialogCancel"
        >
          Cancel
        </Button>
        <Button onClick={handleSubmit} color="primary">
          Submit
        </Button>
      </DialogActions>

      {/* Loading Spinner (position is absolute relative to container) */}
      {loading && <Loading />}
    </Dialog>
  );
};
