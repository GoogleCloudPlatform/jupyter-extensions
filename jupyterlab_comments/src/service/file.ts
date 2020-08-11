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
    startLine: number,
    endLine?: number,
    startColumn?: number,
    endColumn?: number,
}

export class File {

    editor: CodeMirror;

    constructor(widget: IDocumentWidget) {
        this.editor = ((widget.content as FileEditor).editor as CodeMirrorEditor).editor;
    }

    getContext(range: Range) {
        var contextInFile : string;
        //a startLine of zero means that this comment is not attached to a particular line number
        if (range.startLine == 0) {
            return null;
        }
        if (!range.endLine) {
            const untrimmedLine : string = this.editor.getLine(range.startLine);
            const leftIndex = range.startColumn ? range.startColumn : 0;
            if (range.endColumn) {
                contextInFile = untrimmedLine.substring(leftIndex, range.endColumn);
            } else {
                contextInFile = untrimmedLine.substring(leftIndex);
            }
        }
        //range has both startLine and endLine attributes
        else {
            const endLineLength = this.editor.getLine(range.endLine).length;
            const startPosition = {
                line: range.startLine,
                column: 0,
            }
            const endPosition = {
                line: range.endLine,
                column: endLineLength - 1,
            }

            contextInFile = this.editor.getRange(startPosition, endPosition);
        }
        return contextInFile;
    }
}
