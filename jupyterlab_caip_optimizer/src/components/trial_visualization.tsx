import React from 'react';
import { Grid, Paper, Radio } from '@material-ui/core';
import { LineGraph } from './graphs/line_graph';
import { Scatterplot } from './graphs/scatterplot';
import { ParallelCoordinates } from './graphs/parallel_coordinates';
import {
  Typography,
  Slider,
  Box,
  Button,
  TextField,
  MenuItem,
  FormControl,
  FormControlLabel,
  RadioGroup,
} from '@material-ui/core/';
import Autocomplete from '@material-ui/lab/Autocomplete';
import { useDispatch, connect } from 'react-redux';
import { fetchTrials } from '../store/studies';
import { setView } from '../store/view';
import * as Types from '../types';
import { styles } from '../utils/styles';

interface Props {
  studyName: string;
  trials: any;
  studyConfig: any;
}

type ContinuousAxisProps = {
  type: string;
  sliderMin: number;
  sliderMax: number;
  minVal: number;
  maxVal: number;
  flip?: boolean;
  goal?: string;
};

type DiscontinousAxisProps = {
  type: string;
  values: number[] | string[];
  sliderMinIndex: number;
  sliderMaxIndex: number;
  minIndex: number;
  maxIndex: number;
};

/**
 * List of all the axisProps.
 * AxisProps is an object that has all the properties of a parameter/metric
 * and is used across all the visualizations.
 */
export interface AxisPropsList {
  trialId: ContinuousAxisProps;
  [key: string]: ContinuousAxisProps | DiscontinousAxisProps;
}

export interface TrialData {
  trialId: number;
  name?: any;
  [key: string]: number | string;
}

/**
 * AxisData needed for parallel coordinates.
 * (PCP is short term for parallel coordinates)
 */
export interface PCPAxisData {
  label: string;
  type: string;
  minVal?: number;
  maxVal?: number;
  values?: string[] | number[];
}

/**
 * Populates list of axis data for parallel coordinates.
 * @param paramLabelList List of parameter names
 * @param metricLabelList List of metric names
 * @param axisPropsList List of axisProps
 */
function createPcpAxisDataList(
  paramLabelList: string[],
  metricLabelList: string[],
  axisPropsList: AxisPropsList
): PCPAxisData[] {
  const pcpAxisDataList = [];
  paramLabelList.forEach(label => {
    const thisAxisProps = axisPropsList[label];
    switch (thisAxisProps.type) {
      case 'DOUBLE':
      case 'INTEGER':
        pcpAxisDataList.push({
          label,
          type: axisPropsList[label].type,
          minVal: 'minVal' in thisAxisProps ? thisAxisProps.minVal : null,
          maxVal: 'maxVal' in thisAxisProps ? thisAxisProps.maxVal : null,
        });
        break;
      case 'CATEGORICAL':
      case 'DISCRETE':
        pcpAxisDataList.push({
          label,
          type: axisPropsList[label].type,
          values: 'values' in thisAxisProps ? thisAxisProps.values : null,
        });
        break;
    }
  });
  metricLabelList.forEach(label => {
    const thisAxisProps = axisPropsList[label];
    pcpAxisDataList.push({
      label,
      type: axisPropsList[label].type,
      minVal: 'minVal' in thisAxisProps ? thisAxisProps.minVal : null,
      maxVal: 'maxVal' in thisAxisProps ? thisAxisProps.maxVal : null,
    });
  });
  return pcpAxisDataList;
}

function getParameterValue(parameter: Types.Parameter) {
  if ('floatValue' in parameter) return parameter.floatValue;
  if ('intValue' in parameter) return parameter.intValue;
  if ('stringValue' in parameter) return parameter.stringValue;
}

/**
 * Creates a list of TrialData objects retrieved from only the completed studies with final measurements
 * as it is impossible to plot the trials with missing final measurement values.
 * @param trials List of all the trials in the study
 */
function createTrialData(completedTrials: Types.Trial[]): TrialData[] {
  return completedTrials.map((trial, i) => {
    const trialData = {
      trialId: i + 1, // starts from 1
    };
    trial.parameters.forEach(param => {
      trialData[param.parameter] = getParameterValue(param);
    });
    trial.finalMeasurement.metrics.forEach(metric => {
      trialData[metric.metric] = metric.value;
    });
    return trialData;
  });
}

