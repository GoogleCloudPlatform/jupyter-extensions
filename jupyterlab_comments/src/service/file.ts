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
 */

import * as path from 'path';
import { FileEditor } from '@jupyterlab/fileeditor';
import { CodeMirrorEditor } from '@jupyterlab/codemirror';
import { CodeMirror } from 'codemirror';
import { IDocumentWidget } from '@jupyterlab/docregistry';
import { NotebookModel } from '@jupyterlab/notebook';

//Extract the file name from the full file path
export function trimPath(filePath: string) {
  try {
    return path.basename(filePath);
  } catch (e) {
    console.log('Error trimming file path, returning untrimmed path.');
    return filePath;
  }
}

export interface Range {
  startLine: number;
  endLine?: number;
  startColumn?: number;
  endColumn?: number;
}

export class NotebookFile {
  notebook: NotebookModel;

  constructor(widget: any) {
    this.notebook = widget.content.model as NotebookModel;
  }

  getContext(range: Range) {
    //TODO (mkalil): get context for the given range within the notebook file
    return null;
  }
}

export class RegularFile {
  codeMirror: CodeMirror;
  codeMirrorEditor: CodeMirrorEditor;

  constructor(widget: IDocumentWidget) {
    this.codeMirror = ((widget.content as FileEditor)
      .editor as CodeMirrorEditor).editor;
    this.codeMirrorEditor = (widget.content as FileEditor)
      .editor as CodeMirrorEditor;
  }
  /*
    Return an array of lines from the file that correspond to the given range object
    Each line is a tuple (line number, text)
    Return null if the comment was not created with the range attribute, or
    if the given range no longer exists in the file
    */
  getContext(range: Range) {
    const contextInFile: Array<[number, string]> = new Array<
      [number, string]
    >();
    //a startLine of zero means that this comment is not attached to a particular line number
    if (range.startLine === 0) {
      return null;
    }
    if (!range.endLine) {
      //Context is a single line, or part of a single line
      const untrimmedLine: string = this.codeMirror.getLine(range.startLine);
      //if untrimmedLine is undefined, the comment was left on a line in the file that no longer exists, so return null
      if (untrimmedLine) {
        const leftIndex = range.startColumn ? range.startColumn : 0;
        if (range.endColumn) {
          contextInFile.push([
            range.startLine,
            untrimmedLine.substring(leftIndex, range.endColumn),
          ]);
        } else {
          contextInFile.push([
            range.startLine,
            untrimmedLine.substring(leftIndex),
          ]);
        }
        return contextInFile;
      } else {
        return null;
      }
    } else {
      //when range has both startLine and endLine attributes, take at most 3 lines of the file to display
      const endLine = Math.max(range.endLine, range.startLine + 3);
      for (let i = range.startLine; i < endLine; i++) {
        contextInFile.push([i, this.codeMirror.getLine(i)]);
      }
      return contextInFile;
    }
  }
}
