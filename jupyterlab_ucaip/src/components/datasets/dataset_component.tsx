import * as csstips from 'csstips';
import * as React from 'react';
import { stylesheet } from 'typestyle';
import { Dataset, DatasetService, Column } from '../../service/dataset';
import { CodeComponent } from '../copy_code';
import { ListResourcesTable, SelectInput, Option } from 'gcp_jupyterlab_shared';
import { LinearProgress } from '@material-ui/core';

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

  private getObjectivesForPredictionType(predictionType: string): Option[] {
    if (predictionType === 'classification') {
      return [
        {
          text: 'minimize-log-loss',
          value: 'minimize-log-loss',
        },
        {
          text: 'maximize-au-roc',
          value: 'maximize-au-roc',
        },
        {
          text: 'maximize-au-prc',
          value: 'maximize-au-prc',
        },
        {
          text: 'maximize-precision-at-recall',
          value: 'maximize-precision-at-recall',
        },
        {
          text: 'maximize-recall-at-precision',
          value: 'maximize-recall-at-precision',
        },
      ];
    } else {
      return [
        {
          text: 'minimize-rmse',
          value: 'minimize-rmse',
        },
        {
          text: 'minimize-mae',
          value: 'minimize-mae',
        },
        {
          text: 'minimize-rmsle',
          value: 'minimize-rmsle',
        },
      ];
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
                Import Dataset as Pandas Dataframe
              </header>
              <CodeComponent>
                {`from jupyterlab_ucaip import import_dataset
df = import_dataset('${this.props.dataset.id}')`}
              </CodeComponent>
              <header className={localStyles.title}>
                Code Sample to Train Model on Dataset
              </header>
              <p style={{ padding: '8px' }}>
                <i>
                  Select the target column, type of model, and optimization
                  objective. Then run the generated code in a notebook cell to
                  create a training pipeline.
                </i>
              </p>
              <div style={{ width: '250px', paddingLeft: '16px' }}>
                <SelectInput
                  label={'Target column'}
                  options={columns.map(column => ({
                    text: column.fieldName,
                    value: column.fieldName,
                  }))}
                  onChange={event => {
                    this.setState({ targetColumn: event.target.value });
                  }}
                />
                <SelectInput
                  label={'Prediction type'}
                  options={[
                    {
                      text: 'classification',
                      value: 'classification',
                    },
                    {
                      text: 'regression',
                      value: 'regression',
                    },
                  ]}
                  onChange={event => {
                    const predictionType = event.target.value;
                    const objectives = this.getObjectivesForPredictionType(
                      predictionType
                    );
                    this.setState({ predictionType: predictionType });
                    this.setState({ objective: objectives[0].text });
                  }}
                />
                <SelectInput
                  label={'Objective'}
                  options={this.getObjectivesForPredictionType(
                    this.state.predictionType
                  )}
                  onChange={event => {
                    this.setState({ objective: event.target.value });
                  }}
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
            </div>
          </ul>
        </div>
      );
    }
  }
}
