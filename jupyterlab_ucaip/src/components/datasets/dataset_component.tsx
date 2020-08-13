import * as csstips from 'csstips';
import * as React from 'react';
import { stylesheet } from 'typestyle';
import { CodeGenService } from '../../service/code_gen';
import { Column, Dataset, DatasetService } from '../../service/dataset';
import { CodeComponent } from '../copy_code';
import { ListResourcesTable } from 'gcp_jupyterlab_shared';
import {
  LinearProgress,
  FormControl,
  MenuItem,
  Select,
  FormHelperText,
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
}

const localStyles = stylesheet({
  header: {
    borderBottom: 'var(--jp-border-width) solid var(--jp-border-color2)',
    fontSize: '14px',
    letterSpacing: '1px',
    margin: 0,
    padding: '8px 12px 8px 24px',
  },
  title: {
    fontSize: '15px',
    fontWeight: 600,
    letterSpacing: '1px',
    margin: 0,
    padding: '8px',
  },
  panel: {
    backgroundColor: 'white',
    height: '100%',
    ...csstips.vertical,
  },
  paper: {
    padding: '16px',
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
    };
    this.getColumnString = this.getColumnString.bind(this);
    this.getBasicString = this.getBasicString.bind(this);
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

  private getColumnString(): string {
    let columnString = '';
    for (let i = 0; i < this.state.columns.length; i++) {
      if (this.state.columns[i].fieldName !== this.state.targetColumn) {
        columnString +=
          "    'columnName': '" + this.state.columns[i].fieldName + "',\n";
      }
    }
    return columnString;
  }

  private getBasicString(): string {
    const datasetId = this.props.dataset.id.split('/');
    const displayName = this.props.dataset.displayName;

    return `training_pipeline_name = '${displayName}_training'
dataset_id = '${datasetId[datasetId.length - 1]}'
model_name = '${displayName}_model'
target_column = '${this.state.targetColumn}'
prediction_type = '${this.state.predictionType}'
objective = '${this.state.objective}'
budget_hours = 1
transformations = [{
  'auto': {
${this.getColumnString()} }
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
              <header className={localStyles.title}>Dataset Info</header>
              <p style={{ padding: '8px' }}>
                Created: {this.props.dataset.createTime.toLocaleString()}
              </p>
              <p style={{ padding: '8px' }}>Total columns: {columns.length}</p>
              <p style={{ padding: '8px' }}>Dataset location: {source}</p>
              <header className={localStyles.title}>Columns</header>
              <div style={{ width: '500px' }}>
                <ListResourcesTable
                  columns={[
                    {
                      field: 'fieldName',
                      title: 'Field Name',
                    },
                  ]}
                  data={columns}
                  height={columns.length * 40 + 40}
                  width={200}
                />
              </div>
              <header className={localStyles.title}>
                Train Model on Dataset
              </header>
              <p style={{ padding: '8px' }}>
                <i>
                  Select the target column, type of model, and optimization
                  objective. Click button or run the generated code in a
                  notebook cell to create a training pipeline.
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
                  >
                    <MenuItem key={'classification'} value={'classification'}>
                      {'classification'}
                    </MenuItem>
                    <MenuItem key={'regression'} value={'regression'}>
                      {'regression'}
                    </MenuItem>
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
            </div>
          </ul>
        </div>
      );
    }
  }
}
