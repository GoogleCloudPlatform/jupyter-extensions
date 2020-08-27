import { CodeEditor } from '@jupyterlab/codeeditor';
import { Dialog, showDialog } from '@jupyterlab/apputils';
import { ISignal, Signal } from '@lumino/signaling';
import { mergeNotebooks as nbmerge } from './nbmerge_api';

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
  local_tok: any;
  merged: any;
  merged_tok: string[][];
}

export class NotebookResolver implements IResolver {
  private _file: NotebookFile;
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
  private _conflictState: Signal<this, boolean> = new Signal<this, boolean>(this);

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

  get conflictState(): ISignal<this, boolean> {
    return this._conflictState;
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
    this._versions.local_tok = json;
  }

  getCursorToken(): { index: number; pos: CodeEditor.IPosition } {
    if (this.versions.merged_tok) {
      const input = this.versions.merged_tok;
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

  async mergeVersions(): Promise<any> {
    const result = nbmerge(
      this.versions.base,
      this.versions.local_tok,
      this.versions.remote
    );

    const text = JSON.stringify(result.content).replace(this._token, '');
    this._versions.merged_tok = result.source;
    this._versions.merged = JSON.parse(text);
    if (result.conflict) {
      await this._resolveDialog();
    }

    this._updateState(false);
    return this.versions.merged;
  }

  private _updateState(state: boolean) {
    if (state !== this.conflict) {
      this._conflict = state;
      this._conflictState.emit(state);
    }
  }

  private async _resolveDialog(): Promise<void> {
    const body = `"${this.path}" has a conflict. Would you like to revert to a previous version?\
      \n(Note that ignoring conflicts will stop git sync.)`;
    // const resolveBtn = Dialog.okButton({ label: 'Resolve Conflicts' });
    const localBtn = Dialog.okButton({ label: 'Revert to Local' });
    const remoteBtn = Dialog.okButton({ label: 'Revert to Remote' });
    const diffBtn = Dialog.okButton({ label: 'View Diff' });
    const ignoreBtn = Dialog.warnButton({ label: 'Ignore Conflict' });
    return showDialog({
      title: 'Merge Conflicts',
      body,
      buttons: [ignoreBtn, remoteBtn, localBtn, diffBtn],
    }).then(async result => {
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
