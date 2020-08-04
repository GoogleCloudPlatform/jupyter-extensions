import { ParameterSpec } from '../../types';
import { TreeNode } from 'react-tree-graph';
import { styles } from '../../utils/styles';

function isString(value: unknown): value is string {
  return typeof value === 'string';
}

function isStringArray(array: unknown[]): array is string[] {
  return array.length === 0 || typeof array[0] === 'string';
}

interface ReactTreeCommonNodeOptions {
  onClick?: (spec: ParameterSpec) => void;
}

export class CommonNode {
  public readonly validValues: string[] | number[];
  public readonly validForParentValues: string[] | number[] | undefined;
  public readonly children: CommonNode[];

  constructor(
    public readonly spec: ParameterSpec,
    public readonly parentNode?: CommonNode
  ) {
    // Setup children
    switch (spec.type) {
      case 'DISCRETE':
      case 'INTEGER':
      case 'CATEGORICAL':
        if ('childParameterSpecs' in spec) {
          this.children = spec.childParameterSpecs.map(
            childSpec => new CommonNode(childSpec, this)
          );
        } else {
          this.children = [];
        }
        break;
      default:
        this.children = [];
    }

    // Setup validValues
    switch (spec.type) {
      case 'DISCRETE':
        this.validValues = spec.discreteValueSpec.values;
        break;
      case 'INTEGER': {
        const min = parseInt(spec.integerValueSpec.minValue, 10);
        const max = parseInt(spec.integerValueSpec.maxValue, 10);
        const values: string[] = [];
        for (let i = min; i <= max; ++i) {
          values.push(i.toString(10));
        }
        this.validValues = values;
        break;
      }
      case 'CATEGORICAL':
        this.validValues = spec.categoricalValueSpec.values;
        break;
      default:
        this.validValues = [];
    }

    // Setup validForParentValues
    if (parentNode) {
      switch (parentNode.spec.type) {
        case 'CATEGORICAL':
          if ('parentCategoricalValues' in spec) {
            this.validForParentValues = spec.parentCategoricalValues.values;
          } else {
            throw TypeError(
              `Invalid child for parent with type "${parentNode.spec.type}"`
            );
          }
          break;
        case 'DISCRETE':
          if ('parentDiscreteValues' in spec) {
            this.validForParentValues = spec.parentDiscreteValues.values;
          } else {
            throw TypeError(
              `Invalid child for parent with type "${parentNode.spec.type}"`
            );
          }
          break;
        case 'INTEGER':
          if ('parentIntValues' in spec) {
            this.validForParentValues = spec.parentIntValues.values;
          } else {
            throw TypeError(
              `Invalid child for parent with type "${parentNode.spec.type}"`
            );
          }
          break;
        default:
          throw TypeError(
            `Invalid child for parent with type "${parentNode.spec.type}"`
          );
      }
    }
  }

  get isTree(): boolean {
    return this.children.length > 0;
  }

  public toString(): string {
    return this.spec.parameter;
  }

  /**
   * Creates a list of children that correspond the `value`.
   * @param value The parent value that corresponds to the child valid values.
   * @param options Options for react tree graph nodes in the tree.
   * @param path names of nodes in path to current node.
   */
  private getValueReactTreeNodes(
    value: string | number,
    options: ReactTreeCommonNodeOptions,
    path: string[]
  ): TreeNode[] {
    return this.children
      .filter(child => {
        if (!('validForParentValues' in child)) {
          throw new Error('Invalid child node.');
        }

        // This is a weird if statement, but typescript does not like it when I
        // compare isString to isStringArray. The typings just do not work.
        // both are string
        if (isString(value) && isStringArray(child.validForParentValues)) {
          return child.validForParentValues.includes(value);
        } else if (
          // both are numbers
          !isString(value) &&
          !isStringArray(child.validForParentValues)
        ) {
          return child.validForParentValues.includes(value);
        } else {
          // parent and child values do not match up
          throw new Error('Invalid child node.');
        }
      })
      .map(child => child.toReactTreeGraph(options, path, true));
  }

  /**
   * Creates a value node with children that correspond to that value.
   * @param value The parent value that corresponds to the child valid values.
   * @param options Options for react tree graph nodes in the tree.
   * @param path names of nodes in path to current node.
   */
  private categoryChildren(
    category: string | number,
    options: ReactTreeCommonNodeOptions,
    path: string[]
  ): TreeNode {
    const name = isString(category) ? category : category.toString(10);
    const newPath = [...path, name];
    const categoryChildren: TreeNode[] = this.getValueReactTreeNodes(
      category,
      options,
      newPath
    );
    const pathString = newPath.join('/');
    return {
      id: pathString,
      name,
      gProps: { className: styles.noClick, 'data-testid': pathString },
      children: categoryChildren,
    };
  }

  /**
   * Returns a `react-tree-graph` node for the current node.
   * @param options Options for react tree graph nodes in the tree.
   * @param path names of nodes in path to current node.
   * @param valueSubNodes Show values for type with children as a node.
   */
  public toReactTreeGraph(
    options: ReactTreeCommonNodeOptions,
    path: string[],
    valueSubNodes = false
  ): TreeNode {
    let children: TreeNode[];
    const newPath = [...path, this.toString()];
    const pathString = newPath.join('/');
    if (valueSubNodes) {
      // Weird code below, but I had to do this since the type for valid values
      // is string[] | number[]
      // https://stackoverflow.com/questions/56884065/typed-arrays-and-union-types
      children = (isStringArray(this.validValues)
        ? this.validValues.map(value =>
            this.categoryChildren(value, options, newPath)
          )
        : this.validValues.map(value =>
            this.categoryChildren(value, options, newPath)
          )
      ).filter(child => child.children.length > 0);
    } else {
      children = this.children.map(child =>
        child.toReactTreeGraph(options, newPath, false)
      );
    }

    const gProps = { className: styles.node, 'data-testid': pathString };

    if ('onClick' in options) {
      gProps['onClick'] = () => options.onClick(this.spec);
    }

    return {
      id: pathString,
      name: this.toString(),
      gProps,
      children,
    };
  }

  /**
   * Creates a valid `react-tree-graph` tree.
   * @param parameterSpecs The parameter specification list.
   * @param options Options for react tree graph nodes in the tree.
   * @param valueSubNodes Show values for type with children as a node.
   */
  static createReactTreeGraph(
    parameterSpecs: ParameterSpec[],
    options: ReactTreeCommonNodeOptions = {},
    valueSubNodes = false
  ): TreeNode {
    return {
      id: 'root',
      name: 'root',
      gProps: { className: styles.noClick, 'data-testid': 'root' },
      children: parameterSpecs.map(spec =>
        new CommonNode(spec).toReactTreeGraph(options, ['root'], valueSubNodes)
      ),
    };
  }

  /**
   * Returns whether or not a parameter specification list is a tree.
   * @param parameterSpecs The parameter specification list.
   */
  static isTree(parameterSpecs: ParameterSpec[]): boolean {
    if (parameterSpecs.length === 0) {
      return false;
    }
    return parameterSpecs.some(spec => new CommonNode(spec).isTree);
  }
}
