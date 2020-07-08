import {
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableRow,
  Grid,
  Slider,
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

interface State {
  hasLoaded: boolean;
  isLoading: boolean;
  evaluationTable: any[];
  featureImportance: any[];
  confidenceMetrics: ModelMetrics[];
  marks: any[];
  modelEvaluation: ModelEvaluation;
  currentConfidenceThresh: number;
}

interface FeatureImportanceProps {
  featureImportance: any[];
}

const localStyles = stylesheet({
  list: {
    margin: 0,
    overflowY: 'scroll',
    padding: 0,
  },
  header: {
    fontSize: '15px',
    fontWeight: 600,
    letterSpacing: '1px',
    margin: 0,
    padding: '8px 12px 12px 8px',
  },
});

const properties = [
  {
    name: 'auPrc',
    label: 'ROC PRC',
  },
  {
    name: 'auRoc',
    label: 'ROC AUC',
  },
  {
    name: 'logLoss',
    label: 'Log loss',
  },
  {
    name: 'elapsedTime',
    label: 'Elapsed Time',
  },
  {
    name: 'createTime',
    label: 'Created',
  },
];

export class FeatureImportance extends React.Component<FeatureImportanceProps> {
  constructor(props: FeatureImportanceProps) {
    super(props);
  }

  render() {
    return (
      <Grid item xs={11}>
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
    } = this.state;
    return (
      <div
        hidden={this.props.value !== this.props.index}
        style={{ marginTop: '16px' }}
      >
        {isLoading ? (
          <LinearProgress />
        ) : (
          <ul className={localStyles.list}>
            <Grid
              container
              style={{ margin: '0px', width: '100%' }}
              spacing={3}
              direction="column"
            >
              <Grid item xs={11}>
                <p style={{ margin: 16 }}>
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
                      const formatted = (value as number) / 100;
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
            </Grid>
          </ul>
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
    for (let i = 0; i < properties.length; i++) {
      if (modelEvaluation[properties[i]['name']]) {
        evaluationTable.push(
          this.createData(
            properties[i]['label'],
            modelEvaluation[properties[i]['name']]
          )
        );
      }
    }
    if (metric.f1Score !== 'NaN') {
      evaluationTable.push(this.createData('F1 score', metric.f1Score));
    }
    evaluationTable.push(this.createData('Precision', metric.precision));
    evaluationTable.push(this.createData('Recall', metric.recall));
    this.setState({
      evaluationTable: evaluationTable,
    });
  }

  private async getModelEvaluations() {
    try {
      this.setState({ isLoading: true });
      const modelEvaluation = await ModelService.listModelEvaluations(
        this.props.model.id
      );
      const firstMetric = modelEvaluation.confidenceMetrics[0];
      this.updateEvaluationTable(firstMetric, modelEvaluation);
      this.setState({
        hasLoaded: true,
        marks: this.getSliderMarks(modelEvaluation),
        currentConfidenceThresh: firstMetric.confidenceThreshold / 100,
        confidenceMetrics: modelEvaluation.confidenceMetrics,
        featureImportance: modelEvaluation.featureImportance,
        modelEvaluation: modelEvaluation,
      });
    } catch (err) {
      console.warn('Error retrieving model evaluations', err);
    } finally {
      this.setState({ isLoading: false });
    }
  }
}
