import * as csstips from 'csstips';
import * as React from 'react';
import { stylesheet } from 'typestyle';
import { Dataset, DatasetService, Column } from '../service/dataset';
import { CopyCode } from './copy_code';
import { ListResourcesTable, SelectInput } from 'gcp_jupyterlab_shared';
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
  }

  async componentDidMount() {
    this.getDatasetDetails();
    this.getDatasetSource();
  }

  render() {
    const { columns, source, isLoading } = this.state;
    const datasetId = this.props.dataset.id.split('/');
    const exportDataset = `from jupyterlab_automl import *
    
df = export_dataset('${this.props.dataset.id}')`.trim();
    const columnString = this.getColumnString();
    const basics = `training_pipeline_name = '${
      this.props.dataset.displayName
    }_training'
dataset_id = '${datasetId[datasetId.length - 1]}'
model_name = '${this.props.dataset.displayName}_model'
target_column = '${this.state.targetColumn}'
prediction_type = '${this.state.predictionType}'
objective = '${this.state.objective}'
budget_hours = 1
transformations = [{
  'auto': {
${columnString} }
}]`;
    const trainModel = `from jupyterlab_automl import *

${basics}

create_training_pipeline(
  training_pipeline_name,
  dataset_id,
  model_name,
  target_column,
  prediction_type,
  objective,
  budget_hours,
  transformations,
)`.trim();
    const expandedTrainModel = `from google.cloud import aiplatform_v1alpha1
from google.protobuf.struct_pb2 import Value
from google.protobuf import json_format

${basics}
parent = '${datasetId.slice(0, 4).join('/')}'
client_options = dict(api_endpoint="us-central1-aiplatform.googleapis.com")
client = aiplatform_v1alpha1.PipelineServiceClient(client_options=client_options)

training_task_inputs = {
  "targetColumn": target_column,
  # supported prediction types:
  # regression, classification
  "predictionType": prediction_type,
  "transformations": transformations,
  "trainBudgetMilliNodeHours": budget_hours * 1000,
  "disableEarlyStopping": False,
  # supported binary classification optimisation objectives:
  # maximize-au-roc, minimize-log-loss, maximize-au-prc,
  # supported multi-class classification optimisation objective:
  # minimize-log-loss
  # supported regression optimization objectives:
  # minimize-rmse, minimize-mae, minimize-rmsle
  "optimizationObjective": objective,
}

training_pipeline = {
  "display_name": training_pipeline_name,
  "training_task_definition": 
    "gs://google-cloud-aiplatform/schema/trainingjob/definition/automl_tables_1.0.0.yaml",
  "training_task_inputs": json_format.ParseDict(training_task_inputs, Value()),
  "input_data_config": {
    "dataset_id": dataset_id,
    "fraction_split": {
      "training_fraction": 0.8,
      "validation_fraction": 0.1,
      "test_fraction": 0.1,
    },
  },
  "model_to_upload": {"display_name": model_name},
}

response = client.create_training_pipeline(
    parent=parent, training_pipeline=training_pipeline
)`;
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
                Export Dataset to Dataframe
              </header>
              <CopyCode code={exportDataset} />
              <header className={localStyles.title}>
                Train Model on Dataset
              </header>
              <p style={{ padding: '8px' }}>
                <i>
                  Code to train a basic classification or regression model on
                  the dataset.
                </i>
              </p>
              <div style={{ width: '250px', paddingLeft: '16px' }}>
                <SelectInput
                  label={'Target column'}
                  options={this.state.columns.map(column => ({
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
                    this.setState({ predictionType: event.target.value });
                    if (event.target.value === 'regression') {
                      this.setState({ objective: 'minimize-rmse' });
                    } else {
                      this.setState({ objective: 'minimize-log-loss' });
                    }
                  }}
                />
              </div>
              <CopyCode code={trainModel} />
              <header className={localStyles.title}>
                Train Model on Dataset Expanded
              </header>
              <p style={{ padding: '8px' }}>
                <i>
                  Expanded version of the code above which allows for more model
                  training customization.
                </i>
              </p>
              <CopyCode code={expandedTrainModel} />
            </div>
          </ul>
        </div>
      );
    }
  }

  private getDatasetSource() {
    let source = '';
    if ('gcsSource' in this.props.dataset.metadata['inputConfig']) {
      source = this.props.dataset.metadata['inputConfig']['gcsSource']['uri'];
    } else if ('bigquerySource' in this.props.dataset.metadata['inputConfig']) {
      source = this.props.dataset.metadata['inputConfig']['bigquerySource'][
        'uri'
      ];
    }
    this.setState({
      source: source,
    });
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
      console.warn('Error retrieving pipeline', err);
    } finally {
      this.setState({ isLoading: false });
    }
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
}
