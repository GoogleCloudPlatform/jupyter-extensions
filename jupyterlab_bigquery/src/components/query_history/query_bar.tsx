import * as React from 'react';
import { stylesheet } from 'typestyle';
import { Icon } from '@material-ui/core';
import { Error, CheckCircle } from '@material-ui/icons';

import { formatTime } from '../../utils/formatters';
import { JobsObject } from './service/query_history';
import { QueryEditorTabWidget } from '../query_editor/query_editor_tab/query_editor_tab_widget';
import { generateQueryId } from '../../reducers/queryEditorTabSlice';
import { WidgetManager } from '../../utils/widgetManager/widget_manager';
import { gColor } from '../shared/styles';

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
          <div className={'jp-Icon jp-Icon-20 jp-OpenEditorIcon'} />
        </Icon>
      </button>
    </div>
  );
};
