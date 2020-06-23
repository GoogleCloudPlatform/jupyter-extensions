import { Box, Icon, IconButton, ListItem, Toolbar } from '@material-ui/core';
import blue from '@material-ui/core/colors/blue';
import orange from '@material-ui/core/colors/orange';
import * as React from 'react';
import { Dataset, DatasetService, DatasetType } from '../service/dataset';
import { Model, ModelService } from '../service/model';
import { Context } from './automl_widget';
import { ColumnType, ListResourcesTable } from './shared/list_resources_table';
import { TextInput, SelectInput } from 'gcp-jupyterlab-shared';
import styled from 'styled-components';
import { debounce } from '../util';
import { DatasetWidget } from './dataset_widget';

interface Props {
  isVisible: boolean;
  width: number;
  height: number;
  context: Context;
}

enum ResourceType {
  Model = 'model',
  Dataset = 'dataset',
}

interface State {
  hasLoaded: boolean;
  isLoading: boolean;
  datasets: Dataset[];
  models: Model[];
  resourceType: ResourceType;
  searchString: string;
}

const FullWidthInput = styled(Box)`
  width: 100%;
  & > div {
    width: 100%;
  }
`;

const ResourceSelect = styled(Box)`
  & > div {
    padding: 0;
    margin: 4px 0;
  }
`;

const styles: { [key: string]: React.CSSProperties } = {
  toolbar: {
    paddingLeft: 16,
    paddingRight: 16,
    minHeight: 0,
  },
  select: {
    fontSize: 'var(--jp-ui-font-size0)',
    fontWeight: 600,
    textTransform: 'uppercase',
  },
  selectItem: {
    fontSize: 'var(--jp-ui-font-size1)',
  },
  icon: {
    fontSize: 20,
  },
};

const breakpoints = [250, 380];

