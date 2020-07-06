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
import { stylesheet } from 'typestyle';
import { Model, ModelService } from '../service/model';
import * as csstips from 'csstips';

interface Props {
  model: Model;
}

interface State {
  hasLoaded: boolean;
  isLoading: boolean;
  modelDetails: any[];
  transformationOptions: any[];
  open: boolean;
}

const localStyles = stylesheet({
  header: {
    borderBottom: 'var(--jp-border-width) solid var(--jp-border-color2)',
    fontSize: '14px',
    letterSpacing: '1px',
    margin: 0,
    padding: '8px 12px 8px 24px',
  },
  panel: {
    backgroundColor: 'white',
    height: '100%',
    ...csstips.vertical,
  },
});

export class ModelComponent extends React.Component<Props, State> {
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

  render() {
    const { isLoading, modelDetails } = this.state;
    return (
      <div className={localStyles.panel}>
        <header className={localStyles.header}>Model Properties</header>
        {isLoading ? (
          <LinearProgress />
        ) : (
          <Table size="small" style={{ width: 500 }}>
            <TableBody>
              {modelDetails.map(row =>
                row.key === 'Transformation options' ? (
                  <React.Fragment>
                    <TableRow key={row.key}>
                      <TableCell component="th" scope="row">
                        {row.key}
                      </TableCell>
                      <TableCell align="right">
                        <IconButton
                          aria-label="expand row"
                          size="small"
                          onClick={() => {
                            console.log(this.state.transformationOptions);
                            this.setState({ open: !this.state.open });
                          }}
                        >
                          {this.state.open ? (
                            <KeyboardArrowUp />
                          ) : (
                            <KeyboardArrowDown />
                          )}
                        </IconButton>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell
                        style={{ paddingBottom: 0, paddingTop: 0 }}
                        colSpan={6}
                      >
                        <Collapse
                          in={this.state.open}
                          timeout="auto"
                          unmountOnExit
                        >
                          <Box margin={1}>
                            <Table size="small" aria-label="purchases">
                              <TableHead>
                                <TableRow>
                                  <TableCell>Column name</TableCell>
                                  <TableCell>Transformation</TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {this.state.transformationOptions.map(
                                  option => (
                                    <TableRow key={option.columnName}>
                                      <TableCell component="th" scope="row">
                                        {option.columnName}
                                      </TableCell>
                                      <TableCell>{option.dataType}</TableCell>
                                    </TableRow>
                                  )
                                )}
                              </TableBody>
                            </Table>
                          </Box>
                        </Collapse>
                      </TableCell>
                    </TableRow>
                  </React.Fragment>
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

  private async getPipeline() {
    try {
      this.setState({ isLoading: true });
      const pipeline = await ModelService.getPipeline(
        this.props.model.pipelineId
      );
      const modelId = this.props.model.id.split('/');
      const modelDetails = [
        this.createData('ID', modelId[modelId.length - 1]),
        this.createData('Created', pipeline.createTime),
        this.createData('Budget', this.getBudget(pipeline.budget)),
        this.createData(
          'Elapsed Time',
          this.getElapsedTime(pipeline.elapsedTime)
        ),
        this.createData('Region', 'us-central1'),
        // TODO @josiegarza when you click this ID should launch dataset widget for ID
        this.createData('Dataset ID', pipeline.datasetId),
        this.createData('Target column', pipeline.targetColumn),
        this.createData('Transformation options', 'click here'),
        this.createData('Objective', pipeline.objective),
        this.createData('Optimized for', pipeline.optimizedFor),
      ];
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
}
