import { stylesheet } from 'typestyle';

export const styles = stylesheet({
  root: {
    // 25px for the bottom statusbar in jupyter
    height: 'calc(100% - 25px)',
    overflow: 'scroll',
  },
});
