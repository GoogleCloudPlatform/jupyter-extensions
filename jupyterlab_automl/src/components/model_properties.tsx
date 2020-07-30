import { LinearProgress } from '@material-ui/core';
import * as React from 'react';
import { Model, ModelService, Pipeline } from '../service/model';
import { PipelineProperties } from './pipeline_properties';

interface Props {
  model: Model;
  value: number;
  index: number;
}

interface State {
  hasLoaded: boolean;
  isLoading: boolean;
  pipeline: Pipeline;
  open: boolean;
}

export class ModelProperties extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasLoaded: false,
      isLoading: false,
      open: false,
      pipeline: undefined,
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
        hasLoaded: true,
        pipeline: pipeline,
      });
    } catch (err) {
      console.warn('Error retrieving pipeline', err);
    } finally {
      this.setState({ isLoading: false });
    }
  }

  render() {
    const { isLoading, pipeline } = this.state;
    return (
      <div
        hidden={this.props.value !== this.props.index}
        style={{ marginTop: '16px' }}
      >
        {isLoading || !pipeline ? (
          <LinearProgress />
        ) : (
          <PipelineProperties pipeline={pipeline}></PipelineProperties>
        )}
      </div>
    );
  }
}
