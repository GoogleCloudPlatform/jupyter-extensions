jest.mock('@jupyterlab/apputils');
import { DatasetService, Dataset } from '../service/dataset';
import { ModelService, Model, Pipeline } from '../service/model';
import { ExportData } from '../components/datasets/export_data';
import { CopyCode, CodeComponent } from '../components/copy_code';
import {
  ListResourcesPanel,
  ResourceSelect,
} from '../components/list_resources_panel';
import React from 'react';
import { shallow } from 'enzyme';
import { TextInput, RadioInput } from 'gcp_jupyterlab_shared';
import { Button, IconButton } from '@material-ui/core';

const datasets: Dataset[] = [
  {
    id: 'datasets/1234',
    displayName: 'ucaip_dataset',
    createTime: new Date(),
    updateTime: new Date(),
    datasetType: 'TABLE',
    metadata: {},
  },
];

const models: Model[] = [
  {
    id: 'models/1234',
    displayName: 'ucaip_model',
    pipelineId: 'pipelines/1234',
    createTime: new Date(),
    updateTime: new Date(),
    modelType: 'TABLE',
  },
];

const pipelines: Pipeline[] = [
  {
    id: 'pipelines/1234',
    displayName: 'ucaip_training',
    createTime: new Date(),
    updateTime: new Date(),
    elapsedTime: 5000,
    datasetId: 'datasets/1234',
    objective: 'regression',
    state: 'RUNNING',
  },
];

describe('Testing service methods', () => {
  it('Gets uCAIP datasets', async () => {
    const mockListDatasets = jest.spyOn(DatasetService, 'listDatasets');
    mockListDatasets.mockImplementation(() => Promise.resolve(datasets));

    DatasetService.listDatasets().then(gotDatasets =>
      expect(gotDatasets).toEqual(datasets)
    );
  });
  it('Gets uCAIP models and pipelines', async () => {
    const mockListModels = jest.spyOn(ModelService, 'listModels');
    mockListModels.mockImplementation(() => Promise.resolve(models));

    const mockListPipelines = jest.spyOn(ModelService, 'listPipelines');
    mockListPipelines.mockImplementation(() => Promise.resolve(pipelines));

    ModelService.listModels().then(gotModels =>
      expect(gotModels).toEqual(models)
    );
    ModelService.listPipelines().then(gotPipelines =>
      expect(gotPipelines).toEqual(pipelines)
    );
  });
});

describe('Rendering of ExportData Component', () => {
  const exportData = shallow(
    <ExportData open={true} onClose={null} onSuccess={null} context={null} />
  );
  it('Renders initial state correctly', async () => {
    expect(exportData).toMatchSnapshot();
    expect(exportData.state('from')).toEqual('computer');
    expect(exportData.state('name')).toEqual('');
  });
  it('Updates name state based on input', async () => {
    const nameInput = exportData.find(TextInput);
    nameInput.simulate('change', { target: { value: 'my_dataset' } });
    expect(exportData.state('name')).toEqual('my_dataset');
  });
  it('Updates from state based on radio toggle', async () => {
    const radioInput = exportData.find(RadioInput);
    radioInput.simulate('change', { target: { value: 'bigquery' } });
    expect(exportData.state('from')).toEqual('bigquery');
    expect(exportData.state('source')).toEqual(null);
    expect(exportData.state('error')).toEqual(null);
  });
  it('Catches incorrectly formatted URIs', async () => {
    const bigQueryUri = exportData.find(TextInput).at(1);
    bigQueryUri.simulate('change', { target: { value: 'invalid uri' } });
    expect(exportData.state('source')).toEqual('invalid uri');
    expect(exportData.state('error')).toEqual('Invalid BigQuery uri');
  });
});

describe('Rendering of ListResourcePanel Component', () => {
  const listResourcesPanel = shallow(
    <ListResourcesPanel
      isVisible={true}
      width={50}
      height={50}
      context={null}
    />
  );
  it('Renders initial state correctly', async () => {
    expect(listResourcesPanel).toMatchSnapshot();
    expect(listResourcesPanel.state('resourceType')).toEqual('dataset');
    expect(listResourcesPanel.state('searchString')).toEqual('');
    expect(listResourcesPanel.state('showSearch')).toEqual(false);
    expect(listResourcesPanel.state('deleteDialogOpen')).toEqual(false);
    expect(listResourcesPanel.state('createDatasetDialogOpen')).toEqual(false);
    expect(listResourcesPanel.state('exportModelDialogOpen')).toEqual(false);
  });
  it('Create button opens export dataset dialog', async () => {
    const createButton = listResourcesPanel.find(Button);
    createButton.simulate('click');
    expect(listResourcesPanel.state('createDatasetDialogOpen')).toEqual(true);
  });
  it('Toggling to models changed the resource type and toolbar button', async () => {
    const selectResource = listResourcesPanel.find(ResourceSelect);
    selectResource.simulate('change', { target: { value: 'model' } });
    expect(listResourcesPanel.state('resourceType')).toEqual('model');
    const exportButton = listResourcesPanel.find(Button);
    exportButton.simulate('click');

    expect(listResourcesPanel.state('exportModelDialogOpen')).toEqual(true);
  });
  it('Clicking search opens search bar and changes search state on type', async () => {
    const searchButton = listResourcesPanel.find(IconButton).at(0);
    searchButton.simulate('click');
    expect(listResourcesPanel.state('showSearch')).toEqual(true);
    const searchInput = listResourcesPanel.find(TextInput);
    searchInput.simulate('change', { target: { value: 'u' } });
    expect(listResourcesPanel.state('searchString')).toEqual('u');
    searchButton.simulate('click');
    expect(listResourcesPanel.state('showSearch')).toEqual(false);
  });
});

describe('Rendering of CopyCode Component', () => {
  const copyCode = shallow(<CopyCode copy={true} code={'sample code'} />);
  const codeComponent = shallow(
    <CodeComponent copy={false}>Sample code</CodeComponent>
  );
  it('Renders initial state correctly', async () => {
    expect(copyCode).toMatchSnapshot();
    expect(codeComponent).toMatchSnapshot();
  });
  it('Clicking copy button opens notification toast', async () => {
    const copyButton = copyCode.find(IconButton).at(0);
    copyButton.simulate('click');
    expect(copyCode.state('copyAlertOpen')).toEqual(true);
  });
});
