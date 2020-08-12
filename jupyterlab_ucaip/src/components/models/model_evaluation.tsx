import {
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableRow,
  Grid,
  Slider,
  Paper,
} from '@material-ui/core';
import { Bar, BarChart, Tooltip, YAxis, XAxis } from 'recharts';
import * as React from 'react';
import {
  Model,
  ModelMetrics,
  ModelService,
  ModelEvaluation,
} from '../../service/model';
import { stylesheet } from 'typestyle';

interface Props {
  model: Model;
  value: number;
  index: number;
}

type ColWidth = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;

interface State {
  hasLoaded: boolean;
  isLoading: boolean;
  modelEvaluation: ModelEvaluation;
  // For classification tables models the following three variables determine what confidence metric is displayed
  sliderMarks: any[];
  currentThreshold: string;
  confidenceMetrics: ModelMetrics[];
  // Information for the first table displayed will get updated when the slider is moved
  evaluationTable: any[];
  // Information for the feature importance bar chart component
  featureImportance: any[];
  // Information for the confusion matrix component
  confusionMatrix: any[];
}

interface FeatureImportanceProps {
  featureImportance: any[];
}

interface ConfusionMatrixProps {
  confusionMatrix: any[];
}

const localStyles = stylesheet({
  header: {
    fontSize: '15px',
    fontWeight: 600,
    letterSpacing: '1px',
    margin: 0,
    padding: '8px 12px 12px 8px',
  },
  paper: {
    padding: 8,
    textAlign: 'center',
  },
});

const properties = {
  auPrc: 'ROC PRC',
  auRoc: 'ROC AUC',
  logLoss: 'Log loss',
  createTime: 'Created',
  rootMeanSquaredLogError: 'RMSLE',
  rSquared: 'R^2',
  meanAbsolutePercentageError: 'MAPE',
  rootMeanSquaredError: 'RMSE',
  meanAbsoluteError: 'MAE',
};

const confidenceMetricProperties = {
  f1Score: 'F1 score',
  precision: 'Precision',
  recall: 'Recall',
};

export class ConfusionMatrix extends React.Component<ConfusionMatrixProps> {
  constructor(props: ConfusionMatrixProps) {
    super(props);
  }

  private getConfusionMatrixSum(): number {
    let sum = 0;
    for (const [index, value] of this.props.confusionMatrix.entries()) {
      if (index !== 0) {
        sum += value.reduce(function(a, b) {
          return a + b;
        }, 0);
      }
    }
    return sum;
  }

  private getConfusionMatrix(): JSX.Element[] {
    const matrix = [];
    const sum = this.getConfusionMatrixSum();
    const rowWidth = this.props.confusionMatrix.length * 170;
    const colWidth = Math.round(
      12 / this.props.confusionMatrix.length
    ) as ColWidth;
    for (const [index, value] of this.props.confusionMatrix.entries()) {
      if (index === 0) {
        matrix.push(
          <Grid
            container
            alignItems="center"
            spacing={0}
            style={{ width: rowWidth }}
            key={index}
          >
            <Grid item xs={colWidth} key={'n'}>
              <Paper className={localStyles.paper} variant="outlined" square>
                n = {sum}
              </Paper>
            </Grid>
            {this.props.confusionMatrix[0].map(item => (
              <Grid item xs={colWidth} key={item}>
                <Paper className={localStyles.paper} variant="outlined" square>
                  Predicted: {item}
                </Paper>
              </Grid>
            ))}
          </Grid>
        );
      } else {
        matrix.push(
          <Grid
            container
            alignItems="center"
            spacing={0}
            style={{ width: rowWidth }}
            key={index}
          >
            <Grid item xs={colWidth} key={'label'}>
              <Paper className={localStyles.paper} variant="outlined" square>
                Actual: {this.props.confusionMatrix[0][index - 1]}
              </Paper>
            </Grid>
            {value.map(item => (
              <Grid item xs={colWidth} key={item}>
                <Paper className={localStyles.paper} variant="outlined" square>
                  {item}
                </Paper>
              </Grid>
            ))}
          </Grid>
        );
      }
    }
    return matrix;
  }

  render() {
    if (this.props.confusionMatrix) {
      return (
        <Grid item xs={12} key={'confusionMatrix'}>
          <header className={localStyles.header}>Confusion Matrix</header>
          {this.getConfusionMatrix()}
        </Grid>
      );
    }
    return null;
  }
}

export class FeatureImportance extends React.Component<FeatureImportanceProps> {
  constructor(props: FeatureImportanceProps) {
    super(props);
  }

  render() {
    if (this.props.featureImportance) {
      return (
        <Grid item xs={12}>
          <header className={localStyles.header}>Feature Importance</header>
          <BarChart
            width={500}
            height={35 * this.props.featureImportance.length}
            data={this.props.featureImportance}
            layout="vertical"
            margin={{
              top: 5,
              bottom: 5,
              left: 100,
              right: 5,
            }}
          >
            <YAxis
              type="category"
              dataKey="name"
              tickLine={false}
              tick={{ fill: 'black' }}
            />
            <XAxis type="number" domain={[0, 100]} tick={false} hide={true} />
            <Tooltip />
            <Bar dataKey="Percentage" fill="#3366CC" />
          </BarChart>
        </Grid>
      );
    }
    return null;
  }
}