/**
 * Retrieves min and max value of all the metrics.
 * This function is needed because we do not have a pre-set min/max values for metrics
 * and thus depend on the actual final measurements of completed trials.
 * @param completedTrials List of completed trials (guranteed to have finalMeasurement)
 */
function findMetricMinMax(completedTrials: Types.Trial[]) {
  const minMaxRecord = {};
  completedTrials.forEach((trial, index) => {
    trial.finalMeasurement.metrics.forEach(metricObject => {
      minMaxRecord[metricObject.metric] =
        index !== 0
          ? {
              min: Math.min(
                minMaxRecord[metricObject.metric]['min'],
                metricObject.value
              ),
              max: Math.max(
                minMaxRecord[metricObject.metric]['max'],
                metricObject.value
              ),
            }
          : {
              min: metricObject.value,
              max: metricObject.value,
            };
    });
  });
  return minMaxRecord;
}

function createAxisPropsList(
  completedTrials: Types.Trial[],
  studyConfig: Types.StudyConfig,
  metricNameList: string[]
): AxisPropsList {
  const axisPropsList = {
    trialId: {
      type: 'INTEGER',
      sliderMin: 1,
      sliderMax: completedTrials.length,
      minVal: 1,
      maxVal: completedTrials.length,
    },
  };
  studyConfig.parameters.forEach(param => {
    switch (param.type) {
      case 'INTEGER':
      case 'DOUBLE':
        /**
         * Due to Optimizer API error (zero-values being erased in studyConfig),
         * default value is set to 0.
         */
        axisPropsList[param.parameter] = {
          type: param.type,
          sliderMin:
            'integerValueSpec' in param && 'minValue' in param.integerValueSpec
              ? Number(param.integerValueSpec.minValue)
              : 'doubleValueSpec' in param &&
                'minValue' in param.doubleValueSpec
              ? param.doubleValueSpec.minValue
              : 0,
          sliderMax:
            'integerValueSpec' in param && 'maxValue' in param.integerValueSpec
              ? Number(param.integerValueSpec.maxValue)
              : 'doubleValueSpec' in param &&
                'maxValue' in param.doubleValueSpec
              ? param.doubleValueSpec.maxValue
              : 0,
          minVal:
            'integerValueSpec' in param && 'minValue' in param.integerValueSpec
              ? Number(param.integerValueSpec.minValue)
              : 'doubleValueSpec' in param &&
                'minValue' in param.doubleValueSpec
              ? param.doubleValueSpec.minValue
              : 0,
          maxVal:
            'integerValueSpec' in param && 'maxValue' in param.integerValueSpec
              ? Number(param.integerValueSpec.maxValue)
              : 'doubleValueSpec' in param &&
                'maxValue' in param.doubleValueSpec
              ? param.doubleValueSpec.maxValue
              : 0,
        };
        break;
      case 'CATEGORICAL':
      case 'DISCRETE':
        axisPropsList[param.parameter] = {
          type: param.type,
          values:
            'categoricalValueSpec' in param
              ? param.categoricalValueSpec.values
              : 'discreteValueSpec' in param
              ? param.discreteValueSpec.values
              : null,
          sliderMinIndex: 0,
          sliderMaxIndex:
            'categoricalValueSpec' in param
              ? param.categoricalValueSpec.values.length - 1
              : 'discreteValueSpec' in param
              ? param.discreteValueSpec.values.length - 1
              : null,
          minIndex: 0,
          maxIndex:
            'categoricalValueSpec' in param
              ? param.categoricalValueSpec.values.length - 1
              : 'discreteValueSpec' in param
              ? param.discreteValueSpec.values.length - 1
              : null,
        };
        break;
    }
  });
  const metricMinMax = findMetricMinMax(completedTrials);
  metricNameList.forEach(metric => {
    axisPropsList[metric] = {
      type: 'DOUBLE',
      sliderMin: metricMinMax[metric].min,
      sliderMax: metricMinMax[metric].max,
      minVal: metricMinMax[metric].min,
      maxVal: metricMinMax[metric].max,
    };
  });
  // Store metric goals in axisPropsList
  studyConfig.metrics.forEach(metricSpec => {
    axisPropsList[metricSpec.metric]['goal'] = metricSpec.goal;
  });
  return axisPropsList;
}

