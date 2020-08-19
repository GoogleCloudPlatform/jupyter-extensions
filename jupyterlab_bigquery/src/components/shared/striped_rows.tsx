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
  bold: {
    fontWeight: 500,
  },
});

export const getStripedStyle = index => {
  return {
    background:
      index % 2
        ? 'var(--jp-layout-color0)'
        : document.body.getAttribute('data-jp-theme-light') === 'true'
        ? '#fafafa'
        : 'var(--jp-border-color3)',
  };
};

export const StripedRows = props => {
  return (
    <div style={{ width: '100%' }}>
      {props.rows.map((row, index) => (
        <div
          key={index}
          className={localStyles.row}
          style={{ ...getStripedStyle(index) }}
        >
          <div className={localStyles.rowTitle}>
            <div className={localStyles.bold}>{row.name}</div>
          </div>
          <div>{row.value}</div>
        </div>
      ))}
    </div>
  );
};
