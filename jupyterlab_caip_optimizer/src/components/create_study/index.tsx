import * as React from 'react';
import {
  Box,
  Button,
  Typography,
  TextField,
  MenuItem,
  Grid,
} from '@material-ui/core';
import { PayloadAction } from '@reduxjs/toolkit';
import { createStudy } from '../../store/studies';
import { setView } from '../../store/view';
import { styles } from '../../utils/styles';
import * as Types from '../../types';
import { ParameterList } from './parameter_list';
import { MetricList } from './metric_list';
import { useAppDispatch } from '../../store/store';

export interface DropdownItem {
  value: string;
  label: string;
}

export type TemporaryParameterBase = {
  name: string;
};

export type TemporaryParameterUnspecifiedMetadata = {};
export type TemporaryParameterUnspecified = TemporaryParameterBase & {
  type: 'PARAMETER_TYPE_UNSPECIFIED';
  metadata: TemporaryParameterUnspecifiedMetadata;
};

export type TemporaryParameterDoubleMetadata = {
  minValue: string;
  maxValue: string;
};
export type TemporaryParameterDouble = TemporaryParameterBase & {
  type: 'DOUBLE';
  metadata: TemporaryParameterDoubleMetadata;
};

export type TemporaryParameterIntegerMetadata = {
  minValue: string;
  maxValue: string;
};
export type TemporaryParameterInteger = TemporaryParameterBase & {
  type: 'INTEGER';
  metadata: TemporaryParameterIntegerMetadata;
};

export type TemporaryParameterDiscreteMetadata = {
  // NOTE: this is a string list not a number list!
  valueList: string[];
};
export type TemporaryParameterDiscrete = TemporaryParameterBase & {
  type: 'DISCRETE';
  metadata: TemporaryParameterDiscreteMetadata;
};

export type TemporaryParameterCategoricalMetadata = {
  valueList: string[];
};
export type TemporaryParameterCategorical = TemporaryParameterBase & {
  type: 'CATEGORICAL';
  metadata: TemporaryParameterCategoricalMetadata;
};

export type TemporaryParameterMetadata =
  | TemporaryParameterUnspecifiedMetadata
  | TemporaryParameterDoubleMetadata
  | TemporaryParameterIntegerMetadata
  | TemporaryParameterDiscreteMetadata
  | TemporaryParameterCategoricalMetadata;

export type TemporaryParameter =
  | TemporaryParameterUnspecified
  | TemporaryParameterDouble
  | TemporaryParameterInteger
  | TemporaryParameterDiscrete
  | TemporaryParameterCategorical;

export const createDropdown = (
  items: ReadonlyArray<string>
): DropdownItem[] => {
  const dropdownList: DropdownItem[] = items.map(
    (item: string): DropdownItem => {
      return { value: item, label: item };
    }
  );
  return dropdownList;
};

