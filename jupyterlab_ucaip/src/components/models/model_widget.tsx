import {
  Box,
  LinearProgress,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableRow,
  Tabs,
  Toolbar,
} from '@material-ui/core';
import { createStyles, Theme, withStyles } from '@material-ui/core/styles';
import * as csstips from 'csstips';
import * as React from 'react';
import { stylesheet } from 'typestyle';
import { Context } from '../../context';
import { Model, ModelService, Pipeline } from '../../service/model';
import { BaseWidget } from '../base_widget';
import { EvaluationTable } from './model_evaluation';
import { ModelPredictions } from './model_predictions';
import { ModelProperties } from './model_properties';

interface Props {
  model: Model;
}

interface State {
  tabState: number;
  isLoading: boolean;
  pipeline: Pipeline;
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

const localStyles = stylesheet({
  list: {
    margin: 0,
    overflowY: 'scroll',
    padding: 0,
    ...csstips.flex,
    height: '550px',
  },
  panel: {
    backgroundColor: 'white',
    height: '100%',
    ...csstips.vertical,
  },
});

export default function OtherModelPanel(props: React.PropsWithChildren<Props>) {
  const modelId = props.model.id.split('/');

  return (
    <div style={{ overflow: 'auto', height: '100%' }}>
      <Box p="16px">
        <Table size="small" style={{ width: 500 }}>
          <TableBody>
            <TableRow key={'ID'}>
              <TableCell scope="row">ID</TableCell>
              <TableCell align="right">{modelId[modelId.length - 1]}</TableCell>
            </TableRow>
            <TableRow key={'Region'}>
              <TableCell scope="row">Region</TableCell>
              <TableCell align="right">us-central-1</TableCell>
            </TableRow>
            <TableRow key={'Created'}>
              <TableCell scope="row">Created</TableCell>
              <TableCell align="right">
                {props.model.createTime.toLocaleString()}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
        <ModelPredictions model={props.model} value={0} index={0} />
      </Box>
    </div>
  );
}

export class ModelPanel extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      tabState: 0,
      isLoading: true,
      pipeline: null,
    };
  }

  async componentDidMount() {
    this.getPipeline();
  }

  private async getPipeline() {
    try {
      this.setState({ isLoading: true });
      const pipeline = await ModelService.getPipeline(
        this.props.model.pipelineId
      );
      this.setState({
        pipeline: pipeline,
      });
    } catch (err) {
      console.warn('Error retrieving pipeline', err);
    } finally {
      this.setState({ isLoading: false });
    }
  }

  render() {
    const { tabState, isLoading } = this.state;
    if (!isLoading) {
      return (
        <div className={localStyles.panel}>
          <Toolbar variant="dense">
            <AntTabs
              value={tabState}
              onChange={(_event, newValue) =>
                this.setState({ tabState: newValue })
              }
            >
              <AntTab label="Evaluate" />
              <AntTab label="Model Properties" />
              <AntTab label="Test" />
            </AntTabs>
          </Toolbar>
          <ul className={localStyles.list}>
            <EvaluationTable
              model={this.props.model}
              value={tabState}
              index={0}
            />
            <ModelProperties
              model={this.props.model}
              value={tabState}
              index={1}
              pipeline={this.state.pipeline}
            />
            <ModelPredictions
              model={this.props.model}
              value={tabState}
              index={2}
            />
          </ul>
        </div>
      );
    } else {
      return <LinearProgress />;
    }
  }
}

/** Widget to be registered in the left-side panel. */
export class ModelWidget extends BaseWidget {
  id = 'model-widget';

  constructor(private readonly modelMeta: Model, context: Context) {
    super(context);
    this.title.label = modelMeta.displayName;
    this.title.caption = 'Model ' + modelMeta.displayName;
    this.title.closable = true;
    this.title.iconClass = 'jp-Icon jp-Icon-20 jp-UcaipIcon-model';
  }

  body() {
    if (this.modelMeta.modelType !== 'OTHER') {
      return <ModelPanel model={this.modelMeta} />;
    } else {
      return <OtherModelPanel model={this.modelMeta} />;
    }
  }
}
