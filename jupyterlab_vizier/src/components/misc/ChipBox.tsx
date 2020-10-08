import React from 'react';
import { Box } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles(theme => ({
  container: {
    borderRadius: '10px',
    width: '100%',
    border: '#e6e7e8 solid 3px',
    // Hides child chip container box overflow for border radius
    overflow: 'hidden',
  },
  chipContainer: {
    backgroundColor: '#f8f9fa',
    borderBottom: '#e6e7e8 solid 3px',
  },
  chipList: {
    display: 'flex',
    justifyContent: 'center',
    flexWrap: 'wrap',
    listStyle: 'none',
    margin: 0,
  },
}));

export const ChipBoxHeader: React.FC = ({ children }) => {
  const styles = useStyles();
  return (
    <Box className={styles.chipContainer} display="flex" p={2}>
      <Box className={styles.chipList}>{children}</Box>
    </Box>
  );
};

export const ChipBoxBody: React.FC = ({ children }) => {
  return <Box p={2}>{children}</Box>;
};

export const ChipBox: React.FC = ({ children }) => {
  const styles = useStyles();
  return <Box className={styles.container}>{children}</Box>;
};