export class ListResourcesPanel extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasLoaded: false,
      isLoading: false,
      datasets: [],
      models: [],
      resourceType: ResourceType.Dataset,
      searchString: '',
    };
  }

  shouldComponentUpdate(nextProps: Props, nextState: State) {
    // Reduce the number of rerenders when resizing the width by only triggering
    // a render if the new width crosses a column breakpoint
    let shouldUpdate =
      this.props.isVisible !== nextProps.isVisible ||
      this.state !== nextState ||
      this.props.height !== nextProps.height;
    for (const bp of breakpoints) {
      shouldUpdate =
        shouldUpdate ||
        Math.sign(this.props.width - bp) !== Math.sign(nextProps.width - bp);
    }
    return shouldUpdate;
  }

  componentDidUpdate(prevProps: Props) {
    const isFirstLoad =
      !(this.state.hasLoaded || prevProps.isVisible) && this.props.isVisible;
    if (isFirstLoad) {
      this.refresh();
    }
  }

  render() {
    // TODO: Make styles separate
    return (
      <>
        <Box height={1} width={1} bgcolor={'white'} borderRadius={0}>
          <Toolbar variant="dense" style={{ ...styles.toolbar }}>
            <ResourceSelect>
              <SelectInput
                value={this.state.resourceType}
                options={[
                  { text: 'Models', value: ResourceType.Model },
                  { text: 'Datasets', value: ResourceType.Dataset },
                ]}
                onChange={event => {
                  if (this.state.isLoading) return;
                  this.selectType(event.target.value as ResourceType);
                }}
              />
            </ResourceSelect>
            <Box flexGrow={1}></Box>
            <IconButton
              disabled={this.state.isLoading}
              style={styles.icon}
              size="small"
            >
              <Icon>add</Icon>
            </IconButton>
            <IconButton
              disabled={this.state.isLoading}
              size="small"
              onClick={_ => {
                this.refresh();
              }}
            >
              <Icon>refresh</Icon>
            </IconButton>
          </Toolbar>
          <Toolbar variant="dense" style={styles.toolbar}>
            <FullWidthInput width={1}>
              <TextInput
                placeholder="Search"
                type="search"
                onChange={event => {
                  this.handleSearch(event.target.value);
                }}
              />
            </FullWidthInput>
          </Toolbar>
          {this.state.resourceType === ResourceType.Dataset ? (
            <ListResourcesTable
              columns={[
                {
                  field: 'datasetType',
                  title: '',
                  render: rowData =>
                    this.iconForDatasetType(rowData.datasetType),
                  fixedWidth: 30,
                  sorting: false,
                },
                {
                  field: 'displayName',
                  title: 'Name',
                },
                {
                  title: 'Rows',
                  field: 'exampleCount',
                  type: ColumnType.Numeric,
                  minShowWidth: breakpoints[1],
                  fixedWidth: 80,
                },
                {
                  title: 'Created at',
                  field: 'createTime',
                  type: ColumnType.DateTime,
                  rightAlign: true,
                  minShowWidth: breakpoints[0],
                },
              ]}
              data={this.filterResources<Dataset>(this.state.datasets)}
              onRowClick={rowData => {
                if (rowData.datasetType === 'TBL') {
                  this.props.context.manager.launchWidgetForId(
                    DatasetWidget,
                    rowData.id,
                    rowData
                  );
                }
              }}
              isLoading={this.state.isLoading}
              height={this.props.height - 80}
              width={this.props.width}
              rowContextMenu={[
                {
                  label: 'Delete',
                  handler: rowData => {
                    // TODO: Show a confirmation dialog before deleting
                    DatasetService.deleteDataset(rowData.id);
                    this.refresh();
                  },
                },
              ]}
            />
          ) : (
            <ListResourcesTable
              columns={[
                {
                  field: 'displayName',
                  title: 'Name',
                },
                {
                  title: 'Dataset',
                  field: 'datasetId',
                  minShowWidth: breakpoints[1],
                },
                {
                  title: 'Last updated',
                  field: 'updateTime',
                  type: ColumnType.DateTime,
                  rightAlign: true,
                  minShowWidth: breakpoints[0],
                },
              ]}
              data={this.filterResources<Model>(this.state.models)}
              isLoading={this.state.isLoading}
              height={this.props.height - 80}
              width={this.props.width}
              rowContextMenu={[
                {
                  label: 'Delete',
                  handler: rowData => {
                    // TODO: Show a confirmation dialog before deleting
                    ModelService.deleteModel(rowData.id);
                    this.refresh();
                  },
                },
              ]}
            />
          )}
        </Box>
      </>
    );
  }

  private iconForDatasetType(datasetType: DatasetType) {
    const icons: { [key in DatasetType]: any } = {
      other: {
        icon: 'error',
        color: blue[900],
      },
      TBL: {
        icon: 'table_chart',
        color: blue[700],
      },
      ICN: {
        icon: 'image',
        color: orange[500],
      },
      IOD: {
        icon: 'image',
        color: orange[500],
      },
    };
    return (
      <ListItem dense style={{ padding: 0 }}>
        <Icon style={{ ...styles.icon, color: icons[datasetType].color }}>
          {icons[datasetType].icon}
        </Icon>
      </ListItem>
    );
  }

  private handleSearch = debounce((value: string) => {
    this.setState({ searchString: value });
  }, 250);

  private filterResources<T>(resources: T[]): T[] {
    const searchFields = {
      displayName: true,
      updateTime: true,
      createTime: true,
      datasetType: true,
    };
    return resources.filter(x => {
      if (!this.state.searchString) return true;
      const obj = x as { [k: string]: any };
      for (const key in x) {
        if (!(key in searchFields)) continue;
        if (
          typeof obj[key] === 'string' &&
          (obj[key] as string)
            .toLowerCase()
            .includes(this.state.searchString.toLowerCase())
        ) {
          return true;
        }
        if (
          obj[key] instanceof Date &&
          (obj[key] as Date)
            .toLocaleString()
            .toLowerCase()
            .includes(this.state.searchString.toLowerCase())
        ) {
          return true;
        }
      }
      return false;
    });
  }

  private selectType(type: ResourceType) {
    this.setState({ resourceType: type });
    this.refresh();
  }

  private async refresh() {
    try {
      this.setState({ isLoading: true });
      await Promise.all([this.getDatasets(), this.getModels()]);
      this.setState({ hasLoaded: true });
    } catch (err) {
      console.warn('Error retrieving datasets', err);
    } finally {
      this.setState({ isLoading: false });
    }
  }

  private async getDatasets() {
    const datasets = await DatasetService.listDatasets();
    this.setState({ datasets: datasets });
  }

  private async getModels() {
    const models = await ModelService.listModels();
    this.setState({ models: models });
  }
}
