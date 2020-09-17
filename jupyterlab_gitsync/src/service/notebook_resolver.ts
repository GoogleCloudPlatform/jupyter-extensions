import { CodeEditor } from '@jupyterlab/codeeditor';
import { INotebookContent } from '@jupyterlab/nbformat';
import {
  mergeNotebooks as nbmerge,
  notebooksAreEqual as nbEquals,
} from './nbmerge_api';

import { IResolver } from './tracker';
import { NotebookFile } from './notebook_file';

function token(): string {
  let token = '';
  while (token.length < 32)
    token += Math.random()
      .toString(36)
      .substr(2);
  return '/$*' + token + '*$/';
}

interface Versions {
  base: any;
  local: any;
  remote: any;
  localTok: any;
  merged: any;
  mergedTok: string[][];
}

export class NotebookResolver implements IResolver {
  private _file: NotebookFile;
  private _token: string = token();
  private _versions: Versions = {
    base: undefined,
    local: undefined,
    remote: undefined,
    localTok: undefined,
    merged: undefined,
    mergedTok: undefined,
  };

  private _conflict: boolean;

  constructor(file: NotebookFile) {
    this._file = file;
  }

  get file(): NotebookFile {
    return this._file;
  }

  get path(): string {
    return this._file.path;
  }

  get conflict(): boolean {
    return this._conflict;
  }

  get versions(): Versions {
    return this._versions;
  }

  setCursorToken(index: number, pos: CodeEditor.IPosition): void {
    const json = this.versions.local;
    const source = json.cells[index].source;
    const text = source.split('\n');
    let line = text[pos.line];

    const before = line.slice(0, pos.column);
    const after = line.slice(pos.column);
    line = before + this._token + after;

    text[pos.line] = line;
    json.cells[index].source = text.join('\n');
    this._versions.localTok = json;
  }

  getCursorToken(): { index: number; pos: CodeEditor.IPosition } {
    if (this.versions.mergedTok) {
      const input = this.versions.mergedTok;
      for (let i = 0; i < input.length; i++) {
        if (input[i].join('').indexOf(this._token) > -1) {
          const index = i;
          const text = input[i];
          for (let j = 0; j < text.length; j++) {
            if (text[j].indexOf(this._token) > -1) {
              const line = j;
              const column = text[j].indexOf(this._token);
              return { index: index, pos: { line: line, column: column } };
            }
          }
        }
      }
    }
    return undefined;
  }

  addVersion(content: any, origin: 'base' | 'local' | 'remote'): void {
    this._versions[origin] = content;
  }

  mergeVersions(): INotebookContent {
    if (nbEquals(this.versions.local, this.versions.remote)) {
      this.addVersion(this.versions.local, 'base');
      return undefined;
    }

    const result = nbmerge(
      this.versions.base,
      this.versions.localTok,
      this.versions.remote
    );

    const text = JSON.stringify(result.content).replace(this._token, '');
    this._versions.mergedTok = result.source;
    this._versions.merged = JSON.parse(text);

    if (result.conflict) {
      this._conflict = true;
      return undefined;
    } else {
      this._conflict = false;
      return this.versions.merged;
    }
  }
}
