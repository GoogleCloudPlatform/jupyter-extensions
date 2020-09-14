/* eslint-disable @typescript-eslint/camelcase */
import { CodeMirror } from 'codemirror';
import { Dialog, showDialog } from '@jupyterlab/apputils';
import { ISignal, Signal } from '@lumino/signaling';
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
  private _conflictState: Signal<this, boolean> = new Signal<this, boolean>(
    this
  );

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

  get conflictState(): ISignal<this, boolean> {
    return this._conflictState;
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

  async mergeVersions(): Promise<string> {
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
      await this._resolveDialog();
    }

    this._updateState(false);
    return this.versions.merged;
  }

  private _updateState(state: boolean): void {
    if (state !== this.conflict) {
      this._conflict = state;
      this._conflictState.emit(state);
    }
  }

  private async _resolveDialog(): Promise<void> {
    const body = `"${this.path}" has a conflict. Would you like to revert to a previous version\
      \nor view the diff? (Note that ignoring conflicts will stop git sync.)`;
    // const resolveBtn = Dialog.okButton({ label: 'Resolve Conflicts' });
    const localBtn = Dialog.okButton({ label: 'Revert to Local' });
    const remoteBtn = Dialog.okButton({ label: 'Revert to Remote' });
    const diffBtn = Dialog.okButton({ label: 'View Diff' });
    const ignoreBtn = Dialog.warnButton({ label: 'Ignore Conflict' });
    return showDialog({
      title: 'Merge Conflicts',
      body,
      buttons: [ignoreBtn, remoteBtn, localBtn, diffBtn],
    }).then(result => {
      if (result.button.label === 'Revert to Local') {
        this._versions.merged = this.versions.local;
        this._versions.merged_tok = this.versions.local_tok;
      }
      if (result.button.label === 'Revert to Remote') {
        this._versions.merged = this.versions.remote;
        this._versions.merged_tok = undefined;
      }
      if (result.button.label === 'View Diff') {
        this._versions.merged_tok = undefined;
      }
      if (result.button.label === 'Resolve Conflicts') {
        console.log('do something');
        // TO DO (ashleyswang) : open an editor for 3 way merging
      }
      if (result.button.label === 'Ignore') {
        this._updateState(true);
        throw new Error(
          'ConflictError: Unresolved conflicts in repository. Stopping sync procedure.'
        );
      }
    });
  }
}