export class EvaluationTable extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasLoaded: false,
      isLoading: false,
      modelEvaluation: null,
      sliderMarks: null,
      currentThreshold: null,
      confidenceMetrics: [],
      evaluationTable: [],
      featureImportance: [],
      confusionMatrix: [],
    };
  }

  async componentDidMount() {
    this.getModelEvaluations();
  }

  private createData(key: string, val: number | string | Date) {
    return { key, val };
  }

  private getSliderMarks(modelEvaluation: ModelEvaluation): any[] {
    const sliderMarks = [];
    for (let i = 0; i < modelEvaluation.confidenceMetrics.length; i++) {
      sliderMarks.push({
        value: modelEvaluation.confidenceMetrics[i].confidenceThreshold,
      });
    }
    return sliderMarks;
  }

  private getConfidenceSlider(sliderMarks: any[]): JSX.Element {
    if (sliderMarks) {
      return (
        <p style={{ marginBottom: 16, marginLeft: 16 }}>
          Confidence Threshold
          <Slider
            step={null}
            marks={sliderMarks}
            style={{
              width: 200,
              margin: '0 24px 0 24px',
              paddingBottom: 5,
            }}
            onChange={(event, value) => {
              const formatted = ((value as number) / 100).toFixed(2);
              if (formatted !== this.state.currentThreshold) {
                this.setState({
                  currentThreshold: formatted,
                });
              }
            }}
            onChangeCommitted={(event, value) => {
              const metric = this.state.confidenceMetrics.filter(
                metric => metric.confidenceThreshold === value
              )[0];
              this.updateEvaluationTable(metric, this.state.modelEvaluation);
            }}
          />
          {this.state.currentThreshold}
        </p>
      );
    }
    return null;
  }

  private getConfidenceMetricRows(metric): any[] {
    const confidenceMetricRows = [];
    for (const [name, label] of Object.entries(confidenceMetricProperties)) {
      if (metric[name] !== 'NaN') {
        confidenceMetricRows.push(
          this.createData(label, (metric[name] as number).toFixed(3))
        );
      }
    }
    return confidenceMetricRows;
  }

  private updateEvaluationTable(
    metric: ModelMetrics,
    modelEvaluation: ModelEvaluation
  ) {
    let evaluationTable = [];
    for (const [name, label] of Object.entries(properties)) {
      if (modelEvaluation[name]) {
        if (name === 'createTime') {
          evaluationTable.push(
            this.createData(label, modelEvaluation[name].toLocaleString())
          );
        } else if (typeof modelEvaluation[name] === 'number') {
          evaluationTable.push(
            this.createData(label, modelEvaluation[name].toFixed(3))
          );
        } else if (modelEvaluation[name] !== 'NaN') {
          evaluationTable.push(this.createData(label, modelEvaluation[name]));
        }
      }
    }
    if (metric) {
      evaluationTable = evaluationTable.concat(
        this.getConfidenceMetricRows(metric)
      );
    }
    this.setState({
      evaluationTable: evaluationTable,
    });
  }

  private async getModelEvaluations() {
    try {
      this.setState({ isLoading: true });
      const modelEvaluation = await ModelService.getModelEvaluation(
        this.props.model.id
      );
      if (modelEvaluation.confidenceMetrics) {
        const firstMetric = modelEvaluation.confidenceMetrics[0];
        this.updateEvaluationTable(firstMetric, modelEvaluation);
        const currentConfidence = (
          firstMetric.confidenceThreshold / 100
        ).toFixed(2);
        this.setState({
          sliderMarks: this.getSliderMarks(modelEvaluation),
          currentThreshold: currentConfidence,
          confidenceMetrics: modelEvaluation.confidenceMetrics,
        });
      } else {
        this.updateEvaluationTable(null, modelEvaluation);
      }
      this.setState({
        hasLoaded: true,
        featureImportance: modelEvaluation.featureImportance,
        modelEvaluation: modelEvaluation,
        confusionMatrix: modelEvaluation.confusionMatrix,
      });
    } catch (err) {
      console.warn('Error retrieving model evaluations', err);
    } finally {
      this.setState({ isLoading: false });
    }
  }

  render() {
    const {
      isLoading,
      evaluationTable,
      sliderMarks,
      featureImportance,
      confusionMatrix,
    } = this.state;
    return (
      <div
        hidden={this.props.value !== this.props.index}
        style={{ marginTop: '16px' }}
      >
        {isLoading ? (
          <LinearProgress />
        ) : (
          <Grid
            container
            style={{ margin: '0px', width: '100%' }}
            spacing={3}
            direction="column"
          >
            <Grid item xs={12}>
              {this.getConfidenceSlider(sliderMarks)}
              <Table size="small" style={{ width: 500 }}>
                <TableBody>
                  {evaluationTable.map(row => (
                    <TableRow key={row.key}>
                      <TableCell scope="row">{row.key}</TableCell>
                      <TableCell align="right">{row.val}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Grid>
            <FeatureImportance featureImportance={featureImportance} />
            <ConfusionMatrix confusionMatrix={confusionMatrix} />
          </Grid>
        )}
      </div>
    );
  }
}
