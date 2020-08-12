import { Clipboard } from '@jupyterlab/apputils';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  IconButton,
  Button,
  FormControl,
  FormHelperText,
  Select,
  MenuItem,
  CircularProgress,
  Icon,
  Box,
  Grid,
  withStyles,
} from '@material-ui/core';
import Alert from '@material-ui/lab/Alert';
import { ListResourcesTable, BASE_FONT } from 'gcp_jupyterlab_shared';
import * as React from 'react';
import { stylesheet } from 'typestyle';
import { Endpoint, Model, ModelService } from '../../service/model';
import { CodeComponent } from '../copy_code';

interface Props {
  model: Model;
  value: number;
  index: number;
}

interface State {
  isLoading: boolean;
  endpoints: Endpoint[];
  allEndpoints: Endpoint[];
  inputParameters: object;
  customInput: string;
  customInputError: boolean;
  result: JSX.Element;
  machineType: string;
  endpointId: string;
}

const StyledTableCell = withStyles({
  root: {
    fontSize: '13px',
    BASE_FONT,
  },
})(TableCell);

const localStyles = stylesheet({
  title: {
    fontSize: '16px',
    letterSpacing: '1px',
    padding: '24px 0px 10px 8px',
    fontFamily: 'Roboto',
  },
});

const machineTypes = [
  'n1-standard-2',
  'n1-standard-4',
  'n1-standard-8',
  'n1-standard-16',
  'n1-highmem-2',
  'n1-highmem-4',
  'n1-highmem-8',
  'n1-highmem-16',
  'n1-highcpu-2',
  'n1-highcpu-4',
  'n1-highcpu-8',
  'n1-highcpu-16',
];

