/**
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 **/
import React from 'react';
import { RegularFile, NotebookFile, Range } from '../service/file';

interface Props {
  range: Range;
  filePath: string;
  file?: RegularFile | NotebookFile;
}

const styles = {
  lines: {
    display: 'block',
    backgroundColor: 'lightgrey',
    padding: '10px',
    borderRadius: '3px',
  },
  lineNumber: {
    color: 'white',
    display: 'inline',
    paddingRight: '5px',
    fontSize: '10px',
  },
  lineText: {
    display: 'inline',
  },
};

export class CommentContext extends React.Component<Props> {
  render() {
    const context = this.props.file.getContext(this.props.range);
    if (context) {
      const lines = context.map(line => (
        <div>
          <p style={styles.lineNumber}> {line[0]} </p>
          <code style={styles.lineText}> {line[1]} </code>
        </div>
      ));
      return <div style={styles.lines}> {lines} </div>;
    } else {
      return <div> </div>;
    }
  }
}
