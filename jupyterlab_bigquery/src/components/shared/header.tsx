import * as React from 'react';
import { stylesheet } from 'typestyle';

const localStyles = stylesheet({
  header: {
    borderBottom: 'var(--jp-border-width) solid var(--jp-border-color2)',
    fontSize: '18px',
    margin: 0,
    padding: '8px 36px 8px 24px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});

export const Header: React.SFC = props => {
  return <header className={localStyles.header}>{props.children}</header>;
};
