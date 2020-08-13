import * as csstips from 'csstips';
import * as React from 'react';
import { stylesheet } from 'typestyle';
import Button from '@material-ui/core/Button';
import { withStyles, createStyles } from '@material-ui/core/styles';

interface Props {
  primaryLabel: string;
  secondaryLabel?: string;
  onPrimaryClick: () => void;
  onSecondaryClick?: () => void;
}

const STYLES = stylesheet({
  actionBar: {
    marginTop: '25px',
    display: 'block',
    ...csstips.horizontal,
    ...csstips.endJustified,
  },
});

const SecondaryButton = withStyles(() =>
  createStyles({
    root: {
      marginRight: '10px',
      textTransform: 'capitalize',
      fontFamily: 'var(--jp-ui-font-family)',
    },
  })
)(Button);

const PrimaryButton = withStyles(() =>
  createStyles({
    root: {
      textTransform: 'capitalize',
      fontFamily: 'var(--jp-ui-font-family)',
    },
  })
)(Button);

/** Funtional Component for defining an action bar with buttons. */
export function ActionBar(props: Props) {
  return (
    <div className={STYLES.actionBar}>
      {props.secondaryLabel && (
        <SecondaryButton
          variant="contained"
          size="small"
          disableRipple={true}
          disableElevation={true}
          onClick={props.onSecondaryClick}
        >
          {props.secondaryLabel}
        </SecondaryButton>
      )}
      <PrimaryButton
        variant="contained"
        color="primary"
        size="small"
        disableRipple={true}
        disableElevation={true}
        onClick={props.onPrimaryClick}
      >
        {props.primaryLabel}
      </PrimaryButton>
    </div>
  );
}
