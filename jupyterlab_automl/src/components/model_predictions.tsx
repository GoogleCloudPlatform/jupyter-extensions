import * as React from 'react';
import { Model, ModelService, Endpoint } from '../service/model';
import {
  SubmitButton,
  TextInput,
  ListResourcesTable,
} from 'gcp_jupyterlab_shared';
import Alert from '@material-ui/lab/Alert';
import {
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from '@material-ui/core';
import { CopyCode } from './copy_code';
import { stylesheet } from 'typestyle';
import { ThemeProvider, createMuiTheme } from '@material-ui/core/styles';
import { Clipboard } from '@jupyterlab/apputils';

const theme = createMuiTheme({
  overrides: {
    MuiTable: {
      root: {
        borderRadius: 0,
        borderTop: '1px solid var(--jp-border-color2)',
      },
    },
    MuiTableHead: {
      root: {
        fontSize: 'var(--jp-ui-font-size1)',
        padding: '0px 8px',
      },
    },
    MuiTableCell: {
      root: {
        fontSize: 'var(--jp-ui-font-size1)',
        padding: '2px 24px 2px 8px',
      },
    },
  },
});

interface Props {
  model: Model;
  value: number;
  index: number;
}

interface State {
  isLoading: boolean;
  endpoints: Endpoint[];
  inputParameters: object;
  predictReady: boolean;
  result: JSX.Element;
}

const localStyles = stylesheet({
  header: {
    fontSize: '15px',
    fontWeight: 600,
    letterSpacing: '1px',
    margin: 0,
    padding: '8px 12px 12px 8px',
  },
});

export class ModelPredictions extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      isLoading: false,
      endpoints: [],
      inputParameters: {},
      predictReady: false,
      result: null,
    };
    this.deployModel = this.deployModel.bind(this);
    this.undeployModel = this.undeployModel.bind(this);
    this.handleInputChange = this.handleInputChange.bind(this);
    this.handleReset = this.handleReset.bind(this);
    this.isPredictReady = this.isPredictReady.bind(this);
    this.handlePredict = this.handlePredict.bind(this);
    this.handleGeneratePython = this.handleGeneratePython.bind(this);
    this.getEndpoints = this.getEndpoints.bind(this);
  }

  async componentDidMount() {
    this.getEndpoints();
  }

  private async getEndpoints() {
    try {
      this.setState({ isLoading: true });
      let endpoints = await ModelService.getEndpoints(this.props.model.id);
      if (endpoints.length === 0) {
        endpoints = await ModelService.checkDeploying(this.props.model);
      }
      this.setState({
        endpoints: endpoints,
      });
    } catch (err) {
      console.warn('Error getting endpoints', err);
    } finally {
      this.setState({ isLoading: false });
    }
  }

  private async deployModel() {
    try {
      this.setState({ isLoading: true });
      await ModelService.deployModel(this.props.model.id);
      this.getEndpoints();
    } catch (err) {
      console.warn('Error deploying model', err);
    } finally {
      this.setState({ isLoading: false });
    }
  }

  private async undeployModel(endpoint: Endpoint) {
    try {
      this.setState({ isLoading: true });
      await ModelService.undeployModel(endpoint.deployedModelId, endpoint.id);
      if (endpoint.displayName.includes('ucaip-extension')) {
        await ModelService.deleteEndpoint(endpoint.id);
      }
      this.getEndpoints();
    } catch (err) {
      console.warn('Error undeploying model', err);
    } finally {
      this.setState({ isLoading: false });
    }
  }

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
      this.state.endpoints[0].id +
      "', instance)";
    this.setState({
      result: <CopyCode code={generated} />,
    });
  }

  private async handlePredict() {
    try {
      this.setState({ isLoading: true });
      const result = await ModelService.predict(
        this.state.endpoints[0].id,
        this.state.inputParameters
      );
      this.setState({
        result: <CopyCode code={JSON.stringify(result)} copy={false} />,
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
      result: null,
    });
  }

  private isPredictReady() {
    if (
      Object.keys(this.state.inputParameters).length ===
      Object.keys(this.props.model.inputs).length
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
    const { endpoints, result } = this.state;
    return (
      <div
        hidden={this.props.value !== this.props.index}
        style={{ margin: '16px' }}
      >
        {endpoints.length !== 0 ? (
          <div>
            <header className={localStyles.header}>Endpoints</header>
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
              data={this.state.endpoints}
              height={this.state.endpoints.length * 60 + 60}
              width={500}
              rowContextMenu={[
                {
                  label: 'CopyID',
                  handler: rowData => {
                    Clipboard.copyToSystem(rowData.id);
                  },
                },
                {
                  label: 'Undeploy model',
                  handler: rowData => {
                    this.undeployModel(rowData);
                  },
                },
              ]}
            />
            <header className={localStyles.header}>Test your model</header>
            {endpoints[0].deployedModelId !== 'None' ? (
              <div>
                <ThemeProvider theme={theme}>
                  <Table
                    size="small"
                    style={{ width: 500, marginBottom: '16px' }}
                  >
                    <TableHead>
                      <TableRow>
                        <TableCell align="left">Feature column name</TableCell>
                        <TableCell align="left">Value</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {Object.keys(this.props.model.inputs).map(option => (
                        <TableRow key={option}>
                          <TableCell>{option}</TableCell>
                          <TableCell>
                            <TextInput
                              name={option}
                              onChange={this.handleInputChange}
                              value={this.state.inputParameters[option] || ''}
                              placeholder={
                                this.props.model.inputs[option][
                                  'inputBaselines'
                                ][0]
                              }
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ThemeProvider>
                <SubmitButton
                  actionPending={
                    !this.state.predictReady || this.state.isLoading
                  }
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
                  actionPending={
                    !this.state.predictReady || this.state.isLoading
                  }
                  onClick={this.handleGeneratePython}
                  text={'Generate Python'}
                />
                <div style={{ marginTop: '16px' }}>{result}</div>
              </div>
            ) : (
              <Alert severity="info">
                Waiting for model to finish deploying. Check back in a few
                minutes.
              </Alert>
            )}
          </div>
        ) : (
          <div>
            <SubmitButton
              actionPending={this.state.isLoading}
              onClick={this.deployModel}
              text={'Deploy Model'}
              style={{ marginBottom: '16px' }}
            />
            <Alert severity="info">
              Your model must be successfully deployed to an endpoint before you
              can test it.
            </Alert>
          </div>
        )}
      </div>
    );
  }
}
