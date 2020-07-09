import * as React from 'react';
import { CircularProgress } from '@material-ui/core';
import { stylesheet } from 'typestyle';

const localStyles = stylesheet({
  container: {
    display: 'flex',
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

const LoadingPanel = () => {
  return (
    <div className={localStyles.container}>
      <CircularProgress />
    </div>
  );
};

export default LoadingPanel;
