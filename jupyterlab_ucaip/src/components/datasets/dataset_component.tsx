import * as csstips from 'csstips';
import * as React from 'react';
import { stylesheet } from 'typestyle';
import { Dataset, DatasetService, Column } from '../../service/dataset';
import { CodeComponent } from '../copy_code';
import Toast from '../toast';
import { BASE_FONT } from 'gcp_jupyterlab_shared';
import { StripedRows } from '../striped_rows';
import {
  LinearProgress,
  FormControl,
  MenuItem,
  Select,
  FormHelperText,
  Grid,
  withStyles,
  TableCell,
  TableRow,
  TableHead,
  TableBody,
  Table,
  Button,
  TextField,
  Portal,
} from '@material-ui/core';

interface Props {
  dataset: Dataset;
}

interface State {
  isLoading: boolean;
  source: string;
  columns: Column[];
  targetColumn: string;
  predictionType: string;
  objective: string;
  budget: string;
  budgetError: boolean;
  trainingResponse: boolean;
}

const TableHeadCell = withStyles({
  root: {
    backgroundColor: '#f8f9fa',
    whiteSpace: 'nowrap',
    fontSize: '13px',
    padding: '4px 16px 4px 16px',
    borderTop: '1px  solid var(--jp-border-color2)',
    BASE_FONT,
  },
})(TableCell);

const StyledTableCell = withStyles({
  root: {
    fontSize: '13px',
    BASE_FONT,
  },
})(TableCell);

const localStyles = stylesheet({
  header: {
    borderBottom: 'var(--jp-border-width) solid var(--jp-border-color2)',
    fontSize: '18px',
    letterSpacing: '1px',
    margin: 0,
    padding: '12px 12px 12px 24px',
    fontFamily: 'Roboto',
  },
  title: {
    fontSize: '16px',
    letterSpacing: '1px',
    padding: '24px 0px 10px 8px',
    fontFamily: 'Roboto',
  },
  panel: {
    backgroundColor: 'white',
    height: '100%',
    ...csstips.vertical,
  },
  paper: {
    paddingLeft: '16px',
    textAlign: 'left',
    fontSize: 'var(--jp-ui-font-size1)',
  },
  list: {
    margin: 0,
    overflowY: 'scroll',
    padding: 0,
    ...csstips.flex,
    height: '550px',
  },
});