export class ModelPredictions extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      isLoading: false,
      endpoints: [],
      allEndpoints: [],
      inputParameters: {},
      customInput: '',
      customInputError: false,
      result: null,
      machineType: machineTypes[0],
      endpointId: '',
    };
    this.deployModel = this.deployModel.bind(this);
    this.undeployModel = this.undeployModel.bind(this);
    this.handleInputChange = this.handleInputChange.bind(this);
    this.handleReset = this.handleReset.bind(this);
    this.isPredictReady = this.isPredictReady.bind(this);
    this.handlePredict = this.handlePredict.bind(this);
    this.getEndpoints = this.getEndpoints.bind(this);
    this.getCodeString = this.getCodeString.bind(this);
    this.getInstanceString = this.getInstanceString.bind(this);
  }

  async componentDidMount() {
    this.getEndpoints();
  }

  private async getEndpoints() {
    try {
      this.setState({ isLoading: true });
      let endpoints = await ModelService.getEndpoints(this.props.model.id);
      let allEndpoints = [];
      if (endpoints.length === 0) {
        endpoints = await ModelService.checkDeploying(
          this.props.model,
          this.state.endpointId
        );
      }
      if (endpoints.length === 0) {
        allEndpoints = await ModelService.getAllEndpoints();
      }
      this.setState({
        endpoints: endpoints,
        allEndpoints: allEndpoints,
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
      await ModelService.deployModel(
        this.props.model.id,
        this.state.machineType,
        this.state.endpointId
      );
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
      this.setState({ endpointId: '' });
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
          <CodeComponent copy={false}>{JSON.stringify(result)}</CodeComponent>
        ),
      });
    } catch (err) {
      this.setState({
        result: <CodeComponent copy={false}>{err.message}</CodeComponent>,
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

  private getInstanceString(): string {
    let instanceString = `{\n`;
    for (const [key, value] of Object.entries(this.state.inputParameters)) {
      instanceString += `  '${key}': '${value}',\n`;
    }
    instanceString += `}`;
    return instanceString;
  }

  private getCodeString(): string {
    let codeString = `from jupyterlab_ucaip import deploy_model

deploy_model(model_id='${this.props.model.id}',
             machine_type='${this.state.machineType}'`;
    if (this.state.endpointId !== '') {
      codeString += `,
             endpoint_id='${this.state.endpointId}'`;
    }
    codeString += `)`;
    return codeString;
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
        <Alert severity="info">
          Your model must be successfully deployed to an endpoint before you can
          test it.
        </Alert>
        <div className={localStyles.title}>Deploy model to endpoint</div>
        <p style={{ paddingLeft: '8px' }}>
          <i>Select the machine type and endpoint to deploy to.</i>
        </p>
        <FormControl style={{ marginLeft: '16px' }}>
          <Select
            value={this.state.machineType}
            onChange={event => {
              this.setState({ machineType: event.target.value as string });
            }}
            displayEmpty
          >
            {machineTypes.map(option => (
              <MenuItem key={option} value={option}>
                {option}
              </MenuItem>
            ))}
          </Select>
          <FormHelperText>Machine type</FormHelperText>
        </FormControl>
        <FormControl style={{ marginLeft: '16px' }}>
          <Select
            value={this.state.endpointId}
            onChange={event => {
              this.setState({ endpointId: event.target.value as string });
            }}
            displayEmpty
          >
            <MenuItem key={''} value={''}>
              new endpoint
            </MenuItem>
            {this.state.allEndpoints.map(option => (
              <MenuItem key={option.id} value={option.id}>
                {option.displayName}
              </MenuItem>
            ))}
          </Select>
          <FormHelperText>Endpoint</FormHelperText>
        </FormControl>
        <CodeComponent>{this.getCodeString()}</CodeComponent>
        <Button
          disabled={this.state.isLoading}
          variant="contained"
          color="primary"
          size="small"
          onClick={this.deployModel}
          style={{ marginBottom: '16px' }}
        >
          Deploy Model
        </Button>
      </div>
    );
  }

  private predictComponent(endpoints: Endpoint[]): JSX.Element {
    if (endpoints[0].deployedModelId !== 'None') {
      return (
        <div>
          <Grid container style={{ margin: '0px', width: '100%' }}>
            {this.props.model.modelType === 'TABLE'
              ? this.testTablesModelComponent()
              : this.testOtherModelComponent()}
            <Grid
              item
              xs={8}
              style={{ paddingLeft: '16px', paddingRight: '16px' }}
            >
              <CodeComponent>
                {`from jupyterlab_ucaip import predict

instance = ${this.getInstanceString()}
predict("${this.state.endpoints[0].id}",
        instance)`}
              </CodeComponent>
            </Grid>
          </Grid>
          <Button
            disabled={!this.isPredictReady() || this.state.isLoading}
            variant="contained"
            color="primary"
            size="small"
            onClick={this.handlePredict}
            style={{ marginRight: '16px' }}
          >
            Predict
          </Button>
          <Button
            variant="contained"
            color="primary"
            size="small"
            onClick={this.handleReset}
            style={{ marginRight: '16px' }}
          >
            Reset
          </Button>
          <div style={{ marginTop: '16px' }}>{this.state.result}</div>
        </div>
      );
    } else {
      return (
        <Alert icon={<CircularProgress size={18} />} severity="info">
          Waiting for model to finish deploying. Check back in a few minutes.
        </Alert>
      );
    }
  }

  private deployed(endpoints: Endpoint[]): JSX.Element {
    return (
      <div>
        <div className={localStyles.title}>Endpoints</div>
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
        <div className={localStyles.title}>
          Test your model
          <Box
            component="div"
            display="inline"
            visibility={
              endpoints[0].deployedModelId !== 'None' ? 'hidden' : 'visible'
            }
          >
            <IconButton
              disabled={this.state.isLoading}
              size="small"
              onClick={_ => {
                this.getEndpoints();
              }}
            >
              <Icon>refresh</Icon>
            </IconButton>
          </Box>
        </div>
        {this.predictComponent(endpoints)}
      </div>
    );
  }

  private testTablesModelComponent(): JSX.Element {
    return (
      <Grid item xs={4} style={{ padding: 0 }}>
        <Table size="small" style={{ marginBottom: '16px' }}>
          <TableHead>
            <TableRow>
              <StyledTableCell align="left">
                Feature column name
              </StyledTableCell>
              <StyledTableCell align="left">Value</StyledTableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {Object.keys(this.props.model.inputs).map(option => (
              <TableRow key={option}>
                <StyledTableCell>{option}</StyledTableCell>
                <StyledTableCell>
                  <TextField
                    name={option}
                    onChange={this.handleInputChange}
                    value={this.state.inputParameters[option] || ''}
                    placeholder={
                      this.props.model.inputs[option]['inputBaselines'][0]
                    }
                    inputProps={{
                      style: { fontSize: 'var(--jp-ui-font-size1)' },
                    }}
                  />
                </StyledTableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Grid>
    );
  }

  private testOtherModelComponent(): JSX.Element {
    return (
      <Grid item xs={4} style={{ paddingTop: '8px' }}>
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
          style={{ width: '100%' }}
        />
      </Grid>
    );
  }

  render() {
    const { endpoints } = this.state;
    return (
      <div
        hidden={this.props.value !== this.props.index}
        style={{ paddingLeft: '16px' }}
      >
        {endpoints.length !== 0
          ? this.deployed(endpoints)
          : this.needToDeploy()}
      </div>
    );
  }
}
