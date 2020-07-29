import { LinearProgress } from '@material-ui/core';
import * as React from 'react';
import { Model, Pipeline } from '../service/model';
import { PipelineProperties } from './pipeline_properties';

interface Props {
  model: Model;
  value: number;
  index: number;
  pipeline: Pipeline;
}

interface State {
  hasLoaded: boolean;
  isLoading: boolean;
}

export class ModelProperties extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasLoaded: false,
      isLoading: false,
    };
  }

  render() {
    const { isLoading } = this.state;
    return (
      <div
        hidden={this.props.value !== this.props.index}
        style={{ margin: '16px' }}
      >
        {isLoading ? (
          <LinearProgress />
        ) : (
          <PipelineProperties
            pipeline={this.props.pipeline}
          ></PipelineProperties>
        )}
      </div>
    );
  }
}
