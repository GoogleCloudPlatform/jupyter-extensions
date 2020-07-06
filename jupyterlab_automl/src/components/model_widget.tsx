import { ReactWidget } from '@jupyterlab/apputils';
import * as React from 'react';
import { Model } from '../service/model';
import { ModelComponent } from './model_component';
import { Toolbar, Tabs, Tab, Box } from '@material-ui/core';
import { withStyles, Theme, createStyles } from '@material-ui/core/styles';

interface Props {
  model: Model;
}

interface TabProps {
  value: number;
  index: number;
  message: string;
}

interface State {
  tabState: number;
}

interface StyledTabProps {
  label: string;
}

const AntTabs = withStyles({
  root: {
    borderBottom: '1px solid #e8e8e8',
  },
  indicator: {
    backgroundColor: '#4272D9',
  },
})(Tabs);

const AntTab = withStyles((theme: Theme) =>
  createStyles({
    root: {
      textTransform: 'none',
      minWidth: 72,
      fontWeight: theme.typography.fontWeightRegular,
      marginRight: theme.spacing(4),
      '&:hover': {
        backgroundColor: '#e8e8e8',
      },
      '&$selected': {
        color: '#4272D9',
        fontWeight: theme.typography.fontWeightMedium,
      },
    },
    selected: {},
  })
)((props: StyledTabProps) => <Tab disableRipple {...props} />);

export class TabPanel extends React.Component<TabProps> {
  constructor(props: TabProps) {
    super(props);
  }

  render() {
    return (
      <div hidden={this.props.value !== this.props.index}>
        <Box p={3}>{this.props.message}</Box>
      </div>
    );
  }
}

export class ModelPanel extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      tabState: 0,
    };
  }

  render() {
    const { tabState } = this.state;
    return (
      <Box>
        <Toolbar variant="dense">
          <AntTabs
            value={tabState}
            onChange={(_event, newValue) =>
              this.setState({ tabState: newValue })
            }
          >
            <AntTab label="Model Properties"></AntTab>
            <AntTab label="Evaluate"></AntTab>
          </AntTabs>
        </Toolbar>
        <ModelComponent model={this.props.model} value={tabState} index={0} />
        <TabPanel value={tabState} index={1} message="Evaluate" />
      </Box>
    );
  }
}

/** Widget to be registered in the left-side panel. */
export class ModelWidget extends ReactWidget {
  id = 'model-widget';

  constructor(private readonly modelMeta: Model) {
    super();
    this.title.label = modelMeta.displayName;
    this.title.caption = 'Cloud AI Model';
    this.title.closable = true;
    this.title.iconClass = 'jp-Icon jp-Icon-20 jp-AutoMLIcon-model';
  }

  render() {
    return <ModelPanel model={this.modelMeta}></ModelPanel>;
  }
}
