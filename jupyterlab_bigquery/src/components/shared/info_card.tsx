import * as React from 'react';
import { Paper, withStyles } from '@material-ui/core';
import { stylesheet } from 'typestyle';

const localStyles = stylesheet({
  container: {
    root: {
      backgroundColor: 'var(--jp-layout-color0)',
    },
    display: 'flex',
    alignItems: 'stretch',
    marginBottom: '12px',
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

const StyledPaper = withStyles({
  root: {
    backgroundColor: 'var(--jp-layout-color0)',
    border: '1px solid var(--jp-border-color2)',
    color: 'var(--jp-ui-font-color1)',
    display: 'flex',
    alignItems: 'stretch',
    marginBottom: '12px',
    justifyContent: 'space-between',
    paddingRight: '12px',
  },
})(Paper);

// TODO: figure out type so only material ui icons accepted,
// and make it work with using .type
type MaterialUIIcon = any;

interface InfoCardProps {
  message: React.ReactNode;
  button?: React.ReactNode;
  color: string;
  icon: MaterialUIIcon;
}

// Card with matching colored strip and icon, and info message
const InfoCard = (props: InfoCardProps) => {
  const { message, color, icon, button } = props;
  return (
    <StyledPaper className={localStyles.container} variant="outlined">
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
    </StyledPaper>
  );
};

export default InfoCard;
