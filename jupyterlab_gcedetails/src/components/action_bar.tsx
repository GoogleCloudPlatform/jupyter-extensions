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
  primaryButtonProps?: React.ButtonHTMLAttributes<HTMLButtonElement>;
  secondaryButtonProps?: React.ButtonHTMLAttributes<HTMLButtonElement>;
}

const STYLES = stylesheet({
  actionBar: {
    margin: '25px 0px',
    display: 'block',
    ...csstips.horizontal,
    ...csstips.endJustified,
  },
  secondaryButton: {
    margin: '0px 10px',
  },
});

const SecondaryButton = withStyles(() =>
  createStyles({
    root: {
      marginRight: '10px',
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
          {...props.secondaryButtonProps}
        >
          {props.secondaryLabel}
        </SecondaryButton>
      )}
      <Button
        variant="contained"
        color="primary"
        size="small"
        disableRipple={true}
        disableElevation={true}
        onClick={props.onPrimaryClick}
        {...props.primaryButtonProps}
      >
        {props.primaryLabel}
      </Button>
    </div>
  );
}
