import {
  Table,
  TableBody,
  TableCell,
  TableRow,
  Collapse,
  IconButton,
  TableHead,
  Box,
  withStyles,
} from '@material-ui/core';
import Alert from '@material-ui/lab/Alert';
import { KeyboardArrowUp, KeyboardArrowDown } from '@material-ui/icons';
import * as React from 'react';
import { Pipeline } from '../../service/model';
import { BASE_FONT } from 'gcp_jupyterlab_shared';

interface Props {
  pipeline: Pipeline;
}

interface RowProps {
  row: any;
  transformationOptions: any[];
}

interface RowState {
  open: boolean;
}

const StyledTableCell = withStyles({
  root: {
    fontSize: '13px',
    BASE_FONT,
  },
})(TableCell);

const properties = {
  state: 'Status',
  createTime: 'Created',
  trainBudgetMilliNodeHours: 'Budget',
  budgetMilliNodeHours: 'Budget',
  elapsedTime: 'Elapsed Time',
  datasetId: 'Dataset ID',
  targetColumn: 'Target column',
  transformationOptions: 'Transformation options',
  objective: 'Objective',
  optimizationObjective: 'Optimized for',
};

export class TransformationOptionsRow extends React.Component<
  RowProps,
  RowState
> {
  constructor(props: RowProps) {
    super(props);
    this.state = {
      open: false,
    };
  }

  render() {
    return (
      <React.Fragment key={'Expandable'}>
        <TableRow key={this.props.row.key}>
          <StyledTableCell scope="row">{this.props.row.key}</StyledTableCell>
          <StyledTableCell align="right">
            <IconButton
              aria-label="expand row"
              size="small"
              onClick={() => {
                this.setState({ open: !this.state.open });
              }}
            >
              {this.state.open ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
            </IconButton>
          </StyledTableCell>
        </TableRow>
        <TableRow key={'Collapse'}>
          <StyledTableCell
            style={{ paddingBottom: 0, paddingTop: 0 }}
            colSpan={6}
          >
            <Collapse in={this.state.open} timeout="auto" unmountOnExit>
              <Box margin={1}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Column name</TableCell>
                      <TableCell>Transformation</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {this.props.transformationOptions.map(option => (
                      <TableRow key={option.columnName}>
                        <StyledTableCell scope="row">
                          {option.columnName}
                        </StyledTableCell>
                        <StyledTableCell>{option.dataType}</StyledTableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
            </Collapse>
          </StyledTableCell>
        </TableRow>
      </React.Fragment>
    );
  }
}

export class PipelineProperties extends React.Component<Props> {
  constructor(props: Props) {
    super(props);
  }

  private getBudget(milliNodeHours: number): string {
    return (milliNodeHours / 1000).toString() + ' node hours';
  }

  private createData(key: string, val: any) {
    return { key, val };
  }

  private getPipelineDetails(pipeline: Pipeline): any[] {
    const pipelineID = pipeline.id.split('/');
    const pipelineDetails = [
      this.createData('ID', pipelineID[pipelineID.length - 1]),
      this.createData('Region', 'us-central1'),
    ];
    for (const [property, label] of Object.entries(properties)) {
      if (pipeline[property]) {
        if (
          property === 'trainBudgetMilliNodeHours' ||
          property === 'budgetMilliNodeHours'
        ) {
          pipelineDetails.push(
            this.createData(label, this.getBudget(pipeline[property]))
          );
        } else if (property === 'createTime') {
          pipelineDetails.push(
            this.createData(label, pipeline[property].toLocaleString())
          );
        } else {
          pipelineDetails.push(this.createData(label, pipeline[property]));
        }
      }
    }
    return pipelineDetails;
  }

  private getError(): JSX.Element {
    if (this.props.pipeline.error) {
      return (
        <Alert severity="error">
          Training failed with message: {this.props.pipeline.error}
        </Alert>
      );
    }
    return null;
  }

  render() {
    return (
      <>
        {this.getError()}
        <Table size="small" style={{ width: 500 }}>
          <TableBody>
            {this.getPipelineDetails(this.props.pipeline).map(row =>
              row.key === 'Transformation options' ? (
                <TransformationOptionsRow
                  row={row}
                  transformationOptions={
                    this.props.pipeline.transformationOptions
                  }
                  key={row.key}
                />
              ) : (
                <TableRow key={row.key}>
                  <StyledTableCell scope="row">{row.key}</StyledTableCell>
                  <StyledTableCell align="right">{row.val}</StyledTableCell>
                </TableRow>
              )
            )}
          </TableBody>
        </Table>
      </>
    );
  }
}
