/* eslint-disable @typescript-eslint/camelcase */
import { CodeMirror } from 'codemirror';
import * as diff3 from 'node-diff3';

import { IResolver } from './tracker';
import { TextFile } from './text_file';

function token(): string {
  let token = '';
  while (token.length < 32)
    token += Math.random()
      .toString(36)
      .substr(2);
  return '/$*' + token + '*$/';
}

interface Versions {
  base: string;
  local: string;
  remote: string;
  local_tok: string;
  merged: string;
  merged_tok: string;
}

export class TextResolver implements IResolver {
  private _file: TextFile;
  private _token: string = token();
  private _versions: Versions = {
    base: undefined,
    local: undefined,
    remote: undefined,
    local_tok: undefined,
    merged: undefined,
    merged_tok: undefined,
  };

  private _conflict: boolean;

  constructor(file: TextFile) {
    this._file = file;
  }

  get file(): TextFile {
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

  setCursorToken(pos: CodeMirror.Pos): void {
    const text = this.versions.local.split('\n');
    let line = text[pos.line];

    const before = line.slice(0, pos.ch);
    const after = line.slice(pos.ch);
    line = before + this._token + after;

    text[pos.line] = line;
    this._versions.local_tok = text.join('\n');
  }

  getCursorToken(): CodeMirror.Pos {
    if (this.versions.merged_tok) {
      const text = this.versions.merged_tok.split('\n');
      for (let i = 0; i < text.length; i++) {
        if (text[i].indexOf(this._token) > -1) {
          const line = i;
          const ch = text[i].indexOf(this._token);
          return { line: line, ch: ch };
        }
      }
    }
    return { line: 0, ch: 0 };
  }

  addVersion(content: string, origin: 'base' | 'local' | 'remote'): void {
    this._versions[origin] = content;
  }

  mergeVersions(): string {
    if (this.versions.local === this.versions.remote) {
      this.addVersion(this.versions.local, 'base');
      return undefined;
    }

    const result = diff3.merge(
      this.versions.local_tok,
      this.versions.base,
      this.versions.remote,
      { stringSeparator: '\n' }
    );

    if (result.conflict) {
      result.result = result.result.map(value => {
        switch (value) {
          case '\n<<<<<<<<<\n':
            return '\n<<<<<<<<< LOCAL\n';
          case '\n>>>>>>>>>\n':
            return '\n>>>>>>>>> REMOTE\n';
          default:
            return value;
        }
      });
    }
    const text = result.result.join('\n');
    this._versions.merged_tok = text;
    this._versions.merged = text.replace(this._token, '');

    if (result.conflict) {
      this._conflict = true;
      return undefined;
    } else {
      this._conflict = false;
      return this.versions.merged;
    }
  }
}
