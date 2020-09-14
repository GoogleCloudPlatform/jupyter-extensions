import * as React from 'react';
import { withStyles, Tabs, Tab } from '@material-ui/core';

export const StyledTabs: React.ComponentType<any> = withStyles({
  root: {
    borderBottom: '1px solid var(--jp-border-color2)',
    minHeight: 'auto',
    padding: 0,
  },
  indicator: {
    height: '2.5px',
    backgroundColor: (props: StyledTabsProps) => props.color,
  },
})((props: StyledTabsProps) => <Tabs {...props} />);

interface StyledTabsProps {
  value: string | number;
  onChange: () => void;
  color: string;
}

export const StyledTab: React.ComponentType<StyledTabProps> = withStyles({
  root: {
    textTransform: 'none',
    minWidth: 'auto',
    minHeight: 'auto',
    fontSize: '13px',
    '&:hover': {
      color: (props: StyledTabProps) => props.color,
      opacity: 1,
    },
    '&selected': {
      color: (props: StyledTabProps) => props.color,
      opacity: 1,
    },
    '&:focus': {
      color: (props: StyledTabProps) => props.color,
      opacity: 1,
    },
  },
  selected: {},
})((props: StyledTabProps) => <Tab disableRipple {...props} />);

interface StyledTabProps {
  label: string;
  color: string;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
  TabInds: any;
}

export function TabPanel(props: TabPanelProps) {
  const { children, value, index, TabInds } = props;

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
