import React, { FormEvent } from 'react';
import {
  Box,
  Button,
  Chip,
  TextField,
  MenuItem,
  Grid,
} from '@material-ui/core';
import CloseIcon from '@material-ui/icons/Close';
import { makeStyles } from '@material-ui/core/styles';
import { MetricSpec, GoalType, GoalTypeList } from '../../types';
import { ChipBox, ChipBoxHeader, ChipBoxBody } from '../misc/ChipBox';

const useStyles = makeStyles(theme => ({
  chip: {
    margin: theme.spacing(0.5),
  },
}));

interface Props {
  metrics?: MetricSpec[];
  onChange?: (metrics: MetricSpec[]) => void;
}

export const MetricList: React.FC<Props> = ({ metrics = [], onChange }) => {
  const styles = useStyles();

  // state
  const [editing, setEditing] = React.useState(false);
  const [name, setName] = React.useState('');
  const [goalType, setGoalType] = React.useState<GoalType>(
    'GOAL_TYPE_UNSPECIFIED'
  );

  // functions
  const removeMetric = (name: string) => {
    if (onChange) {
      onChange(metrics.filter(metric => metric.metric !== name));
    }
  };

  const stopEditing = () => {
    setEditing(false);
    setName('');
    setGoalType('GOAL_TYPE_UNSPECIFIED');
  };

  const selectMetric = (name: string) => {
    const found = metrics.find(parameter => parameter.metric === name);
    if (found) {
      setName(found.metric);
      setGoalType(found.goal);
      setEditing(true);
    }
  };

  const addMetric = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (onChange) {
      // type should always match the correct metadata
      const newMetric = { metric: name, goal: goalType } as MetricSpec;

      const existingIndex = metrics.findIndex(metric => metric.metric === name);
      if (existingIndex >= 0) {
        onChange([
          ...metrics.slice(0, existingIndex),
          newMetric,
          ...metrics.slice(existingIndex + 1),
        ]);
      } else {
        onChange([...metrics, newMetric]);
      }
    }
    stopEditing();
  };

  return (
    <ChipBox>
      <ChipBoxHeader>
        {metrics.length === 0 ? (
          <>No metrics set</>
        ) : (
          metrics.map(metric => (
            <li key={metric.metric} data-testid="metricChip">
              <Chip
                className={styles.chip}
                color="primary"
                label={metric.metric}
                onClick={() => selectMetric(metric.metric)}
                deleteIcon={<CloseIcon data-testid="deleteMetric" />}
                onDelete={() => removeMetric(metric.metric)}
              />
            </li>
          ))
        )}
      </ChipBoxHeader>

      <ChipBoxBody>
        {!editing ? (
          <Box display="flex">
            <Box clone m="auto">
              <Button color="primary" onClick={() => setEditing(true)}>
                Add metric
              </Button>
            </Box>
          </Box>
        ) : (
          <form onSubmit={addMetric}>
            <Grid container spacing={3}>
              {/* Metric Name */}
              <Grid item xs={12}>
                <TextField
                  id="metricName"
                  required
                  variant="outlined"
                  label="Metric Name"
                  fullWidth
                  value={name}
                  onChange={event => setName(event.target.value)}
                />
              </Grid>

              {/* Goal Type */}
              <Grid item xs={12}>
                <TextField
                  id="goalType"
                  variant="outlined"
                  select
                  label="Goal Type"
                  value={goalType}
                  SelectProps={{
                    SelectDisplayProps: {
                      // Needed for testing
                      // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
                      // @ts-ignore
                      'data-testid': 'metricGoalType',
                    },
                  }}
                  onChange={event =>
                    setGoalType(event.target.value as GoalType)
                  }
                  fullWidth
                  required
                >
                  {GoalTypeList.map(goalType => (
                    <MenuItem
                      key={goalType}
                      value={goalType}
                      data-testid="goalType"
                    >
                      {goalType}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12}>
                <Box clone mr={2}>
                  <Button color="primary" variant="outlined" type="submit">
                    Save
                  </Button>
                </Box>
                <Button color="primary" onClick={stopEditing}>
                  Cancel
                </Button>
              </Grid>
            </Grid>
          </form>
        )}
      </ChipBoxBody>
    </ChipBox>
  );
};
