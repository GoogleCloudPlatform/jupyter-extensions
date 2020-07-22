import { ReactWidget } from '@jupyterlab/apputils';
import * as React from 'react';
import { Dataset } from '../service/dataset';
import { stylesheet } from 'typestyle';
import * as csstips from 'csstips';

const localStyles = stylesheet({
  header: {
    borderBottom: 'var(--jp-border-width) solid var(--jp-border-color2)',
    fontSize: '14px',
    letterSpacing: '1px',
    margin: 0,
    padding: '8px 12px 8px 24px',
  },
  title: {
    fontSize: '15px',
    fontWeight: 600,
    letterSpacing: '1px',
    margin: 0,
    padding: '8px',
  },
  panel: {
    backgroundColor: 'white',
    height: '100%',
    ...csstips.vertical,
  },
  paper: {
    padding: '16px',
    textAlign: 'left',
    fontSize: 'var(--jp-ui-font-size1)',
  },
});

/** Widget to be registered in the left-side panel. */
export class ImageWidget extends ReactWidget {
  id = 'dataset-widget';

  constructor(private readonly datasetMeta: Dataset) {
    super();
    this.title.label = datasetMeta.displayName;
    this.title.caption = 'AutoML Dataset';
    this.title.closable = true;
    this.title.iconClass =
      'jp-Icon jp-Icon-20 jp-AutoMLIcon-' + datasetMeta.datasetType;
  }

  render() {
    return (
      <div className={localStyles.panel}>
        <header className={localStyles.header}>
          {this.datasetMeta.displayName}
        </header>
        <div className={localStyles.paper}>
          <header className={localStyles.title}>Dataset Info</header>
          <p style={{ padding: '8px' }}>
            Created: {this.datasetMeta.createTime}
          </p>
          <p style={{ padding: '8px' }}>
            Dataset type: {this.datasetMeta.datasetType}
          </p>
          <p style={{ padding: '8px' }}>
            Dataset location: {this.datasetMeta.metadata['gcsBucket']}
          </p>
        </div>
      </div>
    );
  }
}