export class DatasetComponent extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      isLoading: false,
      source: '',
      columns: [],
      targetColumn: '',
      predictionType: 'classification',
      objective: 'minimize-log-loss',
      budget: '1',
      budgetError: false,
      trainingResponse: false,
    };
    this.getBasicString = this.getBasicString.bind(this);
    this.trainModel = this.trainModel.bind(this);
  }

  async componentDidMount() {
    this.getDatasetDetails();
    this.getDatasetSource();
  }

  private async getDatasetDetails() {
    try {
      this.setState({ isLoading: true });
      const columns = await DatasetService.getDatasetDetails(
        this.props.dataset.id
      );
      this.setState({
        columns: columns,
        targetColumn: columns[0].fieldName,
      });
    } catch (err) {
      console.warn('Error retrieving dataset details', err);
    } finally {
      this.setState({ isLoading: false });
    }
  }

  private async trainModel() {
    try {
      this.setState({ isLoading: true });
      const displayName = this.props.dataset.displayName;
      const transformations = [];
      for (let i = 0; i < this.state.columns.length; i++) {
        if (this.state.columns[i].fieldName !== this.state.targetColumn) {
          const column = { columnName: this.state.columns[i].fieldName };
          transformations.push({ auto: column });
        }
      }
      await DatasetService.trainModel(
        displayName + '_training',
        this.getDatasetId(),
        displayName + '_model',
        this.state.targetColumn,
        this.state.predictionType,
        this.state.objective,
        parseInt(this.state.budget),
        transformations
      );
      this.setState({ trainingResponse: true });
    } catch (err) {
      console.warn('Error creating training pipeline', err);
    } finally {
      this.setState({ isLoading: false });
    }
  }

  private getDatasetId(): string {
    const datasetId = this.props.dataset.id.split('/');
    return datasetId[datasetId.length - 1];
  }

  private getDatasetSource() {
    let source = '';
    const inputConfig = this.props.dataset.metadata['inputConfig'];
    if ('gcsSource' in inputConfig) {
      source = inputConfig['gcsSource']['uri'];
    } else if ('bigquerySource' in inputConfig) {
      source = inputConfig['bigquerySource']['uri'];
    }
    this.setState({
      source: source,
    });
  }

  private getBasicString(): string {
    const displayName = this.props.dataset.displayName;
    let columnString = '';
    for (let i = 0; i < this.state.columns.length; i++) {
      if (this.state.columns[i].fieldName !== this.state.targetColumn) {
        columnString +=
          "    'columnName': '" + this.state.columns[i].fieldName + "',\n";
      }
    }

    return `training_pipeline_name = '${displayName}_training'
dataset_id = '${this.getDatasetId()}'
model_name = '${displayName}_model'
target_column = '${this.state.targetColumn}'
prediction_type = '${this.state.predictionType}'
objective = '${this.state.objective}'
budget_hours = ${this.state.budget}
transformations = [{
  'auto': {
${columnString} }
}]`;
  }

  private getObjectivesForPredictionType(predictionType: string): string[] {
    if (predictionType === 'classification') {
      return [
        'minimize-log-loss',
        'maximize-au-roc',
        'maximize-au-prc',
        'maximize-precision-at-recall',
        'maximize-recall-at-precision',
      ];
    } else {
      return ['minimize-rmse', 'minimize-mae', 'minimize-rmsle'];
    }
  }

  render() {
    const { columns, source, isLoading } = this.state;
    if (isLoading) {
      return <LinearProgress />;
    } else {
      return (
        <div className={localStyles.panel}>
          <ul className={localStyles.list}>
            <header className={localStyles.header}>
              {this.props.dataset.displayName}
            </header>
            <div className={localStyles.paper}>
              <Grid item xs={9}>
                <div className={localStyles.title}>Dataset Info</div>
                <StripedRows
                  rows={[
                    {
                      name: 'Created',
                      value: this.props.dataset.createTime.toLocaleString(),
                    },
                    {
                      name: 'Total columns',
                      value: columns.length,
                    },
                    {
                      name: 'Dataset location',
                      value: source,
                    },
                  ]}
                />
              </Grid>
              <header className={localStyles.title}>Columns</header>
              <Table
                size="small"
                style={{ width: 'auto', tableLayout: 'auto' }}
              >
                <TableHead>
                  <TableRow>
                    <TableHeadCell>Field name</TableHeadCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {columns.map(column => {
                    return (
                      <TableRow key={column.fieldName}>
                        <StyledTableCell>{column.fieldName}</StyledTableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              <header className={localStyles.title}>
                Train Model on Dataset
              </header>
              <p style={{ padding: '0px 0px 10px 8px' }}>
                <i>
                  Select the target column, type of model, optimization
                  objective, and budget. Click button or run the generated code
                  in a notebook cell to create a training pipeline.
                </i>
              </p>
              <div style={{ paddingLeft: '16px' }}>
                <FormControl>
                  <Select
                    value={this.state.targetColumn}
                    onChange={event => {
                      this.setState({
                        targetColumn: event.target.value as string,
                      });
                    }}
                    displayEmpty
                  >
                    {columns.map(column => (
                      <MenuItem key={column.fieldName} value={column.fieldName}>
                        {column.fieldName}
                      </MenuItem>
                    ))}
                  </Select>
                  <FormHelperText>Target column</FormHelperText>
                </FormControl>
                <FormControl style={{ paddingLeft: '24px' }}>
                  <Select
                    value={this.state.predictionType}
                    onChange={event => {
                      const predictionType = event.target.value as string;
                      const objectives = this.getObjectivesForPredictionType(
                        predictionType
                      );
                      this.setState({ predictionType: predictionType });
                      this.setState({ objective: objectives[0] });
                    }}
                    displayEmpty
                    autoWidth={true}
                  >
                    <MenuItem value={'classification'}>
                      {'classification'}
                    </MenuItem>
                    <MenuItem value={'regression'}>{'regression'}</MenuItem>
                  </Select>
                  <FormHelperText>Prediction type</FormHelperText>
                </FormControl>
                <FormControl style={{ paddingLeft: '24px' }}>
                  <Select
                    value={this.state.objective}
                    onChange={event => {
                      this.setState({
                        objective: event.target.value as string,
                      });
                    }}
                    displayEmpty
                    autoWidth={true}
                  >
                    {this.getObjectivesForPredictionType(
                      this.state.predictionType
                    ).map(objective => (
                      <MenuItem key={objective} value={objective}>
                        {objective}
                      </MenuItem>
                    ))}
                  </Select>
                  <FormHelperText>Objective</FormHelperText>
                </FormControl>
                <TextField
                  style={{ paddingLeft: '24px', paddingTop: '3px' }}
                  error={this.state.budgetError}
                  onChange={event => {
                    let val = event.target.value;
                    if (isNaN(parseInt(val))) {
                      val = '1';
                      this.setState({
                        budget: val.toString(),
                        budgetError: true,
                      });
                    } else {
                      this.setState({
                        budget: parseInt(val).toString(),
                        budgetError: false,
                      });
                    }
                  }}
                  defaultValue={'1'}
                  inputProps={{
                    style: { fontSize: 'var(--jp-ui-font-size1)' },
                  }}
                  helperText="Budget"
                />
              </div>
              <CodeComponent>
                {`from jupyterlab_ucaip import create_training_pipeline

${this.getBasicString()}

create_training_pipeline(
  training_pipeline_name,
  dataset_id,
  model_name,
  target_column,
  prediction_type,
  objective,
  budget_hours,
  transformations,
)`}
              </CodeComponent>
              <Button
                disabled={this.state.isLoading}
                variant="contained"
                color="primary"
                size="small"
                style={{ marginBottom: '16px' }}
                onClick={this.trainModel}
              >
                Train Model
              </Button>
              <Portal>
                <Toast
                  open={this.state.trainingResponse}
                  message={
                    'Model is training. View training pipeline under training dropdown.'
                  }
                  onClose={() => {
                    this.setState({ trainingResponse: false });
                  }}
                  autoHideDuration={6000}
                />
              </Portal>
            </div>
          </ul>
        </div>
      );
    }
  }
}
