import * as React from 'react';
import { Model, ModelService, DeployedModel, Pipeline } from '../service/model';
import { SubmitButton, TextInput } from 'gcp_jupyterlab_shared';
import Alert from '@material-ui/lab/Alert';
import {
  LinearProgress,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from '@material-ui/core';
import { Clipboard } from '@jupyterlab/apputils';

interface Props {
  model: Model;
  value: number;
  index: number;
}

interface State {
  hasLoaded: boolean;
  isLoading: boolean;
  deployedModel: DeployedModel;
  deployedState: number;
  pipeline: Pipeline;
  inputs: any;
  notReady: boolean;
  result: JSX.Element | string;
}

export class ModelPredictions extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasLoaded: false,
      isLoading: false,
      deployedModel: null,
      deployedState: -1,
      pipeline: null,
      inputs: {},
      notReady: true,
      result: null,
    };
    this.deployModel = this.deployModel.bind(this);
    this.undeployModel = this.undeployModel.bind(this);
    this.handleInputChange = this.handleInputChange.bind(this);
    this.handleReset = this.handleReset.bind(this);
    this.checkNotReady = this.checkNotReady.bind(this);
    this.handlePredict = this.handlePredict.bind(this);
    this.handleGeneratePython = this.handleGeneratePython.bind(this);
    this.checkDeployed = this.checkDeployed.bind(this);
  }

  async componentDidMount() {
    this.getPipeline();
    this.checkDeployed();
  }

  private async getPipeline() {
    try {
      this.setState({ isLoading: true });
      const pipeline = await ModelService.getPipeline(
        this.props.model.pipelineId
      );
      this.setState({
        hasLoaded: true,
        pipeline: pipeline,
      });
    } catch (err) {
      console.warn('Error getting model pipeline', err);
    } finally {
      this.setState({ isLoading: false });
    }
  }

  private async checkDeployed() {
    try {
      this.setState({ isLoading: true });
      const check = await ModelService.checkDeployed(this.props.model.id);
      let deployedModel = null;
      if (check.state === 1) {
        deployedModel = check.deployedModel;
      }
      this.setState({
        hasLoaded: true,
        deployedState: check.state,
        deployedModel: deployedModel,
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
        hasLoaded: true,
        deployedState: 0,
      });
    } catch (err) {
      console.warn('Error deploying model', err);
    } finally {
      this.setState({ isLoading: false });
    }
  }

  private async undeployModel() {
    try {
      this.setState({ isLoading: true });
      await ModelService.undeployModel(
        this.state.deployedModel.deployedModelId,
        this.state.deployedModel.endpointId
      );
      await ModelService.deleteEndpoint(this.state.deployedModel.endpointId);
      this.setState({
        hasLoaded: true,
        deployedModel: null,
        deployedState: -1,
      });
    } catch (err) {
      console.warn('Error undeploying model', err);
    } finally {
      this.setState({ isLoading: false });
    }
  }

  private handleGeneratePython() {
    let instance = '';
    const entries = Object.entries(this.state.inputs);
    for (let index = 0; index < entries.length; index++) {
      const key = entries[index][0];
      const val = entries[index][1];
      instance += "\t'" + key + "': '" + val + "',\n";
    }
    const generated =
      'from jupyterlab_automl import predict\ninstance = {\n' +
      instance +
      "}\npredict('" +
      this.state.deployedModel.endpointId +
      "', instance)";
    Clipboard.copyToSystem(generated);
    // const code = [<p key={'line1'}>import jupyterlab_automl</p>];
    // code.push(<p key={'line2'}>instance = {'{'}</p>);
    // const entries = Object.entries(this.state.inputs);
    // for (let index = 0; index < entries.length; index++) {
    //   const key = entries[index][0];
    //   const val = entries[index][1];
    //   code.push(
    //     <p key={key} style={{ paddingLeft: '16px' }}>
    //       "{key}": "{val}",
    //     </p>
    //   );
    // }
    // code.push(<p key={'line3'}>{'}'}</p>);
    // code.push(
    //   <p key={'line4'}>
    //     jupyterlab_automl.predict('{this.state.deployedModel.endpointId}',
    //     instance)
    //   </p>
    // );
    // code.push(
    //   <SubmitButton
    //     actionPending={false}
    //     onClick={_ => {
    //       Clipboard.copyToSystem(generated);
    //     }}
    //     text={'Copy'}
    //     style={{ marginTop: '16px' }}
    //   />
    // );
    // this.setState({
    //   result: <div>{code}</div>,
    // });
  }

  private async handlePredict() {
    try {
      this.setState({ isLoading: true });
      const result = await ModelService.predict(
        this.state.deployedModel.endpointId,
        this.state.inputs
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
        hasLoaded: true,
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
      inputs: {},
      notReady: true,
    });
  }

  private checkNotReady() {
    if (
      Object.keys(this.state.inputs).length ===
      this.state.pipeline.transformationOptions.length
    ) {
      return false;
    } else {
      return true;
    }
  }

  private handleInputChange(event) {
    const target = event.target;
    const current = this.state.inputs;

    if (target.value === '') {
      delete current[target.name];
    } else {
      current[target.name] = target.value;
    }

    this.setState({
      inputs: current,
      notReady: this.checkNotReady(),
    });
  }

  render() {
    const { pipeline, deployedModel, result } = this.state;
    return (
      <div
        hidden={this.props.value !== this.props.index}
        style={{ margin: '16px' }}
      >
        {deployedModel !== null ? (
          <div>
            <SubmitButton
              actionPending={this.state.isLoading}
              onClick={this.undeployModel}
              text={'Undeploy Model'}
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
                {pipeline.transformationOptions.map(option => (
                  <TableRow key={option.columnName}>
                    <TableCell component="th" scope="row">
                      {option.columnName}
                    </TableCell>
                    <TableCell>
                      <TextInput
                        name={option.columnName}
                        onChange={this.handleInputChange}
                        value={this.state.inputs[option.columnName] || ''}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <SubmitButton
              actionPending={this.state.notReady || this.state.isLoading}
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
              actionPending={this.state.notReady || this.state.isLoading}
              onClick={this.handleGeneratePython}
              text={'Copy Python'}
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
