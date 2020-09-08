import * as React from 'react';
import { Button } from '@material-ui/core';
import { Code, Info } from '@material-ui/icons';
import { stylesheet } from 'typestyle';

import {
  TableDetailsService,
  TableDetails,
} from './service/list_table_details';
import { Header } from '../shared/header';
import { StyledTabs, StyledTab, TabPanel } from '../shared/tabs';
import LoadingPanel from '../loading_panel';
import TableDetailsPanel from './table_details_panel';
import TablePreviewPanel from './table_preview';
import { QueryEditorTabWidget } from '../query_editor/query_editor_tab/query_editor_tab_widget';
import { WidgetManager } from '../../utils/widgetManager/widget_manager';
import { generateQueryId } from '../../reducers/queryEditorTabSlice';
import { getStarterQuery } from '../../utils/starter_queries';
import { gColor } from '../shared/styles';
import { BASE_FONT } from 'gcp_jupyterlab_shared';
import InfoCard from '../shared/info_card';

export const localStyles = stylesheet({
  body: {
    margin: '24px',
    marginBottom: 0,
    fontSize: '13px',
    flex: 1,
    minHeight: 0,
    display: 'flex',
    flexDirection: 'column',
  },
  tableDetailsRoot: {
    display: 'flex',
    flexFlow: 'column',
    height: '100%',
    ...BASE_FONT,
  },
});

interface Props {
  tableDetailsService: TableDetailsService;
  isVisible: boolean;
  table_id: string;
  table_name: string;
  partitioned: boolean;
}

interface State {
  hasLoaded: boolean;
  isLoading: boolean;
  details: TableDetails;
  rows: DetailRow[];
  currentTab: number;
  showPartitionCard: boolean;
}

interface DetailRow {
  name: string;
  value: string | number;
}

enum TabInds {
  details = 0,
  preview,
}

export default class TableDetailsTabs extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasLoaded: false,
      isLoading: false,
      details: { details: {} } as TableDetails,
      rows: [],
      currentTab: TabInds.details,
      showPartitionCard: true,
    };
  }

  handleChange(event: React.ChangeEvent<{}>, newValue: number) {
    this.setState({ currentTab: newValue });
  }

  render() {
    if (this.state.isLoading) {
      return <LoadingPanel />;
    } else {
      return (
        <div className={localStyles.tableDetailsRoot}>
          <Header>
            {this.props.table_name}
            <Button
              onClick={() => {
                const queryId = generateQueryId();
                WidgetManager.getInstance().launchWidget(
                  QueryEditorTabWidget,
                  'main',
                  queryId,
                  undefined,
                  [queryId, getStarterQuery('TABLE', this.props.table_id)]
                );
              }}
              startIcon={<Code />}
              style={{
                textTransform: 'none',
                color: gColor('BLUE'),
              }}
            >
              Query table
            </Button>
          </Header>
          <div className={localStyles.body}>
            {this.props.partitioned && this.state.showPartitionCard && (
              <InfoCard
                message={
                  <div>
                    This is a partitioned table.{' '}
                    <a
                      style={{ textDecoration: 'underline' }}
                      href="https://cloud.google.com/bigquery/docs/partitioned-tables?_ga=2.65379946.-555088760.1592854116"
                      target="_blank"
                    >
                      Learn more
                    </a>
                  </div>
                }
                color="gray"
                icon={<Info />}
                button={
                  <Button
                    size="small"
                    style={{
                      textTransform: 'none',
                      color: 'var(--jp-ui-font-color1)',
                    }}
                    onClick={() => {
                      this.setState({ showPartitionCard: false });
                    }}
                  >
                    Dismiss
                  </Button>
                }
              />
            )}
            <StyledTabs
              value={this.state.currentTab}
              onChange={this.handleChange.bind(this)}
              color={gColor('BLUE')}
            >
              <StyledTab label="Details" color={gColor('BLUE')} />
              <StyledTab label="Preview" color={gColor('BLUE')} />
            </StyledTabs>
            <TabPanel
              value={this.state.currentTab}
              index={TabInds.details}
              TabInds={TabInds}
            >
              <TableDetailsPanel
                tableId={this.props.table_id}
                isVisible={this.props.isVisible}
                tableDetailsService={this.props.tableDetailsService}
              />
            </TabPanel>
            <TabPanel
              value={this.state.currentTab}
              index={TabInds.preview}
              TabInds={TabInds}
            >
              <TablePreviewPanel
                tableId={this.props.table_id}
                isVisible={this.props.isVisible}
                tableDetailsService={this.props.tableDetailsService}
              />
            </TabPanel>
          </div>
        </div>
      );
    }
  }
}
