import React from "react";
import Grid from "@material-ui/core/Grid";
import Typography from "@material-ui/core/Typography";
import { withStyles, makeStyles } from "@material-ui/core/styles";
import Table from "@material-ui/core/Table";
import TableBody from "@material-ui/core/TableBody";
import TableCell from "@material-ui/core/TableCell";
import TableContainer from "@material-ui/core/TableContainer";
import TableHead from "@material-ui/core/TableHead";
import TableRow from "@material-ui/core/TableRow";
import Paper from "@material-ui/core/Paper";
import Button from "@material-ui/core/Button";
import IconButton from "@material-ui/core/IconButton";
import KeyboardArrowDownIcon from "@material-ui/icons/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@material-ui/icons/KeyboardArrowUp";
import Box from "@material-ui/core/Box";
import Collapse from "@material-ui/core/Collapse";
import * as Types from "../types"
import { prettifyStudyName } from "../service/optimizer"
import { connect } from 'react-redux';
import moment from 'moment';

const dateFormat = 'h:mm a, MMM. D, YYYY';

const StyledTableCell = withStyles(theme => ({
  head: {
    backgroundColor: theme.palette.action.hover,
    color: theme.palette.common.black
  },
  body: {
    fontSize: 14
  }
}))(TableCell);

const StyledTableRow = withStyles(theme => ({
  root: {
    "&:nth-of-type(odd)": {
      backgroundColor: theme.palette.common.white
    }
  }
}))(TableRow);

const useStyles = makeStyles({
  table: {
    minWidth: 700
  }
});

interface FormattedParam {
    name: string,
    type: Types.ParameterType,
    values?: number[] | string[],
    minValue?: number | string,
    maxValue?: number | string, 
}

interface FormattedStudy {
    name: Types.Study['name'],
    objective: string,
    algorithm: Types.StudyConfig['algorithm'],
    state: Types.Study['state'],
    createTime: Types.Study['createTime'],
    parameters: FormattedParam[],
}

function formatParams(params: Types.ParameterSpec[]): FormattedParam[] {
    const formattedParams: FormattedParam[] = params.map(param => {
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
                formattedParam['minValue'] = param['doubleValueSpec'].minValue;
                formattedParam['maxValue'] = param['doubleValueSpec'].maxValue;
                break;
            case 'INTEGER':
                formattedParam['minValue'] = param['integerValueSpec'].minValue;
                formattedParam['maxValue'] = param['integerValueSpec'].maxValue;
                break;
        }
        return formattedParam;
    });
    return formattedParams;
}

function makeReadable(string: string): string {
    return string.charAt(0).toUpperCase() + string.toLowerCase().slice(1);
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
    }
    return {
      studyToDisplay,
      // TODO: add trials
      // trialsToDisplay
    };
};

interface Props {
    studyToDisplay: FormattedStudy;
}

const dummyTrials = [
  {
    name: "1",
    state: "ACTIVE",
    infeasible: "-",
    model_type: "LINEAR",
    finalMeasurement: {
      metrics: [
        {
          metric: "accruacy",
          value: "0.9"
        },
        {
          metric: "learning_rate",
          value: "0.89"
        }
      ]
    }
  },
  {
    name: "2",
    state: "ACTIVE",
    infeasible: "-",
    model_type: "LINEAR",
    finalMeasurement: {
      metrics: [
        {
          metric: "accruacy",
          value: "0.95"
        },
        {
          metric: "learning_rate",
          value: "0.87"
        }
      ]
    }
  }
];

interface ConfigRow {
    key: number,
    entryName: string,
    entryValue: string,
}

interface ParamRow {
    key: number,
    name: string,
    type: Types.ParameterType,
    values: string,
}

function createConfigRows(study: FormattedStudy): ConfigRow[] {
  const entries: ConfigRow[] = Object.entries(study)
    .filter(entry => entry[0] !== "parameters")
    .map((entry, index) => {
      return {
        key: index,
        entryName: `${entry[0]}`,
        entryValue: `${entry[1]}`
      };
    });
  return entries;
}

function createParamRows(study: FormattedStudy): ParamRow[] {
  const params: FormattedParam[] = study["parameters"];
  const paramRows: ParamRow[] = params.map((param: FormattedParam, index: number): ParamRow => {
    const paramVal: string =
      param.type === "DISCRETE" || param.type === "CATEGORICAL"
        ? `${param.values}`
        : `min: ${param.minValue}, max: ${param.maxValue}`;
    return {
      key: index,
      name: param.name,
      type: param.type,
      values: paramVal
    };
  });
  return paramRows;
}

