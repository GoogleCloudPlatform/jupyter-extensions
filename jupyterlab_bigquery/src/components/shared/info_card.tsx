import * as React from 'react';
import { Paper } from '@material-ui/core';
import { stylesheet } from 'typestyle';

const localStyles = stylesheet({
  container: {
    display: 'flex',
    alignItems: 'stretch',
    marginBottom: '12px',
    backgroundColor: 'var(--jp-layout-color0)',
    justifyContent: 'space-between',
    paddingRight: '12px',
  },
  leftSide: {
    display: 'flex',
  },
  icon: {
    marginRight: '12px',
  },
  messageSpace: {
    padding: '4px 8px',
    display: 'flex',
    alignItems: 'center',
  },
});

interface InfoCardProps {
  message: React.ReactNode;
  button?: React.ReactNode;
  color: string;
  // TODO: figure out type so only material ui icons accepted,
  // and make it work with using .type
  icon: any;
}

// Card with matching colored strip and icon, and info message
const InfoCard = (props: InfoCardProps) => {
  const { message, color, icon, button } = props;
  return (
    <Paper className={localStyles.container} variant="outlined">
      <div className={localStyles.leftSide}>
        <div style={{ width: '6px', backgroundColor: color }} />
        <div className={localStyles.messageSpace}>
          <icon.type
            {...icon.props}
            className={localStyles.icon}
            style={{ color: color }}
            fontSize="default"
          />
          {message}
        </div>
      </div>
      {button}
    </Paper>
  );
};

export default InfoCard;
