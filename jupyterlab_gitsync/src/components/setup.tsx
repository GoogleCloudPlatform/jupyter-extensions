import * as React from 'react';
import { File } from './file';
import { GitSyncService } from '../service/service';

import {
  // NOTE: keep in alphabetical order
  fileNavClass,
  fileEntry,
} from '../style/files';

export interface Props {
  service: GitSyncService;
}

// TO DO: Implement Git Repo setup for sync configuration

export class GitSetup extends React.Component<Props> {
  /**
   * Returns a React component for rendering a panel toolbar.
   *
   * @param props - component properties
   * @returns React component
   */
  constructor(props: Props) {
    super(props);
  }

  /**
   * Renders the component.
   *
   * @returns React element
   */
  render(): React.ReactElement {
    return (
      <div className={fileNavClass}>
        <h3>Files with Merge Conflicts</h3>
        <table>
          <tbody>
            <tr className={fileEntry}>
              <th>File Name</th>
            </tr>
            {this._renderFiles()}
          </tbody>
        </table>
      </div>
    );
  }

  private _renderFiles() {
    const files = this.props.service.git.fileConflicts;

    if (files) {
      return files.map(file => {
        <File path={file} />;
      });
    } else {
      return (
        <tr>
          <td>No files with merge conflicts</td>
        </tr>
      );
    }
  }
}
