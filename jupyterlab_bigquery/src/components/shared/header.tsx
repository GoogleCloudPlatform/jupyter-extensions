import * as React from 'react';
import { stylesheet } from 'typestyle';

const localStyles = stylesheet({
  header: {
    borderBottom: 'var(--jp-border-width) solid var(--jp-border-color2)',
    fontSize: '18px',
    margin: 0,
    padding: '8px 12px 8px 24px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerButton: {
    marginRight: '36px',
  },
});

export const Header: React.SFC<{
  text: string;
  buttons?: React.ReactNode[];
}> = props => {
  return (
    <header className={localStyles.header}>
      {props.text}
      {props.buttons &&
        props.buttons.map((button, index) => (
          <div
            key={`header_button_${index}`}
            className={localStyles.headerButton}
          >
            {button}
          </div>
        ))}
    </header>
  );
};
