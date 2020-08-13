import * as React from 'react';
import Tree from 'react-tree-graph';
import useResizeAware from 'react-resize-aware';
import { ParameterSpec } from '../../types';
import { CommonNode } from './common_node';
import { makeStyles } from '@material-ui/core/styles';

interface Props {
  specs: ParameterSpec[];
  onClick?: (spec: ParameterSpec) => void;
}

const useStyles = makeStyles(theme => ({
  tree: {
    '& path.link': {
      fill: 'none',
      stroke: theme.palette.primary.main,
      strokeWidth: '1.5px',
    },
  },
  node: {
    cursor: 'pointer',
    '& circle': {
      fill: theme.palette.secondary.main,
      stroke: theme.palette.secondary.dark,
      strokeWidth: '1.5px',
    },
    '& text': {
      fontFamily: theme.typography.body1.fontFamily,
      backgroundColor: theme.palette.text.primary,
      fill: theme.palette.text.primary,
    },
  },
  noClick: {
    cursor: 'default',
    '& circle': {
      fill: theme.palette.primary.main,
      stroke: theme.palette.primary.dark,
      strokeWidth: '1.5px',
    },
    '& text': {
      fontFamily: theme.typography.body1.fontFamily,
      backgroundColor: theme.palette.text.primary,
      fill: theme.palette.text.primary,
    },
  },
}));

export const ParameterSpecTree: React.FC<Props> = ({ specs, onClick }) => {
  const styles = useStyles();
  const [resizeListener, sizes] = useResizeAware();
  const rootNode = CommonNode.createReactTreeGraph(
    specs,
    {
      onClick,
      parameterNode: { className: styles.node },
      parameterValueNode: { className: styles.noClick },
    },
    false
  );
  return (
    <div
      style={{ position: 'relative', width: '100%', height: '50vh' }}
      className={styles.tree}
    >
      {resizeListener}
      <Tree
        data={rootNode}
        height={sizes.height ?? 0}
        width={sizes.width ?? 0}
        margins={{ top: 20, bottom: 10, left: 20, right: 200 }}
        keyProp="id"
        nodeProps={{
          r: 15,
        }}
        textProps={{
          x: 5,
          y: -20,
        }}
      />
    </div>
  );
};
