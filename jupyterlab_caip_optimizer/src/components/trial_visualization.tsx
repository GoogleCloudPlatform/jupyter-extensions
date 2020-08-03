import React from 'react';
import { Grid, Paper, Radio } from '@material-ui/core';
import { ParallelCoordinates } from './graphs/parallel_coordinates';
import { Typography, Slider, Box } from '@material-ui/core/';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store/store';
import { fetchTrials } from '../store/studies';
import * as Types from '../types';
import { styles } from '../utils/styles';

interface Props {
  studyName: string;
}

type ContinuousAxisProps = {
  type: string;
  sliderMin: number;
  sliderMax: number;
  minVal: number;
  maxVal: number;
  flip?: boolean;
};

type DiscontinousAxisProps = {
  type: string;
  values: number[] | string[];
  sliderMinIndex: number;
  sliderMaxIndex: number;
  minIndex: number;
  maxIndex: number;
};

export interface AxisPropsList {
  trialId: ContinuousAxisProps;
  [key: string]: ContinuousAxisProps | DiscontinousAxisProps;
}

interface LineData {
  trialId: number;
  name?: string;
  [key: string]: number | string;
}

// Needed for populating D3 axis
interface AxisData {
  label: string;
  type: string;
  minVal?: number;
  maxVal?: number;
  values?: string[] | number[];
}

function createAxesData(
  axisLabelsLeft,
  axisLabelsRight,
  axisPropsList: AxisPropsList
): AxisData[] {
  const axesData = [];
  axisLabelsLeft.forEach(label => {
    const thisAxisProps = axisPropsList[label];
    switch (thisAxisProps.type) {
      case 'DOUBLE':
      case 'INTEGER':
        axesData.push({
          label,
          type: axisPropsList[label].type,
          minVal: 'minVal' in thisAxisProps ? thisAxisProps.minVal : null,
          maxVal: 'maxVal' in thisAxisProps ? thisAxisProps.maxVal : null,
        });
        break;
      case 'CATEGORICAL':
      case 'DISCRETE':
        axesData.push({
          label,
          type: axisPropsList[label].type,
          values: 'values' in thisAxisProps ? thisAxisProps.values : null,
        });
        break;
    }
  });
  axisLabelsRight.forEach(label => {
    const thisAxisProps = axisPropsList[label];
    axesData.push({
      label,
      type: axisPropsList[label].type,
      minVal: 'minVal' in thisAxisProps ? thisAxisProps.minVal : null,
      maxVal: 'maxVal' in thisAxisProps ? thisAxisProps.maxVal : null,
    });
  });
  return axesData;
}

function getParameterValue(parameter: Types.Parameter) {
  if ('floatValue' in parameter) return parameter.floatValue;
  if ('intValue' in parameter) return parameter.intValue;
  if ('stringValue' in parameter) return parameter.stringValue;
}

/**
 * Creates a list of LineData objects retrieved from only the completed studies with final measurements
 * as it is impossible to plot the trials with missing final measurement values.
 * @param trials List of all the trials in the study
 */
function createLineData(completedTrials: Types.Trial[]): LineData[] {
  return completedTrials.map((trial, i) => {
    const lineData = {
      trialId: i + 1, // starts from 1
    };
    trial.parameters.forEach(param => {
      lineData[param.parameter] = getParameterValue(param);
    });
    trial.finalMeasurement.metrics.forEach(metric => {
      lineData[metric.metric] = metric.value;
    });
    return lineData;
  });
}

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

function createAxisProps(
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
        axisPropsList[param.parameter] = {
          type: param.type,
          sliderMin:
            'integerValueSpec' in param
              ? Number(param.integerValueSpec.minValue)
              : 'doubleValueSpec' in param
              ? param.doubleValueSpec.minValue
              : null,
          sliderMax:
            'integerValueSpec' in param
              ? Number(param.integerValueSpec.maxValue)
              : 'doubleValueSpec' in param
              ? param.doubleValueSpec.maxValue
              : null,
          minVal:
            'integerValueSpec' in param
              ? Number(param.integerValueSpec.minValue)
              : 'doubleValueSpec' in param
              ? param.doubleValueSpec.minValue
              : null,
          maxVal:
            'integerValueSpec' in param
              ? Number(param.integerValueSpec.maxValue)
              : 'doubleValueSpec' in param
              ? param.doubleValueSpec.maxValue
              : null,
        };
        if (axisPropsList[param.parameter]['minVal'] === undefined) {
          // Due to Optimizer API error. Undefined minimum values should be changed to 0.
          axisPropsList[param.parameter]['minVal'] = 0;
          axisPropsList[param.parameter]['sliderMin'] = 0;
        }
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
  return axisPropsList;
}

function fetchAxisLabels(trials: Types.Trial[]) {
  const completedTrials = trials.filter(
    trial => trial.state === 'COMPLETED' && 'finalMeasurement' in trial
  );
  return {
    axisLabelsLeft: completedTrials
      ? ['trialId'].concat(
          completedTrials[0].parameters.map(param => param.parameter)
        )
      : [],
    axisLabelsRight: completedTrials
      ? completedTrials[0].finalMeasurement.metrics.map(metric => metric.metric)
      : [],
  };
}

export const VisualizeTrials: React.FC<Props> = ({ studyName }) => {
  const dispatch = useDispatch();
  const ref = React.useRef<HTMLHeadingElement>(null);
  const [width, setWidth] = React.useState(0);
  const [height, setHeight] = React.useState(0);
  const [value, setValue] = React.useState([20, 37]);
  const [selectedMetric, setSelectedMetric] = React.useState('');

  React.useEffect(() => {
    dispatch(fetchTrials(studyName));
  }, [studyName]);

  const { trials, studyConfig } = useSelector<RootState, Types.Study>(state =>
    state.studies.data?.find(study => study.name === studyName)
  );

  // TODO: condition for trial undefined, states set as dummy values and then re-set the values once trials populated

  if (!trials) return null;

  const completedTrials = trials.filter(
    trial => trial.state === 'COMPLETED' && 'finalMeasurement' in trial
  );
  const { axisLabelsLeft, axisLabelsRight } = fetchAxisLabels(completedTrials);
  const lineDataList: LineData[] = createLineData(completedTrials);

  const handleMetricSelectionChange = event => {
    setSelectedMetric(event.target.value);
  };
  const [axisPropsList, setAxisPropsList] = React.useState<AxisPropsList>(
    createAxisProps(completedTrials, studyConfig, axisLabelsRight)
  );
  const axesData = createAxesData(
    axisLabelsLeft,
    axisLabelsRight,
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
      <Box className={styles.root} display="flex" m={5}>
        <Grid container spacing={3}>
          <Grid container item xs={12}>
            <Typography variant="h5" gutterBottom>
              Visualizations
            </Typography>
          </Grid>
          <Grid container item xs={12} ref={ref}>
            <Paper>
              <Box m={5} overflow="scroll">
                <ParallelCoordinates
                  width={width}
                  height={height}
                  axisPropsList={axisPropsList}
                  lineDataList={lineDataList}
                  axesData={axesData}
                  selectedMetricForColor={selectedMetric}
                />
                <Grid container item xs={12} justify="center">
                  <Grid container item xs={5} spacing={2} alignContent="flex-start">
                    {populateSliders(axisLabelsLeft, axisPropsList)}
                  </Grid>
                  <Grid container item xs={5} spacing={1} alignContent="flex-start">
                    {populateSliders(axisLabelsRight, axisPropsList, true)}
                  </Grid>
                </Grid>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </React.Fragment>
  );
};
