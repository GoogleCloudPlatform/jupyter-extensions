import * as React from 'react';
import { Button } from '@material-ui/core';
import { Code } from '@material-ui/icons';

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
import { stylesheet } from 'typestyle';

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
});

interface Props {
  tableDetailsService: TableDetailsService;
  isVisible: boolean;
  table_id: string;
  table_name: string;
}

interface State {
  hasLoaded: boolean;
  isLoading: boolean;
  details: TableDetails;
  rows: DetailRow[];
  currentTab: number;
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
        <div style={{ display: 'flex', flexFlow: 'column', height: '100%' }}>
          <Header
            text={this.props.table_name}
            buttons={[
              <Button
                onClick={() => {
                  const queryId = generateQueryId();
                  WidgetManager.getInstance().launchWidget(
                    QueryEditorTabWidget,
                    'main',
                    queryId,
                    undefined,
                    [
                      queryId,
                      `SELECT * FROM \`${this.props.table_id}\` LIMIT 1000`,
                    ]
                  );
                }}
                startIcon={<Code />}
                style={{ textTransform: 'none', color: '#1A73E8' }}
              >
                Query table
              </Button>,
            ]}
          ></Header>
          <div className={localStyles.body}>
            <StyledTabs
              value={this.state.currentTab}
              onChange={this.handleChange.bind(this)}
            >
              <StyledTab label="Details" />
              <StyledTab label="Preview" />
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
