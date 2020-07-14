import {
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableRow,
  Collapse,
  IconButton,
  TableHead,
  Box,
} from '@material-ui/core';
import { KeyboardArrowUp, KeyboardArrowDown } from '@material-ui/icons';
import * as React from 'react';
import { Model, ModelService, Pipeline } from '../service/model';

interface Props {
  model: Model;
  value: number;
  index: number;
}

interface State {
  hasLoaded: boolean;
  isLoading: boolean;
  modelDetails: any[];
  transformationOptions: any[];
  open: boolean;
}

interface RowProps {
  row: any;
  transformationOptions: any[];
}

interface RowState {
  open: boolean;
}

const properties = [
  {
    name: 'createTime',
    label: 'Created',
  },
  {
    name: 'trainBudgetMilliNodeHours',
    label: 'Budget',
  },
  {
    name: 'budgetMilliNodeHours',
    label: 'Budget',
  },
  {
    name: 'elapsedTime',
    label: 'Elapsed Time',
  },
  {
    name: 'datasetId',
    label: 'Dataset ID',
  },
  {
    name: 'targetColumn',
    label: 'Target column',
  },
  {
    name: 'transformationOptions',
    label: 'Transformation options',
  },
  {
    name: 'predictionType',
    label: 'Objective',
  },
  {
    name: 'optimizationObjective',
    label: 'Optimized for',
  },
];

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
          <TableCell component="th" scope="row">
            {this.props.row.key}
          </TableCell>
          <TableCell align="right">
            <IconButton
              aria-label="expand row"
              size="small"
              onClick={() => {
                this.setState({ open: !this.state.open });
              }}
            >
              {this.state.open ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
            </IconButton>
          </TableCell>
        </TableRow>
        <TableRow key={'Collapse'}>
          <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
            <Collapse in={this.state.open} timeout="auto" unmountOnExit>
              <Box margin={1}>
                <Table size="small" aria-label="purchases">
                  <TableHead>
                    <TableRow>
                      <TableCell>Column name</TableCell>
                      <TableCell>Transformation</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {this.props.transformationOptions.map(option => (
                      <TableRow key={option.columnName}>
                        <TableCell component="th" scope="row">
                          {option.columnName}
                        </TableCell>
                        <TableCell>{option.dataType}</TableCell>
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
}

export class ModelProperties extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasLoaded: false,
      isLoading: false,
      modelDetails: [],
      transformationOptions: [],
      open: false,
    };
  }

  async componentDidMount() {
    this.getPipeline();
  }

  private getBudget(milliNodeHours: number): string {
    return (milliNodeHours / 1000).toString() + ' node hours';
  }

  private getElapsedTime(totalSeconds: number): string {
    let minutes = Math.floor(totalSeconds / 60);
    if (minutes > 60) {
      const hours = Math.floor(minutes / 60);
      minutes = minutes - hours * 60;
      const seconds = totalSeconds - hours * 60 * 60 - minutes * 60;
      return hours + 'hr ' + minutes + ' min ' + seconds + ' sec';
    } else {
      const seconds = totalSeconds - minutes * 60;
      return minutes + ' min ' + seconds + ' sec';
    }
  }

  private createData(key: string, val: any) {
    return { key, val };
  }

  private getModelDetails(pipeline: Pipeline): any[] {
    const modelId = this.props.model.id.split('/');
    const modelDetails = [
      this.createData('ID', modelId[modelId.length - 1]),
      this.createData('Region', 'us-central1'),
    ];
    for (let i = 0; i < properties.length; i++) {
      if (pipeline[properties[i]['name']]) {
        if (
          properties[i]['name'] === 'trainBudgetMilliNodeHours' ||
          properties[i]['name'] === 'budgetMilliNodeHours'
        ) {
          modelDetails.push(
            this.createData(
              properties[i]['label'],
              this.getBudget(pipeline[properties[i]['name']])
            )
          );
        } else if (properties[i]['name'] === 'elapsedTime') {
          modelDetails.push(
            this.createData(
              properties[i]['label'],
              this.getElapsedTime(pipeline[properties[i]['name']])
            )
          );
        } else if (properties[i]['name'] === 'createTime') {
          modelDetails.push(
            this.createData(
              properties[i]['label'],
              pipeline[properties[i]['name']].toLocaleString()
            )
          );
        } else {
          modelDetails.push(
            this.createData(
              properties[i]['label'],
              pipeline[properties[i]['name']]
            )
          );
        }
      }
    }
    return modelDetails;
  }

  private async getPipeline() {
    try {
      this.setState({ isLoading: true });
      const pipeline = await ModelService.getPipeline(
        this.props.model.pipelineId
      );
      const modelDetails = this.getModelDetails(pipeline);
      this.setState({
        hasLoaded: true,
        modelDetails: modelDetails,
        transformationOptions: pipeline.transformationOptions,
      });
    } catch (err) {
      console.warn('Error retrieving pipeline', err);
    } finally {
      this.setState({ isLoading: false });
    }
  }

  render() {
    const { isLoading, modelDetails, transformationOptions } = this.state;
    return (
      <div
        hidden={this.props.value !== this.props.index}
        style={{ marginTop: '16px' }}
      >
        {isLoading ? (
          <LinearProgress />
        ) : (
          <Table size="small" style={{ width: 500 }}>
            <TableBody>
              {modelDetails.map(row =>
                row.key === 'Transformation options' ? (
                  <TransformationOptionsRow
                    row={row}
                    transformationOptions={transformationOptions}
                    key={row.key}
                  />
                ) : (
                  <TableRow key={row.key}>
                    <TableCell component="th" scope="row">
                      {row.key}
                    </TableCell>
                    <TableCell align="right">{row.val}</TableCell>
                  </TableRow>
                )
              )}
            </TableBody>
          </Table>
        )}
      </div>
    );
  }
}
