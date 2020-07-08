import { LinearProgress, Button } from '@material-ui/core';
import * as csstips from 'csstips';
import * as React from 'react';
import { connect } from 'react-redux';
import { stylesheet } from 'typestyle';
import { JupyterFrontEnd } from '@jupyterlab/application';
// import { Contents } from '@jupyterlab/services';

import { ListProjectsService, DataTree } from './service/list_items';
import ListProjectItem from './list_tree_item';
import { WidgetManager } from '../../utils/widgetManager/widget_manager';
import { QueryEditorTabWidget } from '../query_editor/query_editor_tab/query_editor_tab_widget';
import { updateDataTree } from '../../reducers/dataTreeSlice';
// import { IIterator, ArrayIterator, find } from '@phosphor/algorithm';

interface Props {
  listProjectsService: ListProjectsService;
  isVisible: boolean;
  context: Context;
  updateDataTree: any;
}

export interface Context {
  app: JupyterFrontEnd;
  manager: WidgetManager;
}

interface State {
  hasLoaded: boolean;
  isLoading: boolean;
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
  list: {
    margin: 0,
    overflowY: 'scroll',
    padding: 0,
    ...csstips.flex,
  },
  editQueryButton: {
    margin: 'auto',
  },
});

class ListItemsPanel extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasLoaded: false,
      isLoading: false,
    };
  }

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
    const { isLoading } = this.state;
    return (
      <div className={localStyles.panel}>
        <div style={{ display: 'flex', flexDirection: 'row' }}>
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
          </header>
        </div>
        {isLoading ? (
          <LinearProgress />
        ) : (
          <ul className={localStyles.list}>
            <ListProjectItem context={this.props.context} />
          </ul>
        )}
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
  return {};
};
const mapDispatchToProps = {
  updateDataTree,
};

export default connect(mapStateToProps, mapDispatchToProps)(ListItemsPanel);
