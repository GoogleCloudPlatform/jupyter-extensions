import * as React from 'react';
import { fileEntry } from '../style/files';

export interface Props {
  path: string;
}

export interface State {
  serviceState: string;
}

export class File extends React.Component<Props, State> {
  /**
   * Returns a React component for rendering a panel toolbar.
   *
   * @param props - component properties
   * @returns React component
   */

  constructor(props: Props) {
    super(props);
    this.state = {
      serviceState: 'Running',
    };
  }

  /**
   * Renders the component.
   *
   * @returns React element
   */
  render(): React.ReactElement {
    return (
      <tr className={fileEntry}>
        <td>{this.props.path}</td>
        <td>
          <button type="button" onClick={this._onResolveClick}>
            {' '}
            Resolve{' '}
          </button>
        </td>
      </tr>
    );
  }

  private _onResolveClick() {
    console.log('file resolved');
  }
}
