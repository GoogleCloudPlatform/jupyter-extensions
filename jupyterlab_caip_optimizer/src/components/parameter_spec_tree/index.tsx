import * as React from 'react';
import Tree from 'react-tree-graph';
import useResizeAware from 'react-resize-aware';
import { ParameterSpec } from '../../types';
import { CommonNode } from './common_node';

interface Props {
  specs: ParameterSpec[];
  onClick?: (spec: ParameterSpec) => void;
}

export const ParameterSpecTree: React.FC<Props> = ({ specs, onClick }) => {
  const [resizeListener, sizes] = useResizeAware();
  const rootNode = CommonNode.createReactTreeGraph(specs, { onClick }, false);
  return (
    <div style={{ position: 'relative', width: '100%', height: '50vh' }}>
      {resizeListener}
      <Tree
        data={rootNode}
        height={sizes.height}
        width={sizes.width}
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
