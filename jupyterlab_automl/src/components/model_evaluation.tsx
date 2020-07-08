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
  currentConfidenceInterval: number;
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
      currentConfidenceInterval: null,
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
      currentConfidenceInterval,
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
                      if (formatted !== currentConfidenceInterval) {
                        this.setState({
                          currentConfidenceInterval: formatted,
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
                  {currentConfidenceInterval}
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
              <Grid item xs={11}>
                <header className={localStyles.header}>
                  Feature Importance
                </header>
                <BarChart
                  width={500}
                  height={35 * featureImportance.length}
                  data={featureImportance}
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
                  <XAxis
                    type="number"
                    domain={[0, 100]}
                    tick={false}
                    hide={true}
                  />
                  <Tooltip />
                  <Bar dataKey="Percentage" fill="#3366CC" />
                </BarChart>
              </Grid>
            </Grid>
          </ul>
        )}
      </div>
    );
  }

  private createData(key: string, val: number | string | Date) {
    return { key, val };
  }

  private async getModelEvaluations() {
    try {
      this.setState({ isLoading: true });
      const modelEvaluation = await ModelService.listModelEvaluations(
        this.props.model.id
      );
      this.updateEvaluationTable(
        modelEvaluation.confidenceMetrics[0],
        modelEvaluation
      );
      const marks = [];
      for (let i = 0; i < modelEvaluation.confidenceMetrics.length; i++) {
        marks.push({
          value: modelEvaluation.confidenceMetrics[i].confidenceThreshold,
        });
      }
      this.setState({
        hasLoaded: true,
        marks: marks,
        currentConfidenceInterval:
          modelEvaluation.confidenceMetrics[0].confidenceThreshold / 100,
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

  private updateEvaluationTable(
    metric: ModelMetrics,
    modelEvaluation: ModelEvaluation
  ) {
    const evaluationTable = [
      this.createData('ROC PRC', modelEvaluation.auPrc),
      this.createData('ROC AUC', modelEvaluation.auRoc),
      this.createData('Log loss', modelEvaluation.logLoss),
      this.createData('F1 score', metric.f1Score),
      this.createData('Precision', metric.precision),
      this.createData('Recall', metric.recall),
      this.createData('Created', modelEvaluation.createTime),
    ];
    this.setState({
      evaluationTable: evaluationTable,
    });
  }
}
