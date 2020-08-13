import * as csstips from 'csstips';
import * as React from 'react';
import { stylesheet, classes } from 'typestyle';
import { css, COLORS } from 'gcp_jupyterlab_shared';

interface Props {
  primaryLabel: string;
  secondaryLabel?: string;
  onPrimaryClick: () => void;
  onSecondaryClick?: () => void;
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
        >
          {props.secondaryLabel}
        </button>
      )}
      <button
        type="button"
        className={classes(css.button, STYLES.primaryButton)}
        onClick={props.onPrimaryClick}
      >
        {props.primaryLabel}
      </button>
    </div>
  );
}
