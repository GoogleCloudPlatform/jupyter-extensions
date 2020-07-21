import * as React from 'react';
import { withStyles, Tabs, Tab } from '@material-ui/core';

import {
  TableDetailsService,
  TableDetails,
} from './service/list_table_details';
import LoadingPanel from '../loading_panel';
import TableDetailsPanel from './table_details_panel';
import TablePreviewPanel from './table_preview';
import { stylesheet } from 'typestyle';

const localStyles = stylesheet({
  header: {
    borderBottom: 'var(--jp-border-width) solid var(--jp-border-color2)',
    fontSize: '18px',
    margin: 0,
    padding: '8px 12px 8px 24px',
  },
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

const StyledTabs = withStyles({
  root: {
    borderBottom: '1px solid #e8e8e8',
    minHeight: 'auto',
    padding: 0,
  },
  indicator: {
    backgroundColor: '#0d68ff',
    height: '2.5px',
  },
})(Tabs);

const StyledTab = withStyles({
  root: {
    textTransform: 'none',
    minWidth: 'auto',
    minHeight: 'auto',
    fontSize: '13px',
    '&:hover': {
      color: '#0d68ff',
      opacity: 1,
    },
    '&$selected': {
      color: '#0d68ff',
    },
    '&:focus': {
      color: '#0d68ff',
    },
  },
  selected: {},
})((props: StyledTabProps) => <Tab disableRipple {...props} />);

interface StyledTabProps {
  label: string;
}

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

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index } = props;

  return (
    <div
      id={`tabpanel-${index}`}
      style={{
        flex: 1,
        minHeight: 0,
        flexDirection: 'column',
        display: value !== index ? 'none' : 'flex',
        overflowX: value === TabInds.preview ? 'auto' : 'hidden',
        overflowY: 'auto',
      }}
    >
      {children}
    </div>
  );
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
          <header className={localStyles.header}>
            {this.props.table_name}
          </header>
          <div className={localStyles.body}>
            <StyledTabs
              value={this.state.currentTab}
              onChange={this.handleChange.bind(this)}
            >
              <StyledTab label="Details" />
              <StyledTab label="Preview" />
            </StyledTabs>
            <TabPanel value={this.state.currentTab} index={TabInds.details}>
              <TableDetailsPanel
                tableId={this.props.table_id}
                isVisible={this.props.isVisible}
                tableDetailsService={this.props.tableDetailsService}
              />
            </TabPanel>
            <TabPanel value={this.state.currentTab} index={TabInds.preview}>
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
