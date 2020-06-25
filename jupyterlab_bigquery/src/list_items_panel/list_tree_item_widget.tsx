import { ReactWidget, UseSignal } from '@jupyterlab/apputils';
import { LinearProgress, Button } from '@material-ui/core';
import { Signal } from '@phosphor/signaling';
import * as csstips from 'csstips';
import * as React from 'react';
import { stylesheet } from 'typestyle';
import { JupyterFrontEnd } from '@jupyterlab/application';

import { ListProjectsService, Projects } from './service/list_items';
import { ListProjectItem } from './list_tree_item';
import { WidgetManager } from '../widget_manager';
import { QueryEditorTabWidget } from '../query_editor/query_editor_tab/query_editor_tab_widget';

interface Props {
  listProjectsService: ListProjectsService;
  isVisible: boolean;
  context: Context;
}

export interface Context {
  app: JupyterFrontEnd;
  manager: WidgetManager;
}

interface State {
  hasLoaded: boolean;
  isLoading: boolean;
  projects: Projects;
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

export class ListItemsPanel extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasLoaded: false,
      isLoading: false,
      projects: { projects: [] },
    };
  }

  async componentDidMount() {
    try {
      // empty
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
    const { isLoading, projects } = this.state;
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
                this.props.context.manager.launchWidgetForId(
                  QueryEditorTabWidget.id,
                  QueryEditorTabWidget
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
            {projects.projects.map(p => (
              <ListProjectItem
                key={p.id}
                project={p}
                context={this.props.context}
              /> //TODO: enter table here
            ))}
          </ul>
        )}
      </div>
    );
  }

  private async getProjects() {
    try {
      this.setState({ isLoading: true });
      const projects = await this.props.listProjectsService.listProjects(2);
      this.setState({ hasLoaded: true, projects });
    } catch (err) {
      console.warn('Error retrieving projects', err);
    } finally {
      this.setState({ isLoading: false });
    }
  }
}

/** Widget to be registered in the left-side panel. */
export class ListItemsWidget extends ReactWidget {
  id = 'listitems';
  private visibleSignal = new Signal<ListItemsWidget, boolean>(this);

  constructor(
    private readonly listProjectsService: ListProjectsService,
    private context: Context
  ) {
    super();
    this.title.iconClass = 'jp-Icon jp-Icon-20 jp-BigQueryIcon';
    this.title.caption = 'BigQuery In Notebooks';
  }

  onAfterHide() {
    this.visibleSignal.emit(false);
  }

  onAfterShow() {
    this.visibleSignal.emit(true);
  }

  render() {
    return (
      <UseSignal signal={this.visibleSignal}>
        {(_, isVisible) => (
          <ListItemsPanel
            isVisible={isVisible}
            listProjectsService={this.listProjectsService}
            context={this.context}
          />
        )}
      </UseSignal>
    );
  }
}
