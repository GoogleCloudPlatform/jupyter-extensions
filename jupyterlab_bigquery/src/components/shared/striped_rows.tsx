import * as React from 'react';
import { stylesheet } from 'typestyle';

const localStyles = stylesheet({
  row: {
    display: 'flex',
    padding: '6px',
  },
  rowTitle: {
    width: '200px',
  },
});

export const getStripedStyle = index => {
  return { background: index % 2 ? 'white' : '#fafafa' };
};

export const StripedRows = props => {
  return (
    <div>
      {props.rows.map((row, index) => (
        <div
          key={index}
          className={localStyles.row}
          style={{ ...getStripedStyle(index) }}
        >
          <div className={localStyles.rowTitle}>
            <b>{row.name}</b>
          </div>
          <div>{row.value}</div>
        </div>
      ))}
    </div>
  );
};
