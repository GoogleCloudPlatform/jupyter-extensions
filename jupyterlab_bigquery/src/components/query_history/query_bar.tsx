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
import { CheckCircle, Error } from '@material-ui/icons';
import * as React from 'react';
import { stylesheet } from 'typestyle';
import { ICONS } from '../../constants';
import { generateQueryId } from '../../reducers/queryEditorTabSlice';
import { formatTime } from '../../utils/formatters';
import { WidgetManager } from '../../utils/widgetManager/widget_manager';
import { QueryEditorTabWidget } from '../query_editor/query_editor_tab/query_editor_tab_widget';
import { gColor } from '../shared/styles';
import { JobsObject } from './service/query_history';

const localStyles = stylesheet({
  query: {
    flex: 1,
    minWidth: 0,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  queryTime: {
    width: '85px',
    color: 'gray',
  },
  queryBar: {
    display: 'flex',
    overflow: 'hidden',
    padding: '0px 10px 0px 10px',
    borderBottom: 'var(--jp-border-width) solid var(--jp-border-color2)',
    backgroundColor: 'var(--jp-layout-color0)',
    alignItems: 'center',
    '&:hover': {
      cursor: 'pointer',
    },
  },
  openQueryButtonSmall: {
    border: 'var(--jp-border-width) solid var(--jp-layout-color0)',
    backgroundColor: 'var(--jp-layout-color0)',
    '&:hover': {
      border: 'var(--jp-border-width) solid var(--jp-border-color2)',
      cursor: 'pointer',
    },
  },
  icon: {
    marginRight: '12px',
  },
});

// Bar displaying past query and time it was made. Meant to be clicked to open past query details.
export const QueryBar = (props: { jobs: JobsObject; jobId: string }) => {
  const { jobs, jobId } = props;
  return (
    <div className={localStyles.queryBar}>
      <div className={localStyles.queryTime}>
        {formatTime(jobs[jobId].created)}
      </div>
      {jobs[jobId].errored ? (
        <Error
          fontSize="inherit"
          className={localStyles.icon}
          style={{ fill: gColor('RED') }}
        />
      ) : (
        <CheckCircle
          fontSize="inherit"
          className={localStyles.icon}
          style={{ fill: gColor('GREEN') }}
        />
      )}
      <div className={localStyles.query}>{jobs[jobId].query}</div>
      <button
        className={localStyles.openQueryButtonSmall}
        onClick={event => {
          event.stopPropagation();
          const queryId = generateQueryId();
          WidgetManager.getInstance().launchWidget(
            QueryEditorTabWidget,
            'main',
            queryId,
            undefined,
            [queryId, jobs[jobId].query]
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
      </button>
    </div>
  );
};