function ExpandableRow(props) {
  const { expandable, mainContents, subContents, subTableTitle } = props;
  const [open, setOpen] = React.useState(false);
  const classes = useStyles();

  return (
    <React.Fragment>
      <TableRow>
        {Object.values(mainContents).map((value, index) => {
          if (index === 0) {
            return (
              <TableCell key={index} component="th" scope="row">
                {value}
              </TableCell>
            );
          }
          return (
            <TableCell key={index} align="right">
              {value}
            </TableCell>
          );
        })}
        <TableCell align="right">
          <IconButton
            aria-label="expand row"
            size="small"
            onClick={() => setOpen(!open)}
          >
            {expandable ? (
              open ? (
                <KeyboardArrowUpIcon />
              ) : (
                <KeyboardArrowDownIcon />
              )
            ) : (
              ""
            )}
          </IconButton>
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box margin={1}>
              <Typography variant="subtitle2" gutterBottom component="div">
                {subTableTitle}
              </Typography>
              <Table
                size="small"
                aria-label="subtable"
                className={classes.table}
              >
                <TableHead>
                  <TableRow>
                    {Object.keys(subContents[0]).map((title, index) => (
                      <TableCell align={index === 0 ? "left" : "right"}>
                        {title}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {subContents.map((subtableRow, index) => (
                    <TableRow key={`subTableRow-${index}`}>
                      {Object.values(subtableRow).map((column, subIndex) => {
                        if (subIndex === 0)
                          return (
                            <TableCell
                              key={`subTableCell-${index}-${subIndex}`}
                              component="th"
                              scope="row"
                            >
                              {column}
                            </TableCell>
                          );
                        return (
                          <TableCell
                            key={`subTableCell-${index}-${subIndex}`}
                            align="right"
                          >
                            {column}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </React.Fragment>
  );
}

export const StudyDetailsUnwrapped: React.FC<Props> = ({
    studyToDisplay,
}) => {
  const classes = useStyles();
  const configRows = createConfigRows(studyToDisplay);
  const paramRows = createParamRows(studyToDisplay);
  return (
    <Box m={3}>
    <React.Fragment>
      <Typography variant="h5" gutterBottom align="left">
        {studyToDisplay.name}
      </Typography>
      <Grid container item spacing={1} xs={12}>
        <Grid container item sm={9}>
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
                {configRows.map((row, index) => (
                  <StyledTableRow key={`${row.entryName}-${index}`}>
                    <StyledTableCell
                      key={`${row.entryName}-${index}`}
                      component="th"
                      scope="row"
                    >
                      {row.entryName}
                    </StyledTableCell>
                    <StyledTableCell
                      key={`${row.entryValue}-${index}`}
                      align="right"
                    >
                      {row.entryValue}
                    </StyledTableCell>
                  </StyledTableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
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
                {paramRows.map(row => {
                  return (
                    <StyledTableRow key={row.name}>
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
          <TableContainer component={Paper}>
            <Table
              className={classes.table}
              aria-label="customized table"
              size="small"
            >
              <TableHead>
                <TableRow>
                  <StyledTableCell>Trials</StyledTableCell>
                  <StyledTableCell align="right">State</StyledTableCell>
                  <StyledTableCell align="right">Infeasible</StyledTableCell>
                  <StyledTableCell align="right">Model Type</StyledTableCell>
                  <StyledTableCell align="right">
                    Final Measurement
                  </StyledTableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {dummyTrials.map(row => {
                  const mainContents = {
                    name: row.name,
                    state: row.state,
                    infeasible: row.infeasible,
                    model_type: row.model_type
                  };
                  const subContents = row.finalMeasurement.metrics;
                  return (
                    <ExpandableRow
                      key={row.name}
                      expandable={true}
                      mainContents={mainContents}
                      subContents={subContents}
                      subTableTitle="Final Measurement"
                    />
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>
        <Grid item sm={3}>
          <Grid container item justify="center" xs={12}>
            <Button color="primary">See Visualization</Button>
          </Grid>
          <Grid container item justify="center" xs={12}>
            <Button color="primary">Go to Dashboard</Button>
          </Grid>
          <Grid container item justify="center" xs={12}>
            <Button color="primary">Edit Trials</Button>
          </Grid>
        </Grid>
      </Grid>
    </React.Fragment>
    </Box>
  );
};

export const StudyDetails = connect(
    mapStateToProps,
    null
  )(StudyDetailsUnwrapped);
