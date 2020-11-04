declare module 'react-tree-graph' {
  import * as React from 'react';

  export interface TreeNode {
    id: string;
    gProps?: object;
    pathProps?: object;
    name: string;
    children: TreeNode[];
  }

  export interface TreeProps {
    data: TreeNode;
    height: number;
    width: number;
    margins?: { top?: number; bottom?: number; left?: number; right?: number };
    // TODO: better typings for element props
    svgProps?: object;
    gProps?: React.SVGProps<SVGGElement>;
    nodeProps?: React.SVGProps<SVGCircleElement>;
    textProps?: React.SVGProps<SVGTextElement>;
    keyProp?: string;
  }

  class Tree extends React.Component<TreeProps, any> {}

  export default Tree;
}
