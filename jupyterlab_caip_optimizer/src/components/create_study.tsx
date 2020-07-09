import * as React from 'react';
import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';
import TextField from '@material-ui/core/TextField';
import MenuItem from '@material-ui/core/MenuItem';
import { Box, Button, Paper, Chip } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import * as Types from '../types';

/**
 * Checkout: https://github.com/mui-org/material-ui/blob/master/docs/src/pages/getting-started/templates/sign-in/SignIn.js
 */

const useStyles = makeStyles(theme => ({
  chipBox: {
    display: 'flex',
    justifyContent: 'center',
    flexWrap: 'wrap',
    listStyle: 'none',
    padding: theme.spacing(1),
    backgroundColor: '#888888',
    margin: 0,
  },
  chip: {
    margin: theme.spacing(0.5),
  },
}));

interface DropdownItem {
  value: string;
  label: string;
}

type ParameterChip = {
  key: number;
  label: string;
  paramName: string;
  paramType: string;
  paramValList?: string[];
  paramValListString?: string;
  paramMinVal?: string;
  paramMaxVal?: string;
};

type MetricChip = {
  key: number;
  label: string;
  metricName: string;
  metricGoalType: string;
};

const paramChipDataSample: ParameterChip[] = [
  {
    key: 0,
    label: 'Param 1',
    paramName: 'Param 1',
    paramType: 'CATEGORICAL',
    paramValList: ['high', 'medium', 'low'],
  },
  {
    key: 1,
    label: 'Param 2',
    paramName: 'Param 2',
    paramType: 'DOUBLE',
    paramMinVal: '0.0',
    paramMaxVal: '12.5',
    paramValList: [],
  },
];

const metricChipDataSample: MetricChip[] = [
  {
    key: 0,
    label: 'Metric 1',
    metricName: 'Metric 1',
    metricGoalType: Types.GoalType.MAXIMIZE,
  },
  {
    key: 1,
    label: 'Metric 2',
    metricName: 'Metric 2',
    metricGoalType: Types.GoalType.MINIMIZE,
  },
];

