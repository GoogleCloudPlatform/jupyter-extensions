import * as React from 'react';
import { stylesheet } from 'typestyle';
import { Context } from '../../context';
import { Pipeline } from '../../service/model';
import { BaseWidget } from '../base_widget';
import { PipelineProperties } from './pipeline_properties';

const localStyles = stylesheet({
  header: {
    borderBottom: 'var(--jp-border-width) solid var(--jp-border-color2)',
    fontSize: '14px',
    letterSpacing: '1px',
    margin: 0,
    padding: '8px 12px 8px 24px',
  },
  panel: {
    height: '100%',
    width: '100%',
    overflowY: 'auto',
  },
});

/** Widget to be registered in the left-side panel. */
export class PipelineWidget extends BaseWidget {
  id = 'pipeline-widget';

  constructor(private readonly pipeline: Pipeline, context: Context) {
    super(context);
    this.title.label = pipeline.displayName;
    this.title.caption = 'Pipeline ' + pipeline.displayName;
    this.title.closable = true;
    this.title.iconClass = 'jp-Icon jp-Icon-20 jp-UcaipIcon-training';
  }

  body() {
    return (
      <div className={localStyles.panel}>
        <header className={localStyles.header}>
          {this.pipeline.displayName}
        </header>
        <PipelineProperties pipeline={this.pipeline}></PipelineProperties>
      </div>
    );
  }
}