/**
 * Finds all the labels for parameters & metrics and make it into a list of strings
 * Note that trialId is included as one of the paramLabels, though it isn't essentially a parameter
 * @param trials List of all the trials
 */
function fetchAxisLabels(trials: Types.Trial[]) {
  const completedTrials = trials.filter(
    trial => trial.state === 'COMPLETED' && 'finalMeasurement' in trial
  );
  return {
    paramLabelList: completedTrials
      ? ['trialId'].concat(
          completedTrials[0].parameters.map(param => param.parameter)
        )
      : [],
    metricLabelList: completedTrials
      ? completedTrials[0].finalMeasurement.metrics.map(metric => metric.metric)
      : [],
  };
}

const mapStateToProps = (state, ownProps) => {
  const study: Types.Study = state.studies.data?.find(
    study => study.name === ownProps.studyName
  );
  return {
    trials: study.trials,
    studyName: study.name,
    studyConfig: study.studyConfig,
  };
};

export const VisualizeTrialsUnWrapped: React.FC<Props> = ({
  trials,
  studyName,
  studyConfig,
}) => {
  const dispatch = useDispatch();
  const ref = React.useRef<HTMLHeadingElement>(null);
  const [width, setWidth] = React.useState(0);
  const [height, setHeight] = React.useState(0);
  const [value, setValue] = React.useState([0, 1]); // Placeholder value for slider changes
  const [selectedMetric, setSelectedMetric] = React.useState('');
  const [
    selectedMetricForScatterplot,
    setSelectedMetricForScatterplot,
  ] = React.useState('');
  const [lineGraphYAxisMetric, setLineGraphYAxisMetric] = React.useState('');
  const [
    selectedParamsForScatterplot,
    setSelectedParamsForScatterplot,
  ] = React.useState([]);

  const handleParamAutocompleteChange = (event, newValue) => {
    setSelectedParamsForScatterplot(newValue.slice(0, 3)); // Limiting number of scatterplots to 3
  };

  const handleLineGraphRadioChange = event => {
    setLineGraphYAxisMetric(event.target.value);
  };

  const handleMetricDropdownSelect = event => {
    setSelectedMetricForScatterplot(event.target.value);
  };

  if (!trials) {
    dispatch(fetchTrials(studyName));
  }

  const completedTrials = trials.filter(
    trial =>
      trial.state === 'COMPLETED' &&
      'finalMeasurement' in trial &&
      'value' in trial.finalMeasurement.metrics[0]
  ); // should be checking if 'value' exists in all the metrics inside finalMeasurement but just checking one for better performance

  const { paramLabelList, metricLabelList } = fetchAxisLabels(completedTrials);

  /**
   * Set default parameters & metrics for scatterplot so that graphs will show up before selecting/specifying values
   */
  const setScatterplotDefaults = (paramLabelList, metricLabelList) => {
    if (metricLabelList) setSelectedMetricForScatterplot(metricLabelList[0]);
    if (paramLabelList)
      setSelectedParamsForScatterplot(paramLabelList.slice(0, 3));
  };

  // Make sure to only update the scatterplot param/metric once
  if (!selectedMetricForScatterplot || !selectedParamsForScatterplot)
    setScatterplotDefaults(paramLabelList, metricLabelList);

  const trialDataList: TrialData[] = createTrialData(completedTrials);

  const handleMetricSelectionChange = event => {
    setSelectedMetric(event.target.value);
  };
  const [axisPropsList, setAxisPropsList] = React.useState<AxisPropsList>(
    createAxisPropsList(completedTrials, studyConfig, metricLabelList)
  );
  const pcpAxisDataList = createPcpAxisDataList(
    paramLabelList,
    metricLabelList,
    axisPropsList
  );
  const handleTrialIdAxisChange = (event, newValue, item) => {
    if (value !== newValue) setValue(newValue);
    const newAxisPropsList = axisPropsList;
    if (
      axisPropsList[item]['type'] === 'INTEGER' ||
      axisPropsList[item]['type'] === 'DOUBLE'
    ) {
      newAxisPropsList[item]['sliderMin'] = newValue[0];
      newAxisPropsList[item]['sliderMax'] = newValue[1];
    } else if (
      axisPropsList[item]['type'] === 'CATEGORICAL' ||
      axisPropsList[item]['type'] === 'DISCRETE'
    ) {
      newAxisPropsList[item]['sliderMinIndex'] = newValue[0];
      newAxisPropsList[item]['sliderMaxIndex'] = newValue[1];
    }
    setAxisPropsList(newAxisPropsList);
  };

  const populateSliders = (
    axisLabelArray,
    axisPropsList,
    rightColumn = false
  ) => {
    return axisLabelArray.map(item => {
      if (axisPropsList[item]['type'] === 'DOUBLE') {
        let radio;
        if (rightColumn) {
          radio = (
            <Grid container item justify="flex-end" xs={2}>
              <Radio
                checked={selectedMetric === `${item}`}
                onChange={handleMetricSelectionChange}
                value={`${item}`}
                name="radio-button-demo"
                inputProps={{ 'aria-label': 'A' }}
                size="small"
              />
            </Grid>
          );
        }
        return (
          <Grid container item xs={12} direction="row" alignItems="center">
            <Grid container item xs={5} justify="center">
              <Typography id="range-slider" gutterBottom>
                {item}
              </Typography>
            </Grid>
            <Grid container item xs={5}>
              <Slider
                value={[
                  axisPropsList[item]['sliderMin'],
                  axisPropsList[item]['sliderMax'],
                ]}
                onChange={(event, newValue) =>
                  handleTrialIdAxisChange(event, newValue, item)
                }
                step={0.001}
                max={axisPropsList[item]['maxVal']}
                min={axisPropsList[item]['minVal']}
                valueLabelDisplay="auto"
                aria-labelledby="range-slider"
                valueLabelFormat={x => x.toPrecision(4)}
              />
            </Grid>
            {radio}
          </Grid>
        );
      } else if (axisPropsList[item]['type'] === 'INTEGER') {
        return (
          <Grid container item xs={12} direction="row" alignItems="center">
            <Grid container item xs={5} justify="center">
              <Typography id="range-slider" gutterBottom>
                {item}
              </Typography>
            </Grid>
            <Grid container item xs={5}>
              <Slider
                value={[
                  axisPropsList[item]['sliderMin'],
                  axisPropsList[item]['sliderMax'],
                ]}
                onChange={(event, newValue) =>
                  handleTrialIdAxisChange(event, newValue, item)
                }
                max={axisPropsList[item]['maxVal']}
                min={axisPropsList[item]['minVal']}
                valueLabelDisplay="auto"
                aria-labelledby="range-slider"
              />
            </Grid>
          </Grid>
        );
      } else if (
        axisPropsList[item]['type'] === 'CATEGORICAL' ||
        axisPropsList[item]['type'] === 'DISCRETE'
      ) {
        return (
          <Grid container item xs={12} direction="row" alignItems="center">
            <Grid container item xs={5} justify="center">
              <Typography id="range-slider" gutterBottom>
                {item}
              </Typography>
            </Grid>
            <Grid container item xs={5}>
              <Slider
                value={[
                  axisPropsList[item]['sliderMinIndex'],
                  axisPropsList[item]['sliderMaxIndex'],
                ]}
                onChange={(event, newValue) =>
                  handleTrialIdAxisChange(event, newValue, item)
                }
                step={1}
                marks
                max={axisPropsList[item]['maxIndex']}
                min={axisPropsList[item]['minIndex']}
                valueLabelDisplay="auto"
                aria-labelledby="range-slider"
                valueLabelFormat={x => axisPropsList[item]['values'][x]}
              />
            </Grid>
          </Grid>
        );
      }
    });
  };

  React.useEffect(() => {
    if (ref.current) {
      setWidth(ref.current.offsetWidth * 0.9);
      setHeight(Math.round(width * 0.5));
    }
  }, [ref.current, width, height]);
  return (
    <React.Fragment>
      <Box className={styles.root} m={5}>
        <Box display="flex">
          <Typography variant="h5" gutterBottom>
            Visualizations
          </Typography>
          <Box mx="auto" />
          <Button
            variant="contained"
            color="primary"
            onClick={() =>
              dispatch(
                setView({
                  view: 'studyDetails',
                  studyId: studyName,
                })
              )
            }
          >
            Back To Study
          </Button>
        </Box>
        <Box display="flex" my={3}>
          <Grid container spacing={3}>
            <Grid container item xs={12} ref={ref}>
              <Paper className={styles.paper}>
                <Grid container item xs={12} alignItems="center">
                  <Grid container item xs={12}>
                    <Typography variant="h6">Study Overview</Typography>
                  </Grid>
                  <Grid container item xs={10}>
                    <LineGraph
                      width={width * ((10 / 12) * 1.0)}
                      height={height * ((10 / 12) * 0.5)}
                      axisProps={axisPropsList}
                      trialData={trialDataList}
                      selectedMetric={
                        lineGraphYAxisMetric
                          ? lineGraphYAxisMetric
                          : metricLabelList[0]
                      }
                      metricList={metricLabelList}
                    />
                  </Grid>
                  <Grid container item xs={2}>
                    <FormControl component="fieldset">
                      <RadioGroup
                        aria-label="yAxis"
                        name="yAxis"
                        value={lineGraphYAxisMetric}
                        onChange={handleLineGraphRadioChange}
                        defaultValue={metricLabelList[0]}
                      >
                        {metricLabelList.map(metric => {
                          return (
                            <FormControlLabel
                              value={metric}
                              control={<Radio size="small" />}
                              label={metric}
                            />
                          );
                        })}
                      </RadioGroup>
                    </FormControl>
                  </Grid>
                </Grid>
              </Paper>
              <Paper className={styles.paper}>
                <Grid container item xs={12} alignItems="center">
                  <Grid container item xs={12}>
                    <Typography variant="h6">Scatterplot Analysis</Typography>
                  </Grid>
                  <Box m={1} width="100%">
                    <Grid container item xs={12} spacing={1}>
                      <Grid item xs={12} sm={6}>
                        <Autocomplete
                          multiple
                          id="scatterplotParam"
                          options={paramLabelList}
                          getOptionLabel={option => option}
                          defaultValue={paramLabelList.slice(0, 3)}
                          filterSelectedOptions
                          fullWidth
                          size="small"
                          onChange={handleParamAutocompleteChange}
                          renderInput={params => (
                            <TextField
                              {...params}
                              variant="outlined"
                              label="Select Parameter"
                              placeholder="Select up to 3 parameters"
                            />
                          )}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          id="scatterplotMetric"
                          variant="outlined"
                          select
                          label="Select Metric"
                          value={selectedMetricForScatterplot}
                          onChange={handleMetricDropdownSelect}
                          size="small"
                          fullWidth
                          required
                        >
                          {metricLabelList.map(item => (
                            <MenuItem key={item} value={item}>
                              {item}
                            </MenuItem>
                          ))}
                        </TextField>
                      </Grid>
                    </Grid>
                  </Box>
                  <Grid container item xs={12} justify="center">
                    {selectedParamsForScatterplot.map(param => {
                      return (
                        <Scatterplot
                          width={width * 0.3}
                          height={height * 0.5}
                          axisProps={axisPropsList}
                          trialData={trialDataList}
                          selectedParam={param}
                          selectedMetric={selectedMetricForScatterplot}
                        />
                      );
                    })}
                  </Grid>
                </Grid>
              </Paper>
              <Paper className={styles.paper}>
                <Grid container item xs={12}>
                  <Typography variant="h6">
                    Parallel Coordinates Analysis
                  </Typography>
                </Grid>
                <Box m={5}>
                  <ParallelCoordinates
                    width={width}
                    height={height}
                    axisPropsList={axisPropsList}
                    trialDataList={trialDataList}
                    axisDataList={pcpAxisDataList}
                    selectedMetricForColor={selectedMetric}
                  />
                  <Grid container item xs={12} justify="center">
                    <Grid
                      container
                      item
                      xs={5}
                      spacing={2}
                      alignContent="flex-start"
                    >
                      {populateSliders(paramLabelList, axisPropsList)}
                    </Grid>
                    <Grid
                      container
                      item
                      xs={5}
                      spacing={1}
                      alignContent="flex-start"
                    >
                      {populateSliders(metricLabelList, axisPropsList, true)}
                    </Grid>
                  </Grid>
                </Box>
              </Paper>
            </Grid>
          </Grid>
        </Box>
      </Box>
    </React.Fragment>
  );
};

export const VisualizeTrials = connect(
  mapStateToProps,
  null
)(VisualizeTrialsUnWrapped);
