import { stylesheet } from 'typestyle';

export const styles = stylesheet({
  root: {
    // 25px for the bottom statusbar in jupyter
    height: 'calc(100% - 25px)',
    overflow: 'scroll',
    position: 'relative',
  },
  tree: {
    $nest: {
      'path.link': {
        fill: 'none',
        stroke: '#2593b8',
        strokeWidth: '1.5px',
      },
    },
  },
  node: {
    cursor: 'pointer',
    $nest: {
      '& circle': {
        fill: 'rgb(247, 106, 214)',
        stroke: 'rgb(184, 37, 81)',
        strokeWidth: '1.5px',
      },
      '& text': {
        fontFamily: `'Roboto', sans-serif`,
        backgroundColor: 'black',
        fill: 'black',
      },
    },
  },
  noClick: {
    cursor: 'default',
    $nest: {
      '& circle': {
        fill: 'rgb(70, 109, 216)',
        stroke: 'rgb(27, 30, 179)',
        strokeWidth: '1.5px',
      },
      '& text': {
        fontFamily: `'Roboto', sans-serif`,
        backgroundColor: 'black',
        fill: 'black',
      },
    },
  },
});
