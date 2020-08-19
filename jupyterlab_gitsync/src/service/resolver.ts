import { CodeMirror } from 'codemirror';
import { Dialog, showDialog } from '@jupyterlab/apputils';
import { ISignal, Signal } from '@lumino/signaling';
import { default as merge } from 'diff3';

import { IResolver } from './tracker';
import { File } from './File';

function token() {
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
}

export class FileResolver implements IResolver {
  _file: File;
  _token: string = token();
  _cursor: CodeMirror.Pos;
  private _versions: Versions = {
    base: undefined,
    local: undefined,
    remote: undefined,
    local_tok: undefined,
  };

  private _conflict: boolean;
  private _conflictState: Signal<this, boolean> = new Signal<this, boolean>(this);

  constructor(file: File) {
    this._file = file;
  }

  get file(): File {
    return this._file;
  }

  get path(): string {
    return this._file.path;
  }

  get cursor() {
    return this._cursor;
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

  setCursorToken(pos: CodeMirror.Pos) {
    const text = this.versions.local.split('\n');
    let line = text[pos.line];

    const before = line.slice(0, pos.ch);
    const after = line.slice(pos.ch);
    line = before + this._token + after;

    text[pos.line] = line;
    this.addVersion(text.join('\n'), 'local_tok');
  }

  private _removeCursorToken(input: string) {
    const text = input.split('\n');
    for (let i = 0; i < text.length; i++) {
      if (text[i].indexOf(this._token) > -1) {
        const line = i;
        const ch = text[i].indexOf(this._token);
        this._cursor = { line: line, ch: ch };
        break;
      }
    }
    return input.replace(this._token, '');
  }

  addVersion(text: string, origin: 'base' | 'local' | 'remote' | 'local_tok'): void {
    this._versions[origin] = text;
  }

  async mergeVersions(): Promise<string> {
    if (this.versions.local == this.versions.remote){
      this.addVersion(this.versions.local, 'base');
      return undefined;
    }
    const merged = merge(this.versions.remote, this.versions.base, this.versions.local_tok);
    if (this._isConflict(merged)) {
      await this._resolveConflicts(merged);
    } else {
      let text = this._mergeResult(merged[0]);
      text = this._removeCursorToken(text);
      this.addVersion(text, 'base');
    }
    this._updateState(false);
    return this._versions.base;
  }

  private _isConflict(merged): boolean {
    return merged.length > 1 || !merged[0] || merged[0].conflict;
  }

  private _mergeResult(merged): string {
    return merged ? merged.ok.join('') : '';
  }

  private async _resolveConflicts(merged): Promise<void> {
    let resolved = true;
    const result = merged.map(segment => {
      if (segment.ok) return this._mergeResult(segment);

      const base = segment.conflict.o;
      const remote = segment.conflict.a;
      const local = segment.conflict.b;

      const content = this._resolveFalseConflict(base, remote, local);
      if (!content) resolved = false;

      return content ? content : segment;
    });

    if (resolved) {
      let text = result.join('');
      text = this._removeCursorToken(text);
      this.addVersion(text, 'base');
    } else {
      await this._resolveDialog(result);
    }
  }

  private _resolveFalseConflict(base, remote, local): string {
    let ret = undefined;
    const local_raw = local.replace(this._token, '');

    if (base === '' &&(local_raw.startsWith(remote) || remote.startsWith(local_raw)))
      ret = (local_raw.startsWith(remote) ? local_raw : remote).replace(local_raw, local);
    else {
      console.log(base);
      console.log(local);
      console.log(remote);
    }
    return ret;
  }

  private _updateState(state: boolean){
    if (state != this.conflict){
      this._conflict = state;
      this._conflictState.emit(state);
    }
  }

  private async _resolveDialog(result): Promise<void> {
    const body = 
      `"${this.path}" has a conflict. Would you like to revert to a previous version?\
      \n(Note that ignoring conflicts will stop git sync.)`;
    // const resolveBtn = Dialog.okButton({ label: 'Resolve Conflicts' });
    const localBtn = Dialog.okButton({ label: 'Revert to Local' });
    const remoteBtn = Dialog.okButton({ label: 'Revert to Remote' });
    const ignoreBtn = Dialog.warnButton({ label: 'Ignore Conflict' })
    return showDialog({
      title: 'Merge Conflicts',
      body,
      buttons: [ignoreBtn, remoteBtn, localBtn],
    }).then(result => {
      if (result.button.label === 'Revert to Local') {
        const text = this._removeCursorToken(this._versions.local);
        this.addVersion(text, 'base');
      }
      if (result.button.label === 'Revert to Remote') {
        this.addVersion(this._versions.remote, 'base');
        this._cursor = { line: 0, ch: 0 };
      }
      if (result.button.label === 'Resolve Conflicts') {
        // TO DO (ashleyswang) : open an editor for 3 way merging
      }
      if (result.button.label === 'Ignore') {
        this._updateState(true);
        throw new Error('ConflictError: Unresolved conflicts in repository. Stopping sync procedure.');
      }
    });
  }

}
