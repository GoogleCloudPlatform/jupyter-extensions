import * as csstips from 'csstips';
import * as React from 'react';
import { stylesheet, classes } from 'typestyle';
import { css, COLORS } from 'gcp_jupyterlab_shared';

interface Props {
  primaryLabel: string;
  secondaryLabel?: string;
  onPrimaryClick: () => void;
  onSecondaryClick?: () => void;
  primaryButtonProps?: React.ButtonHTMLAttributes<HTMLButtonElement>;
  secondaryButtonProps?: React.ButtonHTMLAttributes<HTMLButtonElement>;
}

const STYLES = stylesheet({
  actionBar: {
    padding: '16px',
    marginTop: '5px',
    display: 'block',
    $nest: {
      '&>*': {
        marginLeft: '16px',
      },
    },
    ...csstips.horizontal,
    ...csstips.endJustified,
  },
  primaryButton: {
    backgroundColor: COLORS.blue,
    color: COLORS.white,
    $nest: {
      '&:disabled': {
        backgroundColor: '#bfbfbf',
      },
      '&:hover': {
        cursor: 'pointer',
      },
      '&:disabled:hover': { cursor: 'default' },
    },
  },
});

/** Funtional Component for defining an action bar with buttons. */
export function ActionBar(props: Props) {
  return (
    <div className={STYLES.actionBar}>
      {props.secondaryLabel && (
        <button
          type="button"
          className={css.button}
          onClick={props.onSecondaryClick}
          {...props.secondaryButtonProps}
        >
          {props.secondaryLabel}
        </button>
      )}
      <button
        type="button"
        className={classes(css.button, STYLES.primaryButton)}
        onClick={props.onPrimaryClick}
        {...props.primaryButtonProps}
      >
        {props.primaryLabel}
      </button>
    </div>
  );
}
