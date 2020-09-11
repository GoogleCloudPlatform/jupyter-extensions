import * as React from 'react';
import { stylesheet } from 'typestyle';
import { gColor } from '../shared/styles';

const localStyles = stylesheet({
  queryStatusBar: {
    padding: '10px 12px 10px 12px',
    color: 'var(--jp-ui-inverse-font-color1)',
    marginTop: '10px',
    '&:hover': {
      cursor: 'pointer',
    },
  },
});

// Bar displaying status of past query. Meant to be clicked to close opened query details.
export const QueryStatusBar = (props: { failed: boolean }) => {
  if (props.failed) {
    return (
      <div
        className={localStyles.queryStatusBar}
        style={{ backgroundColor: gColor('RED') }}
      >
        Query failed
      </div>
    );
  } else {
    return (
      <div
        className={localStyles.queryStatusBar}
        style={{ backgroundColor: gColor('GREEN') }}
      >
        Query succeeded
      </div>
    );
  }
};
