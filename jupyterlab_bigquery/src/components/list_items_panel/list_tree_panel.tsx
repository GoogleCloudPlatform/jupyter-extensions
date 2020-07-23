import { LinearProgress, Button, Switch } from '@material-ui/core';
import * as csstips from 'csstips';
import * as React from 'react';
import { connect } from 'react-redux';
import { stylesheet } from 'typestyle';
import { JupyterFrontEnd } from '@jupyterlab/application';

import {
  ListProjectsService,
  DataTree,
  ListDatasetsService,
  ListTablesService,
  ListModelsService,
} from './service/list_items';
import ListProjectItem from './list_tree_item';
import { WidgetManager } from '../../utils/widgetManager/widget_manager';
import ListSearchResults from './list_search_results';
import { QueryEditorTabWidget } from '../query_editor/query_editor_tab/query_editor_tab_widget';
import { updateDataTree } from '../../reducers/dataTreeSlice';
import {
  SearchProjectsService,
  SearchResult,
} from '../list_items_panel/service/search_items';
import { SearchBar } from './search_bar';
import { DialogComponent } from 'gcp_jupyterlab_shared';

interface Props {
  listProjectsService: ListProjectsService;
  listDatasetsService: ListDatasetsService;
  listTablesService: ListTablesService;
  listModelsService: ListModelsService;
  isVisible: boolean;
  context: Context;
  updateDataTree: any;
  currentProject: string;
}

export interface Context {
  app: JupyterFrontEnd;
  manager: WidgetManager;
}

interface State {
  hasLoaded: boolean;
  isLoading: boolean;
  searchToggled: boolean;
  searchEnabled: boolean;
  dialogOpen: boolean;
  isSearching: boolean;
  searchResults: SearchResult[];
}

const localStyles = stylesheet({
  header: {
    borderBottom: 'var(--jp-border-width) solid var(--jp-border-color2)',
    fontWeight: 600,
    fontSize: 'var(--jp-ui-font-size0, 11px)',
    letterSpacing: '1px',
    margin: 0,
    padding: '8px 12px',
    textTransform: 'uppercase',
    flexDirection: 'column',
  },
  editQueryButton: {
    margin: 'auto',
    flexGrow: 0,
  },
  list: {
    margin: 0,
    overflowY: 'scroll',
    padding: 0,
    ...csstips.flex,
  },
  panel: {
    backgroundColor: 'white',
    //color: COLORS.base,
    height: '100%',
    //...BASE_FONT,
    ...csstips.vertical,
    marginTop: '5px',
    marginBottom: '5px',
  },
  enableSearch: {
    ...csstips.flex,
    display: 'flex',
    flexDirection: 'row',
    alignContent: 'center',
  },
});

class ListItemsPanel extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasLoaded: false,
      isLoading: false,
      searchToggled: false,
      searchEnabled: false,
      dialogOpen: false,
      isSearching: false,
      searchResults: [],
    };
  }

  handleOpenDialog = () => {
    const { searchToggled } = this.state;
    this.setState({
      searchToggled: !searchToggled,
      dialogOpen: true,
    });
  };

  handleEnableSearch = () => {
    this.setState({
      dialogOpen: false,
      searchEnabled: true,
    });
  };

  handleCancelDialog = () => {
    this.setState({ dialogOpen: false, searchToggled: false });
  };

  async search(searchKey, project) {
    try {
      this.setState({ isLoading: true, isSearching: true });
      const service = new SearchProjectsService();
      await service.searchProjects(searchKey, project).then(results => {
        this.setState({ searchResults: results.searchResults });
      });
    } catch (err) {
      console.warn('Error searching', err);
    }
    this.setState({ isLoading: false });
  }

  handleKeyPress = event => {
    const { currentProject } = this.props;
    if (event.key === 'Enter') {
      const searchKey = event.target.value;
      if (currentProject !== '') {
        this.search(searchKey, currentProject);
      } else {
        console.warn(
          'Error searching, wait until data tree loads and try again'
        );
      }
    }
  };

  handleClear = () => {
    this.setState({ isSearching: false });
  };

  async componentWillMount() {
    try {
      //empty
    } catch (err) {
      console.warn('Unexpected error', err);
    }
  }

  componentDidUpdate(prevProps: Props) {
    const isFirstLoad =
      !(this.state.hasLoaded || prevProps.isVisible) && this.props.isVisible;
    if (isFirstLoad) {
      this.getProjects();
    }
  }

  render() {
    const {
      isLoading,
      isSearching,
      searchResults,
      searchToggled,
      searchEnabled,
      dialogOpen,
    } = this.state;
    return (
      <div className={localStyles.panel}>
        <header className={localStyles.header}>
          BigQuery in Notebooks
          <Button
            color="primary"
            size="small"
            variant="contained"
            className={localStyles.editQueryButton}
            onClick={() => {
              WidgetManager.getInstance().launchWidget(
                QueryEditorTabWidget,
                'main'
              );
            }}
          >
            Edit Query
          </Button>
          {searchEnabled ? (
            <SearchBar
              handleKeyPress={this.handleKeyPress}
              handleClear={this.handleClear}
              defaultText={'Search...'}
            />
          ) : (
            <div className={localStyles.enableSearch}>
              <Switch checked={searchToggled} onClick={this.handleOpenDialog} />
              <div style={{ alignSelf: 'center' }}>Enable Searching</div>
            </div>
          )}
        </header>
        {isLoading ? (
          <LinearProgress />
        ) : isSearching ? (
          <ul className={localStyles.list}>
            <ListSearchResults
              context={this.props.context}
              searchResults={searchResults}
            />
          </ul>
        ) : (
          <ul className={localStyles.list}>
            <ListProjectItem
              context={this.props.context}
              listDatasetsService={this.props.listDatasetsService}
              listTablesService={this.props.listTablesService}
              listModelsService={this.props.listModelsService}
            />
          </ul>
        )}
        <DialogComponent
          header="Requirements to Enable Searching"
          open={dialogOpen}
          onSubmit={this.handleEnableSearch}
          onCancel={this.handleCancelDialog}
          onClose={this.handleCancelDialog}
          submitLabel="I have enabled the API"
          children={
            <p>
              To start using BigQuery's Search feature, you'll need to first
              enable the{' '}
              <a
                style={{ color: 'blue' }}
                href="https://console.developers.google.com/apis/api/datacatalog.googleapis.com/overview"
              >
                Google Data Catalog API.
              </a>{' '}
              Once you click "Enable", this may take up to 2-3 minutes before
              you can start searching.
            </p>
          }
        />
      </div>
    );
  }

  private async getProjects() {
    try {
      this.setState({ isLoading: true });
      await this.props.listProjectsService
        .listProjects(100)
        .then((data: DataTree) => {
          this.props.updateDataTree(data);
          this.setState({ hasLoaded: true });
        });
    } catch (err) {
      console.warn('Error retrieving projects', err);
    } finally {
      this.setState({ isLoading: false });
    }
  }
}

const mapStateToProps = state => {
  const currentProject = state.dataTree.data.projectIds[0];
  return { currentProject };
};
const mapDispatchToProps = {
  updateDataTree,
};

export default connect(mapStateToProps, mapDispatchToProps)(ListItemsPanel);
