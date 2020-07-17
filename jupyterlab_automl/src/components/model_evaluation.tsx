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
} from '../service/model';
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
  evaluationTable: any[];
  featureImportance: any[];
  confidenceMetrics: ModelMetrics[];
  marks: any[];
  modelEvaluation: ModelEvaluation;
  currentConfidenceThresh: string;
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
};

export class ConfusionMatrix extends React.Component<ConfusionMatrixProps> {
  constructor(props: ConfusionMatrixProps) {
    super(props);
  }

  render() {
    const matrix = [];
    let sum = 0;
    for (const [index, value] of this.props.confusionMatrix.entries()) {
      if (index !== 0) {
        sum += value.reduce(function(a, b) {
          return a + b;
        }, 0);
      }
    }
    const width = this.props.confusionMatrix.length * 170;
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
            style={{ width: width }}
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
            style={{ width: width }}
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
    return (
      <Grid item xs={12} key={'confusionMatrix'}>
        <header className={localStyles.header}>Confusion Matrix</header>
        {matrix}
      </Grid>
    );
  }
}

export class FeatureImportance extends React.Component<FeatureImportanceProps> {
  constructor(props: FeatureImportanceProps) {
    super(props);
  }

  render() {
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
            left: 55,
            right: 35,
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
}

export class EvaluationTable extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasLoaded: false,
      isLoading: false,
      evaluationTable: [],
      featureImportance: [],
      confidenceMetrics: [],
      marks: [],
      modelEvaluation: null,
      currentConfidenceThresh: null,
      confusionMatrix: [],
    };
  }

  async componentDidMount() {
    this.getModelEvaluations();
  }

  render() {
    const {
      isLoading,
      evaluationTable,
      confidenceMetrics,
      featureImportance,
      marks,
      modelEvaluation,
      currentConfidenceThresh,
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
              <p style={{ marginBottom: 16, marginLeft: 16 }}>
                Confidence Threshold
                <Slider
                  step={null}
                  marks={marks}
                  style={{
                    width: 200,
                    margin: '0 24px 0 24px',
                    paddingBottom: 5,
                  }}
                  onChange={(event, value) => {
                    const formatted = ((value as number) / 100).toFixed(2);
                    if (formatted !== currentConfidenceThresh) {
                      this.setState({
                        currentConfidenceThresh: formatted,
                      });
                    }
                  }}
                  onChangeCommitted={(event, value) => {
                    const metric = confidenceMetrics.filter(
                      metric => metric.confidenceThreshold === value
                    )[0];
                    this.updateEvaluationTable(metric, modelEvaluation);
                  }}
                />
                {currentConfidenceThresh}
              </p>
              <Table size="small" style={{ width: 500 }}>
                <TableBody>
                  {evaluationTable.map(row => (
                    <TableRow key={row.key}>
                      <TableCell component="th" scope="row">
                        {row.key}
                      </TableCell>
                      <TableCell align="right">{row.val}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Grid>
            {featureImportance ? (
              <FeatureImportance featureImportance={featureImportance} />
            ) : (
              <></>
            )}
            <ConfusionMatrix confusionMatrix={confusionMatrix} />
          </Grid>
        )}
      </div>
    );
  }

  private createData(key: string, val: number | string | Date) {
    return { key, val };
  }

  private getSliderMarks(modelEvaluation: ModelEvaluation): any[] {
    const marks = [];
    for (let i = 0; i < modelEvaluation.confidenceMetrics.length; i++) {
      marks.push({
        value: modelEvaluation.confidenceMetrics[i].confidenceThreshold,
      });
    }
    return marks;
  }

  private updateEvaluationTable(
    metric: ModelMetrics,
    modelEvaluation: ModelEvaluation
  ) {
    const evaluationTable = [];
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
        } else {
          evaluationTable.push(this.createData(label, modelEvaluation[name]));
        }
      }
    }
    if (metric.f1Score !== 'NaN') {
      evaluationTable.push(
        this.createData('F1 score', (metric.f1Score as number).toFixed(3))
      );
    }
    if (metric.precision !== 'NaN') {
      evaluationTable.push(
        this.createData('Precision', (metric.precision as number).toFixed(3))
      );
    }
    if (metric.recall !== 'NaN') {
      evaluationTable.push(
        this.createData('Recall', (metric.recall as number).toFixed(3))
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
      const firstMetric = modelEvaluation.confidenceMetrics[0];
      this.updateEvaluationTable(firstMetric, modelEvaluation);
      this.setState({
        hasLoaded: true,
        marks: this.getSliderMarks(modelEvaluation),
        currentConfidenceThresh: (
          firstMetric.confidenceThreshold / 100
        ).toFixed(2),
        confidenceMetrics: modelEvaluation.confidenceMetrics,
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
}
