import * as csstips from 'csstips';
import * as React from 'react';
import { style } from 'typestyle';
import { Button } from '@material-ui/core';

interface Props {
  children?: React.ReactNode;
  closeLabel?: string;
  onClick: () => void;
}

const actionBar = style({
  padding: '16px',
  $nest: {
    '&>*': {
      marginLeft: '16px',
    },
  },
  ...csstips.horizontal,
  ...csstips.endJustified,
});

/** Funtional Component for defining an action bar with buttons. */
export function ActionBar(props: Props) {
  return (
    <div className={actionBar}>
      <Button onClick={props.onClick}>
        {props.closeLabel || 'Close'}
      </Button>
      {props.children}
    </div>
  );
}