const createDropdown = (items: string[]): DropdownItem[] => {
  const dropdownList: DropdownItem[] = items.map(
    (item: string): DropdownItem => {
      return { value: item, label: item };
    }
  );
  return dropdownList;
};
export const CreateStudy = () => {
  const classes = useStyles();
  const [paramType, setParamType] = React.useState('');
  const [paramName, setParamName] = React.useState('');
  const [paramMinVal, setParamMinVal] = React.useState('');
  const [paramMaxVal, setParamMaxVal] = React.useState('');
  const [paramValList, setParamValList] = React.useState([]);
  const [paramValListString, setParamValListString] = React.useState('');
  const [paramNew, setParamNew] = React.useState(true);
  const [paramChipData, setParamChipData] = React.useState(paramChipDataSample); // TODO: change this to empty list. for demo purposes
  const paramTypes: DropdownItem[] = createDropdown(
    Object.values(Types.ParameterType)
  );
  const [metricName, setMetricName] = React.useState('');
  const [metricGoalType, setMetricGoalType] = React.useState('');
  const metricGoalTypes: DropdownItem[] = createDropdown(
    Object.values(Types.GoalType)
  );
  const [metricNew, setMetricNew] = React.useState(true);
  const [metricChipData, setMetricChipData] = React.useState(
    metricChipDataSample
  );
  const [algorithmType, setAlgorithmType] = React.useState('');
  const algorithmTypes: DropdownItem[] = createDropdown(
    Object.values(Types.Algorithm)
  );

  const resetParamState = () => {
    setParamType('');
    setParamName('');
    setParamMinVal('');
    setParamMaxVal('');
    setParamValList([]);
    setParamValListString('');
    setParamNew(true);
  };

  const resetMetricState = () => {
    setMetricGoalType('');
    setMetricName('');
    setMetricNew(true);
  };

  const handleParamValListChange = event => {
    setParamValListString(event.target.value);
    const valueList = event.target.value.split(',').filter(i => i); // to remove empty string
    setParamValList(valueList);
  };

  const handleParamTypeChange = event => {
    const type = event.target.value;
    setParamType(type);
    if (type === 'DOUBLE' || type === 'INTEGER') {
      console.log(type);
      setParamValListString('');
      setParamValList([]);
      return;
    }
    setParamMaxVal('');
    setParamMinVal('');
    return;
  };

  const loadParamData = thisChip => {
    setParamName(thisChip.paramName);
    setParamType(thisChip.paramType);
    thisChip.paramMinVal
      ? setParamMinVal(thisChip.paramMinVal)
      : setParamMinVal('');
    thisChip.paramMaxVal
      ? setParamMaxVal(thisChip.paramMaxVal)
      : setParamMaxVal('');
    if (thisChip.paramValList) {
      setParamValList(thisChip.paramValList);
      setParamValListString(thisChip.paramValList.join(','));
    }
    setParamNew(false);
  };

  const loadMetricData = thisChip => {
    setMetricName(thisChip.metricName);
    setMetricGoalType(thisChip.metricGoalType);
    setMetricNew(false);
  };

  const getCurrentParamChip = (key?: number): ParameterChip => {
    return {
      key: key ? key : paramChipData.length,
      label: paramName,
      paramName,
      paramType,
      paramMinVal: paramMinVal ? paramMinVal : '',
      paramMaxVal: paramMaxVal ? paramMaxVal : '',
      paramValList: paramValList ? paramValList : [],
      paramValListString: paramValListString ? paramValListString : '',
    };
  };

  const getCurrentMetricChip = (key?: number): MetricChip => {
    return {
      key: key ? key : metricChipData.length,
      label: metricName,
      metricName,
      metricGoalType,
    };
  };

  const handleParamChipClick = event => {
    const clickedChipLabel = event.target.textContent;
    const thisChip = paramChipData.find(
      chip => chip.paramName === clickedChipLabel
    );
    loadParamData(thisChip);
  };

  const handleMetricChipClick = event => {
    const clickedChipLabel = event.target.textContent;
    const thisChip = metricChipData.find(
      chip => chip.metricName === clickedChipLabel
    );
    loadMetricData(thisChip);
  };

  const handleAddParam = () => {
    setParamChipData([...paramChipData, getCurrentParamChip()]);
    resetParamState();
  };

  const handleSaveParam = () => {
    const newParamChipData = paramChipData.map(function(chip) {
      return chip.paramName === paramName
        ? getCurrentParamChip(chip.key)
        : chip;
    });
    setParamChipData(newParamChipData);
    resetParamState();
  };

  const handleDeleteParam = () => {
    const newParamChipData = paramChipData.filter(
      chip => chip.paramName !== paramName
    );
    setParamChipData(newParamChipData);
    resetParamState();
  };

  const handleAddMetric = () => {
    setMetricChipData([...metricChipData, getCurrentMetricChip()]);
    resetMetricState();
  };

  const handleSaveMetric = () => {
    const newMetricChipData = metricChipData.map(function(chip) {
      return chip.metricName === metricName
        ? getCurrentMetricChip(chip.key)
        : chip;
    });
    setMetricChipData(newMetricChipData);
    resetMetricState();
  };

  const handleDeleteMetric = () => {
    const newMetricChipData = metricChipData.filter(
      chip => chip.metricName !== metricName
    );
    setMetricChipData(newMetricChipData);
    resetMetricState();
  };

  // const debug = event => {
  //   console.log(paramValList);
  //   console.log(paramValListString);
  //   setChipData([]);
  // };

  return (
    <Box m={5}>
      <React.Fragment>
        <Grid container spacing={3}>
          <Grid container item xs={12}>
            <Typography variant="h5" gutterBottom>
              Create New Study
            </Typography>
          </Grid>
          <Grid container item xs={12}>
            <TextField
              required
              variant="outlined"
              id="studyName"
              name="studyName"
              label="Study Name"
              fullWidth
            />
          </Grid>
          <Grid container item spacing={1} xs={12} md={6}>
            <Typography align="center" variant="h6" gutterBottom>
              Parameter Configuration
            </Typography>
            <Grid item xs={12}>
              <TextField
                required
                variant="outlined"
                id="paramName"
                name="paramName"
                label="Parameter Name"
                fullWidth
                value={paramName}
                onChange={e => setParamName(e.target.value)}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                id="paramType"
                variant="outlined"
                select
                label="Parameter Type"
                value={paramType}
                onChange={handleParamTypeChange}
                fullWidth
                required
              >
                {paramTypes.map(option => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={6}>
              <TextField
                required
                id="paramMinVal"
                variant="outlined"
                name="paramMinVal"
                label="Min Value"
                helperText="For Double and Integer types."
                fullWidth
                disabled={paramType !== 'INTEGER' && paramType !== 'DOUBLE'}
                value={paramMinVal}
                onChange={e => setParamMinVal(e.target.value)}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                required
                id="paramMaxVal"
                variant="outlined"
                name="paramMaxVal"
                label="Max Value"
                fullWidth
                disabled={paramType !== 'INTEGER' && paramType !== 'DOUBLE'}
                value={paramMaxVal}
                onChange={e => setParamMaxVal(e.target.value)}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                required
                id="paramVals"
                variant="outlined"
                name="paramVals"
                label="List of possible values"
                helperText="For Categorical and Discrete types. Separate values by comma (e.g. 1,2,3,4,5)"
                fullWidth
                disabled={
                  paramType !== 'CATEGORICAL' && paramType !== 'DISCRETE'
                }
                value={paramValListString}
                onChange={handleParamValListChange}
              />
            </Grid>
            <Grid container item justify="space-evenly" xs={12}>
              <Button
                color="primary"
                disabled={paramNew}
                onClick={handleSaveParam}
              >
                SAVE PARAM
              </Button>
              <Button
                color="primary"
                disabled={paramNew}
                onClick={handleDeleteParam}
              >
                DELETE PARAM
              </Button>
              <Button
                color="primary"
                disabled={
                  !paramType ||
                  !paramName ||
                  (!paramMinVal && !paramMaxVal && paramValList.length === 0) ||
                  !paramNew
                }
                onClick={handleAddParam}
              >
                ADD PARAM
              </Button>
            </Grid>
            <Grid item xs={12}>
              <Paper component="ul" className={classes.chipBox}>
                {paramChipData.map(data => {
                  return (
                    <li key={data.key}>
                      <Chip
                        label={data.label}
                        className={classes.chip}
                        clickable
                        onClick={handleParamChipClick}
                        color={
                          data.label === paramName ? 'secondary' : 'default'
                        }
                      />
                    </li>
                  );
                })}
              </Paper>
            </Grid>
          </Grid>
          <Grid container item spacing={3} xs={12} md={6} alignContent="flex-start">
            <Grid container item spacing={1} alignContent="flex-start">
              <Typography align="center" variant="h6" gutterBottom>
                Metric Configuration
              </Typography>
              <Grid item xs={12}>
                <TextField
                  required
                  variant="outlined"
                  id="metricName"
                  name="metricName"
                  label="Metric Name"
                  fullWidth
                  value={metricName}
                  onChange={e => setMetricName(e.target.value)}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  id="metricGoalType"
                  variant="outlined"
                  select
                  label="Goal Type"
                  value={metricGoalType}
                  onChange={e => setMetricGoalType(e.target.value)}
                  fullWidth
                  required
                >
                  {metricGoalTypes.map(option => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid container item justify="space-evenly" xs={12}>
                <Button
                  color="primary"
                  disabled={metricNew}
                  onClick={handleSaveMetric}
                >
                  SAVE METRIC
                </Button>
                <Button
                  color="primary"
                  disabled={metricNew}
                  onClick={handleDeleteMetric}
                >
                  DELETE METRIC
                </Button>
                <Button
                  color="primary"
                  disabled={!metricName || !metricGoalType || !metricNew}
                  onClick={handleAddMetric}
                >
                  ADD METRIC
                </Button>
              </Grid>
              <Grid item xs={12}>
                <Paper component="ul" className={classes.chipBox}>
                  {metricChipData.map(data => {
                    return (
                      <li key={data.key}>
                        <Chip
                          label={data.label}
                          className={classes.chip}
                          clickable
                          onClick={handleMetricChipClick}
                          color={
                            data.label === metricName ? 'secondary' : 'default'
                          }
                        />
                      </li>
                    );
                  })}
                </Paper>
              </Grid>
            </Grid>
            <Grid container item spacing={1} alignContent="flex-start">
              <Typography align="center" variant="h6" gutterBottom>
                Algorithm
              </Typography>
              <Grid item xs={12}>
                <TextField
                  id="algorithmType"
                  variant="outlined"
                  select
                  label="Algorithm Type"
                  value={algorithmType}
                  onChange={e => setAlgorithmType(e.target.value)}
                  fullWidth
                  required
                >
                  {algorithmTypes.map(option => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
            </Grid>
          </Grid>
          <Grid container item spacing={3} justify="flex-end">
            <Button size="large" variant="contained" color="primary">
              Create Study
            </Button>
          </Grid>
        </Grid>
      </React.Fragment>
    </Box>
  );
};
