import * as React from 'react';
import { MetricsInputs } from '.';
import { MetricSpec } from '../../types';
import { TextField } from '@material-ui/core';

interface Props {
  value: MetricsInputs;
  metricSpecs: MetricSpec[];
  onChange: (metrics: MetricsInputs) => void;
  disabled?: boolean;
}

export const MetricInputs: React.FC<Props> = ({
  metricSpecs,
  onChange,
  value: metrics,
  disabled = false,
}) => {
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
          disabled={disabled}
          inputProps={{
            'data-testid': 'metricInput',
          }}
        />
      ))}
    </>
  );
};
