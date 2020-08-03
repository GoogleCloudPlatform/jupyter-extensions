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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  FormControlLabel,
  Checkbox,
  TextField,
} from '@material-ui/core';
import { StudyConfig } from '../../types';
import { Loading } from '../misc/loading';
import { prettifyTrial } from '../../service/optimizer';
import { MetricsInputs } from './index';
import { useDispatch } from 'react-redux';
import { completeTrial, addMeasurementTrial } from '../../store/studies';
import {
  metricSpecsToMetrics,
  metricsToMeasurement,
  clearMetrics,
} from './utils';
import { MetricInputs } from './metric_inputs';

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
  const [loading, setLoading] = React.useState(false);
  const [metrics, setMetrics] = React.useState<MetricsInputs>(() =>
    metricSpecsToMetrics(studyConfig.metrics)
  );
  const [finalMeasurement, setFinalMeasurement] = React.useState(true);
  const [infeasible, setInfeasible] = React.useState(false);
  const [infeasibleReason, setInfeasibleReason] = React.useState('');

  const handleClose = () => {
    if (!loading) {
      setMetrics(clearMetrics(metrics));
      close();
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    if (infeasible) {
      await dispatch(
        completeTrial({
          studyName,
          trialName,
          details: {
            trialInfeasible: true,
            infeasibleReason,
          },
        })
      );
    } else if (finalMeasurement) {
      await dispatch(
        completeTrial({
          studyName,
          trialName,
          details: {
            finalMeasurement: metricsToMeasurement(metrics),
          },
        })
      );
    } else {
      await dispatch(
        addMeasurementTrial({
          studyName,
          trialName,
          measurement: metricsToMeasurement(metrics),
        })
      );
    }

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
        <FormControlLabel
          control={
            <Checkbox
              data-testid="finalMeasurement"
              checked={finalMeasurement}
              onChange={event => setFinalMeasurement(event.target.checked)}
              color="primary"
              disabled={infeasible}
            />
          }
          label="Final Measurement"
        />
        <MetricInputs
          metricSpecs={studyConfig.metrics}
          value={metrics}
          onChange={setMetrics}
          disabled={infeasible}
        />
        <FormControlLabel
          control={
            <Checkbox
              data-testid="infeasible"
              checked={infeasible}
              onChange={event => setInfeasible(event.target.checked)}
              color="primary"
            />
          }
          label="Trial Infeasible"
        />
        <TextField
          margin="dense"
          variant="outlined"
          label="Infeasible Reason"
          type="text"
          fullWidth
          value={infeasibleReason}
          onChange={event => setInfeasibleReason(event.target.value)}
          disabled={!infeasible}
          inputProps={{
            'data-testid': 'infeasibleReason',
          }}
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
