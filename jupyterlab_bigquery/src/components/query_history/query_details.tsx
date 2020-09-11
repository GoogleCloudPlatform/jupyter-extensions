import * as React from 'react';
import { stylesheet } from 'typestyle';
import { Icon } from '@material-ui/core';
import { Error } from '@material-ui/icons';

import { formatDate, formatBytes, formatTime } from '../../utils/formatters';
import { StripedRows } from '../shared/striped_rows';
import ReadOnlyEditor from '../shared/read_only_editor';
import InfoCard from '../shared/info_card';
import { Job } from './service/query_history';
import { QueryEditorTabWidget } from '../query_editor/query_editor_tab/query_editor_tab_widget';
import { generateQueryId } from '../../reducers/queryEditorTabSlice';
import { WidgetManager } from '../../utils/widgetManager/widget_manager';
import { gColor } from '../shared/styles';

const localStyles = stylesheet({
  detailsTopArea: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '14px',
  },
  queryTime: {
    width: '85px',
    color: 'gray',
  },
  openQueryButton: {
    display: 'flex',
    alignItems: 'center',
    color: 'var(--jp-ui-font-color1)',
    border: 'var(--jp-border-width) solid var(--jp-border-color2)',
    backgroundColor: 'var(--jp-layout-color0)',
    '&:hover': {
      boxShadow: '1px 1px 3px 0px var(--jp-border-color2)',
      cursor: 'pointer',
    },
  },
});

export const QueryDetails = (props: { job: Job }) => {
  const { details, created, errored, query } = props.job;
  const rows = [
    {
      name: 'Job ID',
      value: `${details.project}:${details.location}.${details.id}`,
    },
    { name: 'User', value: details.user },
    { name: 'Location', value: details.location },
    { name: 'Creation time', value: formatDate(details.created) },
    { name: 'Start time', value: formatDate(details.started) },
    { name: 'End time', value: formatDate(details.ended) },
    {
      name: 'Duration',
      value: details.duration
        ? `${details.duration.toFixed(1)} sec`
        : '0.0 sec',
    },
    {
      name: 'Bytes processed',
      value: details.bytesProcessed
        ? formatBytes(details.bytesProcessed, 2)
        : details.from_cache
        ? '0 B (results cached)'
        : '0 B',
    },
    { name: 'Job priority', value: details.priority },
    { name: 'Destination table', value: details.destination },
    { name: 'Use legacy SQL', value: details.useLegacySql ? 'true' : 'false' },
  ];
  return (
    <div>
      <div className={localStyles.detailsTopArea}>
        <div>
          {!errored && `Query completed in ${details.duration.toFixed(3)} sec`}
          <div className={localStyles.queryTime}>{formatTime(created)}</div>
        </div>
        <button
          className={localStyles.openQueryButton}
          onClick={() => {
            const queryId = generateQueryId();
            WidgetManager.getInstance().launchWidget(
              QueryEditorTabWidget,
              'main',
              queryId,
              undefined,
              [queryId, query]
            );
          }}
        >
          <Icon
            style={{
              display: 'flex',
              alignContent: 'center',
            }}
          >
            <div className={'jp-Icon jp-Icon-20 jp-OpenEditorIcon'} />
          </Icon>
          Open query in editor
        </button>
      </div>

      {errored && (
        <InfoCard
          color={gColor('RED')}
          message={details.errorResult.message}
          icon={<Error />}
        />
      )}

      <div style={{ marginBottom: '12px' }}>
        <ReadOnlyEditor query={query} />
      </div>

      <StripedRows rows={rows} />
    </div>
  );
};
