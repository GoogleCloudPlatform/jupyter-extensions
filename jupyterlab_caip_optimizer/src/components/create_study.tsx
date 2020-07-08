import * as React from 'react';
import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';
import TextField from '@material-ui/core/TextField';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Checkbox from '@material-ui/core/Checkbox';
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
  paramValString?: string;
  paramMinVal?: string;
  paramMaxVal?: string;
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
  const [chipData, setChipData] = React.useState(paramChipDataSample); // TODO: change this to empty list. for demo purposes
  const paramTypes: DropdownItem[] = createDropdown(
    Object.values(Types.ParameterType)
  );

  const resetState = () => {
    setParamType('');
    setParamName('');
    setParamMinVal('');
    setParamMaxVal('');
    setParamValList([]);
    setParamValListString('');
    setParamNew(true);
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

  const getCurrentChip = (key?: number) => {
    return {
      key: key ? key : chipData.length,
      label: paramName,
      paramName,
      paramType,
      paramMinVal: paramMinVal ? paramMinVal : '',
      paramMaxVal: paramMaxVal ? paramMaxVal : '',
      paramValList: paramValList ? paramValList : [],
      paramValListString: paramValListString ? paramValListString : '',
    };
  };

  const handleChipClick = event => {
    const clickedChipLabel = event.target.textContent;
    const thisChip = chipData.find(chip => chip.paramName === clickedChipLabel);
    loadParamData(thisChip);
  };

  const handleAddParam = () => {
    setChipData([...chipData, getCurrentChip()]);
    resetState();
  };

  const handleSaveParam = () => {
    const newChipData = chipData.map(function(chip) {
      return chip.paramName === paramName ? getCurrentChip(chip.key) : chip;
    });
    setChipData(newChipData);
    resetState();
  };

  const handleDeleteParam = () => {
    const newChipData = chipData.filter(chip => chip.paramName !== paramName);
    setChipData(newChipData);
    resetState();
  };

  // const debug = event => {
  //   console.log(paramValList);
  //   console.log(paramValListString);
  //   setChipData([]);
  // };

  return (
    <Box m={5}>
      <React.Fragment>
        <Typography variant="h5" gutterBottom>
          Create New Study
        </Typography>
        <Grid container spacing={3}>
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
                {chipData.map(data => {
                  return (
                    <li key={data.key}>
                      <Chip
                        label={data.label}
                        className={classes.chip}
                        clickable
                        onClick={handleChipClick}
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
          <Grid container item spacing={1} xs={12} md={6}>
            <Typography align="center" variant="h6" gutterBottom>
              Metric Configuration
            </Typography>
          </Grid>
        </Grid>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Checkbox color="secondary" name="saveAddress" value="yes" />
              }
              label="Use this address for payment details"
            />
          </Grid>
        </Grid>
      </React.Fragment>
    </Box>
  );
};
