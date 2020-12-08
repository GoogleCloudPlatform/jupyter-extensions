/**
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http=//www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { Icon } from '@material-ui/core';
import { Error } from '@material-ui/icons';
import * as React from 'react';
import { stylesheet } from 'typestyle';
import { ICONS } from '../../constants';
import { generateQueryId } from '../../reducers/queryEditorTabSlice';
import { formatBytes, formatDate, formatTime } from '../../utils/formatters';
import { WidgetManager } from '../../utils/widgetManager/widget_manager';
import { QueryEditorTabWidget } from '../query_editor/query_editor_tab/query_editor_tab_widget';
import InfoCard from '../shared/info_card';
import ReadOnlyEditor from '../shared/read_only_editor';
import { StripedRows } from '../shared/striped_rows';
import { gColor } from '../shared/styles';
import { Job } from './service/query_history';

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
            <div className={`jp-Icon jp-Icon-20 ${ICONS.editor}`} />
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
