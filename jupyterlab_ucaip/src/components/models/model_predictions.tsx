import { Clipboard } from '@jupyterlab/apputils';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Box,
} from '@material-ui/core';
import { createMuiTheme, ThemeProvider } from '@material-ui/core/styles';
import Alert from '@material-ui/lab/Alert';
import {
  ListResourcesTable,
  SubmitButton,
  TextInput,
} from 'gcp_jupyterlab_shared';
import * as React from 'react';
import { stylesheet } from 'typestyle';
import { Endpoint, Model, ModelService } from '../../service/model';
import { CodeComponent } from '../copy_code';

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
  customInput: string;
  customInputError: boolean;
  result: JSX.Element;
}

const localStyles = stylesheet({
  header: {
    fontSize: '15px',
    fontWeight: 600,
    letterSpacing: '1px',
    margin: 0,
    padding: '8px',
  },
});

export class ModelPredictions extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      isLoading: false,
      endpoints: [],
      inputParameters: {},
      customInput: '',
      customInputError: false,
      result: null,
    };
    this.deployModel = this.deployModel.bind(this);
    this.undeployModel = this.undeployModel.bind(this);
    this.handleInputChange = this.handleInputChange.bind(this);
    this.handleReset = this.handleReset.bind(this);
    this.isPredictReady = this.isPredictReady.bind(this);
    this.handlePredict = this.handlePredict.bind(this);
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

  private async handlePredict() {
    try {
      this.setState({ isLoading: true });
      const result = await ModelService.predict(
        this.state.endpoints[0].id,
        this.state.inputParameters
      );
      this.setState({
        result: (
          <CodeComponent copyEnabled={false}>
            {JSON.stringify(result)}
          </CodeComponent>
        ),
      });
    } catch (err) {
      this.setState({
        result: (
          <CodeComponent copyEnabled={false}>{err.message}</CodeComponent>
        ),
      });
      console.warn('Error predicting result', err);
    } finally {
      this.setState({ isLoading: false });
    }
  }

  private handleReset() {
    this.setState({
      inputParameters: {},
      result: null,
    });
  }

  private isPredictReady() {
    if (this.props.model.modelType === 'TABLE') {
      return (
        Object.keys(this.state.inputParameters).length ===
        Object.keys(this.props.model.inputs).length
      );
    } else {
      return !!this.state.inputParameters && !this.state.customInputError;
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
    });
  }

  private needToDeploy(): JSX.Element {
    return (
      <div>
        <SubmitButton
          actionPending={this.state.isLoading}
          onClick={this.deployModel}
          text={'Deploy Model'}
          style={{ marginBottom: '16px' }}
        />
        <Alert severity="info">
          Your model must be successfully deployed to an endpoint before you can
          test it.
        </Alert>
        <header className={localStyles.header}>
          Deploy model to basic endpoint
        </header>
        <p style={{ paddingLeft: '8px' }}>
          <i>Deploys model to an endpoint with a low level machine type.</i>
        </p>
        <CodeComponent>
          {`import * from jupyterlab_ucaip

deploy_model('${this.props.model.id}')`}
        </CodeComponent>
        <header className={localStyles.header}>
          Deploy model to customized endpoint
        </header>
        <p style={{ paddingLeft: '8px' }}>
          <i>Fill in the machine type and endpoint to deploy to.</i>
        </p>
        <CodeComponent>
          {`import * from jupyterlab_ucaip

machine_type = ''
endpoint_id = ''

deploy_model('${this.props.model.id}', machine_type, endpoint_id)`}
        </CodeComponent>
      </div>
    );
  }

  private predictComponent(endpoints: Endpoint[]): JSX.Element {
    if (endpoints[0].deployedModelId !== 'None') {
      return (
        <div>
          {this.props.model.modelType === 'TABLE'
            ? this.testTablesModelComponent()
            : this.testOtherModelComponent()}
          <SubmitButton
            actionPending={!this.isPredictReady() || this.state.isLoading}
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
          <div style={{ marginTop: '16px' }}>{this.state.result}</div>
        </div>
      );
    } else {
      return (
        <Alert severity="info">
          Waiting for model to finish deploying. Check back in a few minutes.
        </Alert>
      );
    }
  }

  private deployed(endpoints: Endpoint[]): JSX.Element {
    return (
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
              label: 'Copy ID',
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
        {this.predictComponent(endpoints)}
        <header className={localStyles.header}>Code sample</header>
        <CodeComponent>
          {`from jupyterlab_ucaip import predict
instance = ${JSON.stringify(this.state.inputParameters)}
predict("${this.state.endpoints[0].id}", instance)`}
        </CodeComponent>
      </div>
    );
  }

  private testTablesModelComponent(): JSX.Element {
    return (
      <ThemeProvider theme={theme}>
        <Table size="small" style={{ width: 500, marginBottom: '16px' }}>
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
                      this.props.model.inputs[option]['inputBaselines'][0]
                    }
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ThemeProvider>
    );
  }

  private testOtherModelComponent(): JSX.Element {
    return (
      <Box mb="16px">
        <TextField
          placeholder='{"some_property": 123}'
          multiline
          rows={3}
          size="small"
          variant="outlined"
          inputProps={{ style: { fontSize: 'var(--jp-ui-font-size1)' } }}
          error={this.state.customInputError}
          onChange={event => {
            const val = event.target.value;
            try {
              const obj = JSON.parse(val);
              this.setState({ inputParameters: obj, customInputError: false });
            } catch {
              this.setState({ inputParameters: {}, customInputError: true });
            }
          }}
        />
      </Box>
    );
  }

  render() {
    const { endpoints } = this.state;
    return (
      <div
        hidden={this.props.value !== this.props.index}
        style={{ margin: '16px' }}
      >
        {endpoints.length !== 0
          ? this.deployed(endpoints)
          : this.needToDeploy()}
      </div>
    );
  }
}
