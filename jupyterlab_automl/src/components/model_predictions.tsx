import * as React from 'react';
import { Model, ModelService, DeployedModel, Pipeline } from '../service/model';
import {
  SubmitButton,
  TextInput,
  ListResourcesTable,
} from 'gcp_jupyterlab_shared';
import Alert from '@material-ui/lab/Alert';
import {
  LinearProgress,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from '@material-ui/core';
import { CopyCode } from './copy_code';

interface Props {
  model: Model;
  value: number;
  index: number;
  pipeline: Pipeline;
}

interface State {
  isLoading: boolean;
  deployedModels: DeployedModel[];
  deployedState: number;
  inputParameters: object;
  predictReady: boolean;
  result: JSX.Element;
}

export class ModelPredictions extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      isLoading: false,
      deployedModels: null,
      deployedState: -1,
      inputParameters: {},
      predictReady: false,
      result: null,
    };
    this.deployModel = this.deployModel.bind(this);
    // this.undeployModel = this.undeployModel.bind(this);
    this.handleInputChange = this.handleInputChange.bind(this);
    this.handleReset = this.handleReset.bind(this);
    this.isPredictReady = this.isPredictReady.bind(this);
    this.handlePredict = this.handlePredict.bind(this);
    this.handleGeneratePython = this.handleGeneratePython.bind(this);
    this.checkDeployed = this.checkDeployed.bind(this);
  }

  async componentDidMount() {
    this.checkDeployed();
  }

  private async checkDeployed() {
    try {
      this.setState({ isLoading: true });
      const check = await ModelService.checkDeployed(this.props.model.id);
      let deployedModels = null;
      if (check.state === 1) {
        deployedModels = check.deployedModels;
      }
      this.setState({
        deployedState: check.state,
        deployedModels: deployedModels,
      });
    } catch (err) {
      console.warn('Error checking if model is already deployed', err);
    } finally {
      this.setState({ isLoading: false });
    }
  }

  private async deployModel() {
    try {
      this.setState({ isLoading: true });
      await ModelService.deployModel(this.props.model.id);
      this.setState({
        deployedState: 0,
      });
    } catch (err) {
      console.warn('Error deploying model', err);
    } finally {
      this.setState({ isLoading: false });
    }
  }

  // private async undeployModel() {
  //   try {
  //     this.setState({ isLoading: true });
  //     await ModelService.undeployModel(
  //       this.state.deployedModel.deployedModelId,
  //       this.state.deployedModel.endpointId
  //     );
  //     await ModelService.deleteEndpoint(this.state.deployedModel.endpointId);
  //     this.setState({
  //       deployedModel: null,
  //       deployedState: -1,
  //     });
  //   } catch (err) {
  //     console.warn('Error undeploying model', err);
  //   } finally {
  //     this.setState({ isLoading: false });
  //   }
  // }

  private handleGeneratePython() {
    let instance = '';
    const entries = Object.entries(this.state.inputParameters);
    for (let index = 0; index < entries.length; index++) {
      const key = entries[index][0];
      const val = entries[index][1];
      instance += "  '" + key + "': '" + val + "',\n";
    }
    const generated =
      'from jupyterlab_automl import predict\ninstance = {\n' +
      instance +
      "}\npredict('" +
      this.state.deployedModels[0].endpointId +
      "', instance)";
    this.setState({
      result: <CopyCode code={generated} />,
    });
  }

  private async handlePredict() {
    try {
      this.setState({ isLoading: true });
      const result = await ModelService.predict(
        this.state.deployedModels[0].endpointId,
        this.state.inputParameters
      );
      const code = (
        <Table size="small" style={{ width: 300 }}>
          <TableHead>
            <TableRow>
              <TableCell align="left">Label</TableCell>
              <TableCell align="left">Confidence</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {result.map(item => (
              <TableRow key={item.label}>
                <TableCell>{item.label}</TableCell>
                <TableCell>{item.confidence}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      );
      this.setState({
        result: code,
      });
    } catch (err) {
      console.warn('Error predicting result', err);
    } finally {
      this.setState({ isLoading: false });
    }
  }

  private handleReset() {
    this.setState({
      inputParameters: {},
      predictReady: false,
    });
  }

  private isPredictReady() {
    if (
      Object.keys(this.state.inputParameters).length ===
      this.props.pipeline.transformationOptions.length
    ) {
      return true;
    } else {
      return false;
    }
  }

  private handleInputChange(event) {
    const target = event.target;
    const current = this.state.inputParameters;

    if (target.value === '') {
      delete current[target.name];
    } else {
      current[target.name] = target.value;
    }

    this.setState({
      inputParameters: current,
      predictReady: this.isPredictReady(),
    });
  }

  render() {
    const { deployedModels, result } = this.state;
    return (
      <div
        hidden={this.props.value !== this.props.index}
        style={{ margin: '16px' }}
      >
        {deployedModels !== null ? (
          <div>
            <ListResourcesTable
              columns={[
                {
                  field: 'displayName',
                  title: 'Endpoint',
                },
                {
                  field: 'models',
                  title: 'Models',
                },
                {
                  title: 'Last updated',
                  field: 'updateTime',
                  render: rowData => {
                    return <p>{rowData.updateTime.toLocaleString()}</p>;
                  },
                },
              ]}
              data={this.state.deployedModels}
              height={200}
              width={500}
              rowContextMenu={[
                {
                  label: 'CopyID',
                  handler: rowData => {
                    console.log(rowData.endpointId);
                  },
                },
                {
                  label: 'Undeploy model',
                  handler: rowData => {
                    console.log(rowData.deployedModelId);
                  },
                },
              ]}
            />
            <Table
              size="small"
              style={{ width: 500, marginTop: '16px', marginBottom: '16px' }}
            >
              <TableHead>
                <TableRow>
                  <TableCell align="left">Feature column name</TableCell>
                  <TableCell align="left">Value</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {this.props.pipeline.transformationOptions.map(option => (
                  <TableRow key={option.columnName}>
                    <TableCell>{option.columnName}</TableCell>
                    <TableCell>
                      <TextInput
                        name={option.columnName}
                        onChange={this.handleInputChange}
                        value={
                          this.state.inputParameters[option.columnName] || ''
                        }
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <SubmitButton
              actionPending={!this.state.predictReady || this.state.isLoading}
              onClick={this.handlePredict}
              text={'Predict'}
              style={{ marginRight: '16px' }}
            />
            <SubmitButton
              actionPending={false}
              onClick={this.handleReset}
              text={'Reset'}
              style={{ marginRight: '16px' }}
            />
            <SubmitButton
              actionPending={!this.state.predictReady || this.state.isLoading}
              onClick={this.handleGeneratePython}
              text={'Generate Python'}
            />
            <div style={{ marginTop: '16px' }}>{result}</div>
          </div>
        ) : (
          <div>
            <SubmitButton
              actionPending={
                this.state.isLoading || this.state.deployedState === 0
              }
              onClick={this.deployModel}
              text={'Deploy Model'}
            />
            <div style={{ paddingTop: '16px' }}>
              {this.state.deployedState === 0 && (
                <div>
                  <LinearProgress />
                  <p style={{ paddingBottom: '16px' }}>
                    Deploying the model. Sit tight this takes a few minutes.
                  </p>
                  <SubmitButton
                    actionPending={this.state.isLoading}
                    onClick={this.checkDeployed}
                    text={'Check Status'}
                  />
                </div>
              )}
              {this.state.deployedState === -1 && (
                <Alert severity="info">
                  Your model must be successfully deployed to an endpoint before
                  you can test it.
                </Alert>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }
}