export const CreateStudy: React.FC = () => {
  const dispatch = useAppDispatch();
  const [studyName, setStudyName] = React.useState('');
  const algorithmTypes: DropdownItem[] = createDropdown(Types.AlgorithmList);
  const [algorithmType, setAlgorithmType] = React.useState<Types.Algorithm>(
    'ALGORITHM_UNSPECIFIED'
  );
  const [parameters, setParameters] = React.useState<TemporaryParameter[]>([]);
  const [metrics, setMetrics] = React.useState<Types.MetricSpec[]>([]);

  const getParameterSpecList = (): Types.ParameterSpec[] => {
    return parameters.map(parameter => {
      const parameterSpec: Partial<Types.ParameterSpec> = {};
      parameterSpec['parameter'] = parameter.name;
      parameterSpec['type'] = parameter.type;
      switch (parameterSpec.type) {
        case 'DOUBLE': {
          const {
            minValue,
            maxValue,
          } = parameter.metadata as TemporaryParameterDoubleMetadata;
          parameterSpec['doubleValueSpec'] = {
            minValue: Number(minValue),
            maxValue: Number(maxValue),
          } as Types.DoubleValueSpec;
          break;
        }
        case 'INTEGER': {
          const {
            minValue,
            maxValue,
          } = parameter.metadata as TemporaryParameterIntegerMetadata;
          parameterSpec['integerValueSpec'] = {
            minValue: minValue,
            maxValue: maxValue,
          } as Types.IntegerValueSpec;
          break;
        }
        case 'CATEGORICAL': {
          const {
            valueList,
          } = parameter.metadata as TemporaryParameterCategoricalMetadata;
          parameterSpec['categoricalValueSpec'] = {
            values: valueList,
          } as Types.CategoricalValueSpec;
          break;
        }
        case 'DISCRETE': {
          const {
            valueList,
          } = parameter.metadata as TemporaryParameterDiscreteMetadata;
          parameterSpec['discreteValueSpec'] = {
            values: valueList.map((valueString: string): number =>
              Number(valueString)
            ),
          } as Types.DiscreteValueSpec;
          break;
        }
      }
      const finalParameterSpec = parameterSpec as Types.ParameterSpec;
      return finalParameterSpec;
    });
  };

  const getStudyObject = (): Types.Study => {
    const parameters = getParameterSpecList();
    const studyConfig: Types.StudyConfig = {
      metrics,
      parameters,
      algorithm: algorithmType,
    };
    const study: Types.Study = {
      name: studyName,
      studyConfig,
    };
    return study;
  };

  const createStudyAndLoad = (study: Types.Study) =>
    // Redux's createAsyncThunk returns a Promise<PayloadAction<type>> since the
    // action has more information. Read more here:
    // https://redux-toolkit.js.org/api/createAsyncThunk#return-value
    (dispatch(createStudy(study)) as Promise<PayloadAction<Types.Study>>).then(
      (action: PayloadAction<Types.Study>) => {
        dispatch(
          setView({
            view: 'studyDetails',
            studyId: action.payload.name,
          })
        );
      }
    );

  return (
    <Box className={styles.root}>
      <Box m={5}>
        <React.Fragment>
          <Grid container spacing={3}>
            <Grid container item xs={12}>
              <Typography variant="h4" gutterBottom>
                Create New Study
              </Typography>
            </Grid>

            {/* Basics */}
            <Grid container item xs={12}>
              {/* Take up half of the page */}
              <Grid container item xs={12} md={6} spacing={3}>
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>
                    Basics
                  </Typography>

                  <TextField
                    required
                    variant="outlined"
                    id="studyName"
                    name="studyName"
                    label="Study Name"
                    value={studyName}
                    onChange={e => setStudyName(e.target.value)}
                    fullWidth
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    id="algorithmType"
                    variant="outlined"
                    select
                    label="Algorithm Type"
                    value={algorithmType}
                    onChange={event =>
                      setAlgorithmType(event.target.value as Types.Algorithm)
                    }
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

            {/* Parameters */}
            <Grid
              container
              item
              spacing={1}
              xs={12}
              md={6}
              alignContent="flex-start"
            >
              <Grid container item spacing={1} alignContent="flex-start">
                <Typography variant="h6" gutterBottom>
                  Parameter Configuration
                </Typography>

                <ParameterList
                  parameters={parameters}
                  onChange={setParameters}
                />
              </Grid>
            </Grid>

            {/* Metrics */}
            <Grid
              container
              item
              spacing={3}
              xs={12}
              md={6}
              alignContent="flex-start"
            >
              <Grid container item spacing={1} alignContent="flex-start">
                <Typography align="center" variant="h6" gutterBottom>
                  Metric Configuration
                </Typography>
                <MetricList metrics={metrics} onChange={setMetrics} />
              </Grid>
            </Grid>

            <Grid container item xs={12} spacing={1}>
              {/* Take up half of the page */}
              <Grid container item xs={12} md={6}>
                <Box clone mr={2}>
                  <Button
                    size="large"
                    data-testid="createStudy"
                    variant="contained"
                    color="primary"
                    id="createStudyButton"
                    disabled={!studyName}
                    onClick={() => createStudyAndLoad(getStudyObject())}
                  >
                    Create
                  </Button>
                </Box>

                <Box>
                  <Button
                    size="large"
                    color="primary"
                    id="cancel"
                    onClick={() => dispatch(setView({ view: 'dashboard' }))}
                  >
                    Cancel
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </Grid>
        </React.Fragment>
      </Box>
    </Box>
  );
};
