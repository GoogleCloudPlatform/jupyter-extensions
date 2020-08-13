import React, { useMemo } from 'react';
import {
  Box,
  Button,
  Paper,
  Typography,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@material-ui/core';
import { withStyles, makeStyles } from '@material-ui/core/styles';
import * as Types from '../../types';
import { prettifyStudyName } from '../../service/optimizer';
import { connect, useDispatch } from 'react-redux';
import moment from 'moment';
import { makeReadable, dateFormat } from '../../utils';
import { setView } from '../../store/view';
import { fetchTrials } from '../../store/studies';
import { CommonNode } from '../parameter_spec_tree/common_node';
import { styles } from '../../utils/styles';
import { ParameterSpecTree } from '../parameter_spec_tree';
import ParameterDetailsDialog from '../parameter_details_dialog';
import ArrowBack from '@material-ui/icons/ArrowBack';

const StyledTableCell = withStyles(theme => ({
  head: {
    backgroundColor: theme.palette.action.hover,
    color: theme.palette.common.black,
  },
  body: {
    fontSize: 14,
  },
}))(TableCell);

const StyledTableRow = withStyles(theme => ({
  root: {
    '&:nth-of-type(odd)': {
      backgroundColor: theme.palette.common.white,
    },
  },
}))(TableRow);

const useStyles = makeStyles({
  table: {
    minWidth: 700,
  },
});

interface FormattedParam {
  name: string;
  type: Types.ParameterType;
  values?: number[] | string[];
  minValue?: number | string;
  maxValue?: number | string;
}

interface FormattedStudy {
  name: Types.Study['name'];
  objective: string;
  algorithm: Types.StudyConfig['algorithm'];
  state: Types.Study['state'];
  createTime: Types.Study['createTime'];
  parameters: FormattedParam[];
}

function formatParams(params: Types.ParameterSpec[]): FormattedParam[] {
  return params.map(param => {
    const formattedParam: FormattedParam = {
      name: param.parameter,
      type: param.type,
    };
    switch (formattedParam.type) {
      case 'DISCRETE':
        formattedParam['values'] = param['discreteValueSpec'].values;
        break;
      case 'CATEGORICAL':
        formattedParam['values'] = param['categoricalValueSpec'].values;
        break;
      case 'DOUBLE':
        formattedParam['minValue'] = param['doubleValueSpec'].minValue ?? 0;
        formattedParam['maxValue'] = param['doubleValueSpec'].maxValue ?? 0;
        break;
      case 'INTEGER':
        formattedParam['minValue'] = param['integerValueSpec'].minValue ?? 0;
        formattedParam['maxValue'] = param['integerValueSpec'].maxValue ?? 0;
        break;
    }
    return formattedParam;
  });
}

interface Props {
  studyId: string;
  studyToDisplay: FormattedStudy;
  parameterSpecs: Types.ParameterSpec[];
  openTrials: (studyName: string) => void;
  openVisualizations: (studyName: string) => void;
  openDashboard: () => void;
}

const mapStateToProps = (state, ownProps) => {
  const study: Types.Study = state.studies.data?.find(
    study => study.name === ownProps.studyId
  );
  const studyToDisplay: FormattedStudy = {
    name: prettifyStudyName(study.name),
    objective: study.studyConfig.metrics
      .map(metric => `${makeReadable(metric.goal)} "${metric.metric}"`)
      .join(', '),
    algorithm: study.studyConfig.algorithm,
    state: study.state,
    createTime: moment(study.createTime).format(dateFormat),
    parameters: formatParams(study.studyConfig.parameters),
  };
  return {
    studyId: study.name,
    studyToDisplay,
    parameterSpecs: study.studyConfig.parameters,
  };
};

const mapDispatchToProps = dispatch => ({
  openTrials: (studyName: string) =>
    dispatch(setView({ view: 'suggestTrials', studyId: studyName })),
  openVisualizations: (studyName: string) =>
    dispatch(setView({ view: 'visualizeTrials', studyId: studyName })),
  openDashboard: () => dispatch(setView({ view: 'dashboard' })),
});

interface ConfigRow {
  key: number;
  entryName: string;
  entryValue: string;
}

interface ParamRow {
  key: number;
  name: string;
  type: Types.ParameterType;
  values: string;
}

function createConfigRows(study: FormattedStudy): ConfigRow[] {
  const entries: ConfigRow[] = Object.entries(study)
    .filter(entry => entry[0] !== 'parameters')
    .map((entry, index) => {
      return {
        key: index,
        entryName: `${entry[0]}`,
        entryValue: `${entry[1]}`,
      };
    });
  return entries;
}

function createParamRows(study: FormattedStudy): ParamRow[] {
  const params: FormattedParam[] = study['parameters'];
  const paramRows: ParamRow[] = params.map(
    (param: FormattedParam, index: number): ParamRow => {
      const paramVal: string =
        param.type === 'DISCRETE' || param.type === 'CATEGORICAL'
          ? `${param.values}`
          : `min: ${param.minValue}, max: ${param.maxValue}`;
      return {
        key: index,
        name: param.name,
        type: param.type,
        values: paramVal,
      };
    }
  );
  return paramRows;
}

export const StudyDetailsUnwrapped: React.FC<Props> = ({
  studyId,
  studyToDisplay,
  parameterSpecs,
  openTrials,
  openVisualizations,
  openDashboard,
}) => {
  const dispatch = useDispatch();
  React.useEffect(() => {
    dispatch(fetchTrials(studyId));
  }, [studyId]);
  const classes = useStyles();
  const configRows = createConfigRows(studyToDisplay);
  const paramRows = createParamRows(studyToDisplay);
  const [selectedParameterSpec, setSelectedParameterSpec] = React.useState<
    undefined | Types.ParameterSpec
  >(undefined);
  const parametersAreTree = useMemo(() => CommonNode.isTree(parameterSpecs), [
    parameterSpecs,
  ]);
  return (
    <Box m={3} className={styles.root}>
      <React.Fragment>
        <Box display="flex">
          <Typography variant="h4" gutterBottom>
            {studyToDisplay.name}
          </Typography>
          <Box ml="auto">
            <Button
              color="primary"
              variant="contained"
              onClick={() => openDashboard()}
              startIcon={<ArrowBack />}
            >
              Back to Dashboard
            </Button>
          </Box>
        </Box>

        <Grid container item spacing={2} xs={12}>
          <Grid container item>
            <Box clone mb={3}>
              <TableContainer component={Paper}>
                <Table
                  className={classes.table}
                  aria-label="customized table"
                  size="small"
                >
                  <TableHead>
                    <TableRow>
                      <StyledTableCell>Study Configuration</StyledTableCell>
                      <StyledTableCell align="right" />
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {configRows.map((row: ConfigRow, index: number) => (
                      <StyledTableRow key={`config-row-${index}`}>
                        <StyledTableCell component="th" scope="row">
                          {row.entryName}
                        </StyledTableCell>
                        <StyledTableCell align="right">
                          {row.entryValue}
                        </StyledTableCell>
                      </StyledTableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
            <TableContainer component={Paper}>
              <Table
                className={classes.table}
                aria-label="customized table"
                size="small"
              >
                <TableHead>
                  <TableRow>
                    <StyledTableCell>Parameters</StyledTableCell>
                    <StyledTableCell align="right">Type</StyledTableCell>
                    <StyledTableCell align="right">Values</StyledTableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paramRows.map((row: ParamRow, index: number) => {
                    return (
                      <StyledTableRow key={`param-row-${index}`}>
                        <StyledTableCell component="th" scope="row">
                          {row.name}
                        </StyledTableCell>
                        <StyledTableCell align="right">
                          {row.type}
                        </StyledTableCell>
                        <StyledTableCell align="right">
                          {row.values}
                        </StyledTableCell>
                      </StyledTableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Grid>
          <Grid item>
            <Box display="flex">
              <Box mr={0.5} clone>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => openVisualizations(studyId)}
                >
                  See Visualization
                </Button>
              </Box>
              <Box ml={0.5} clone>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => openTrials(studyId)}
                >
                  View Trials
                </Button>
              </Box>
            </Box>
          </Grid>
        </Grid>

        {parametersAreTree && (
          <>
            <Box mt={3}>
              <ParameterSpecTree
                specs={parameterSpecs}
                onClick={spec => setSelectedParameterSpec(spec)}
              />
            </Box>

            <ParameterDetailsDialog
              spec={selectedParameterSpec}
              onClose={() => setSelectedParameterSpec(undefined)}
            />
          </>
        )}
      </React.Fragment>
    </Box>
  );
};

export const StudyDetails = connect(
  mapStateToProps,
  mapDispatchToProps
)(StudyDetailsUnwrapped);
